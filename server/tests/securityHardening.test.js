const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

jest.setTimeout(60000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_aura_2026';

const app = require('../server');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');
const tokenService = require('../services/tokenService');

describe('Security Hardening Test Suite (Part C)', () => {
  let userToken;
  let userId;
  let managerToken;
  let managerId;

  beforeAll(async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is required to run test suite');
    await mongoose.connect(uri);

    await User.deleteMany({
      email: { $in: ['sec.customer@test.com', 'sec.mgr@test.com'] },
    });

    // Create standard test user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Security User',
        email: 'sec.customer@test.com',
        password: 'Password123',
      });
    userToken = userRes.body.token;
    userId = userRes.body.user.id || userRes.body.user._id;

    // Create manager user
    const mgr = await User.create({
      name: 'Security Manager',
      email: 'sec.mgr@test.com',
      password: 'Password123',
      role: 'manager',
    });
    managerId = mgr._id;
    managerToken = tokenService.generateAccessToken(mgr._id);
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: ['sec.customer@test.com', 'sec.mgr@test.com'] },
    });
    await RefreshToken.deleteMany({ user: { $in: [userId, managerId] } });
    await AuditLog.deleteMany({ action: { $regex: /TEST_/ } });
    await mongoose.disconnect();
  });

  describe('1. Zod Input Rejection (Strict Schemas & Type Checks)', () => {
    it('rejects request body with unexpected / unknown injected fields with 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sec.customer@test.com',
          password: 'Password123',
          injectedAdminRole: 'root_admin', // Unknown field rejected by .strict()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Unrecognized key|unknown|invalid/i);
    });

    it('rejects order with negative item quantities with 400', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              id: '507f1f77bcf86cd799439011',
              quantity: -5,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Quantity must be at least 1/i);
    });
  });

  describe('2. Refresh Token Rotation & Replay/Reuse Detection', () => {
    it('issues a valid refresh token and rotates it upon refresh request', async () => {
      const initialToken = await tokenService.createRefreshToken(userId);
      expect(initialToken.rawToken).toBeDefined();

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: initialToken.rawToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(initialToken.rawToken);

      // Verify the old token is marked as revoked in DB
      const oldHash = tokenService.hashToken(initialToken.rawToken);
      const dbOldToken = await RefreshToken.findOne({ tokenHash: oldHash });
      expect(dbOldToken.revokedAt).not.toBeNull();
    });

    it('detects replay attack: re-using a revoked token invalidates the entire family', async () => {
      // Create initial token
      const token1 = await tokenService.createRefreshToken(userId);

      // Rotate it legitimately once -> token2
      const rotateRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: token1.rawToken });

      expect(rotateRes.status).toBe(200);
      const token2 = rotateRes.body.refreshToken;

      // Attacker replays token1 (which was already rotated/revoked)
      const attackRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: token1.rawToken });

      // Must be rejected with 401
      expect(attackRes.status).toBe(401);
      expect(attackRes.body.message).toMatch(/Reuse detected|Session invalidated/i);

      // Because reuse was detected, token2 should now also be revoked
      const followUpRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: token2 });

      expect(followUpRes.status).toBe(401);
    });

    it('revokes refresh token on explicit logout', async () => {
      const token = await tokenService.createRefreshToken(userId);

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: token.rawToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Subsequent refresh must fail
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: token.rawToken });

      expect(refreshRes.status).toBe(401);
    });
  });

  describe('3. Magic Bytes File Upload Validation', () => {
    const dummyUploadPath = path.join(__dirname, '../uploads/test_fake_file.jpg');

    afterAll(() => {
      try {
        if (fs.existsSync(dummyUploadPath)) {
          fs.unlinkSync(dummyUploadPath);
        }
      } catch (_) {}
    });

    it('rejects text file disguised as a JPEG with 400', async () => {
      // Write ASCII text file disguised with .jpg extension
      fs.writeFileSync(dummyUploadPath, '<html><script>alert("xss")</script></html>');

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('image', dummyUploadPath);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/signatures|Invalid image file/i);
    });
  });

  describe('4. Manager Audit Logging', () => {
    it('records an audit log entry when manager performs an audited action', async () => {
      const auditService = require('../services/auditService');

      await auditService.logAction({
        actor: { _id: managerId, email: 'sec.mgr@test.com', role: 'manager' },
        action: 'TEST_ACTION',
        target: '507f1f77bcf86cd799439011',
        targetModel: 'Order',
        details: { test: true },
        ip: '127.0.0.1',
      });

      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find((l) => l.action === 'TEST_ACTION');
      expect(found).toBeDefined();
      expect(found.targetModel).toBe('Order');
    });

    it('forbids non-managers from accessing /api/audit-logs with 403', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
