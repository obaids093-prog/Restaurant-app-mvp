// tests/passwordReset.test.js
// ═══════════════════════════════════════════════════════════
// Tests for the password reset flow (forgot-password + reset-password).
// Covers:
//   1. Request reset → always returns 200 (no email enumeration)
//   2. Valid token → password is changed, old token invalidated
//   3. Expired token → rejected
//   4. Already-used token → rejected
//   5. Weak password → rejected
//   6. Zod validation on both endpoints
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

jest.setTimeout(60000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_aura_2026';

const request = require('supertest');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');

const TEST_EMAIL = `resettest_${Date.now()}@test.com`;
let userId;

beforeAll(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required to run test suite');
  await mongoose.connect(uri);

  // Create test user directly in DB
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash('OldPass123', salt);
  const user = await User.create({
    name: 'Reset Tester',
    email: TEST_EMAIL,
    password: hashed,
    role: 'customer',
  });
  userId = user._id;
});

afterAll(async () => {
  await User.deleteOne({ _id: userId }).catch(() => {});
  await PasswordResetToken.deleteMany({ user: userId }).catch(() => {});
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
});

describe('Password Reset Flow', () => {
  test('POST /api/auth/forgot-password returns 200 even for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody_exists_here_xyz@test.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/if an account/i);
  });

  test('POST /api/auth/forgot-password creates a token for existing user', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_EMAIL });

    expect(res.statusCode).toBe(200);

    // Verify token was created in DB
    const tokenDoc = await PasswordResetToken.findOne({ user: userId, usedAt: null });
    expect(tokenDoc).not.toBeNull();
    expect(tokenDoc.tokenHash).toBeDefined();
    expect(tokenDoc.expiresAt).toBeInstanceOf(Date);
  });

  test('POST /api/auth/reset-password rejects invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'totally_invalid_token_here_1234567890', newPassword: 'NewPass456' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid|expired/i);
  });

  test('POST /api/auth/reset-password rejects weak password', async () => {
    // Create a valid token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await PasswordResetToken.create({
      user: userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'short1' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/8/);
  });

  test('POST /api/auth/reset-password succeeds with valid token and strong password', async () => {
    // Create a fresh token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await PasswordResetToken.create({
      user: userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'BrandNewPass789' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/reset successfully/i);

    // Verify login works with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'BrandNewPass789' });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  test('POST /api/auth/reset-password rejects already-used token', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await PasswordResetToken.create({
      user: userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      usedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'AnotherPass123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid|expired/i);
  });

  test('POST /api/auth/reset-password rejects expired token', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await PasswordResetToken.create({
      user: userId,
      tokenHash,
      expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 min ago
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'FreshPass999' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  test('Zod rejects forgot-password with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  test('Zod rejects reset-password with missing token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ newPassword: 'ValidPass123' });

    expect(res.statusCode).toBe(400);
  });
});
