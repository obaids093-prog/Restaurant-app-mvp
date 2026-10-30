const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

jest.setTimeout(60000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_aura_2026';

const app = require('../server');
const User = require('../models/User');
const { _otpStore, normalizePakPhone } = require('../controllers/authController');

beforeAll(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required to run test suite');
  await mongoose.connect(uri);
  await User.deleteMany({
    $or: [
      { email: /@customer\.aura\.pk$/ },
      { email: 'phone.test.user@gmail.com' },
      { phone: '03001234567' },
    ],
  });
});

afterAll(async () => {
  await User.deleteMany({
    $or: [
      { email: /@customer\.aura\.pk$/ },
      { email: 'phone.test.user@gmail.com' },
      { phone: '03001234567' },
    ],
  });
  await mongoose.disconnect();
});

describe('Feature: Phone OTP & Gmail Auth Rule Enforcement', () => {
  describe('Phone OTP Registration', () => {
    it('creates a new user via phone verify-otp with exempt @customer.aura.pk email', async () => {
      const phone = '03001234567';

      // Request OTP
      const sendRes = await request(app)
        .post('/api/auth/phone/send-otp')
        .send({ phone });

      expect(sendRes.status).toBe(200);
      expect(sendRes.body.success).toBe(true);

      const normalized = normalizePakPhone(phone);
      const record = _otpStore.get(normalized);
      expect(record).toBeDefined();
      expect(record.code).toMatch(/^\d{6}$/);

      // Verify OTP and create user
      const verifyRes = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({
          phone,
          otp: record.code,
          name: 'Bilal Khan',
        });

      expect(verifyRes.status).toBe(201);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.isNewUser).toBe(true);
      expect(verifyRes.body.user.phone).toBe('03001234567');
      expect(verifyRes.body.user.email).toMatch(/@customer\.aura\.pk$/);

      // Verify user in database
      const dbUser = await User.findOne({ phone: '03001234567' });
      expect(dbUser).toBeDefined();
      expect(dbUser.name).toBe('Bilal Khan');
      expect(dbUser.email).toBe(verifyRes.body.user.email);
    });
  });

  describe('Strict Email Registration (@gmail.com Enforcement)', () => {
    it('rejects registration with non-gmail addresses (e.g. @yahoo.com)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Imran Ali',
          email: 'imran@yahoo.com',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/@gmail\.com/i);
    });

    it('rejects registration with @customer.aura.pk submitted directly', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker User',
          email: 'fake@customer.aura.pk',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/@gmail\.com/i);
    });

    it('successfully registers with a valid @gmail.com address', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Phone Test User',
          email: 'phone.test.user@gmail.com',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('phone.test.user@gmail.com');
    });
  });

  describe('Staff Account Creation (POST /api/auth/staff)', () => {
    let mgrToken;

    beforeAll(async () => {
      const jwt = require('jsonwebtoken');
      const mgr = await User.create({
        name: 'Staff Test Manager',
        email: 'staff.mgr.test@gmail.com',
        password: 'Password123',
        role: 'manager',
      });
      mgrToken = jwt.sign({ id: mgr._id, role: 'manager' }, process.env.JWT_SECRET);
    });

    afterAll(async () => {
      await User.deleteMany({ email: { $in: ['staff.mgr.test@gmail.com', 'new.staff@gmail.com'] } });
    });

    it('returns clean 400 when attempting to create staff with a non-gmail address', async () => {
      const res = await request(app)
        .post('/api/auth/staff')
        .set('Authorization', `Bearer ${mgrToken}`)
        .send({
          name: 'Chef Asad',
          email: 'asad@restaurant.pk',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/@gmail\.com/i);
    });

    it('creates staff account when a valid @gmail.com address is provided', async () => {
      const res = await request(app)
        .post('/api/auth/staff')
        .set('Authorization', `Bearer ${mgrToken}`)
        .send({
          name: 'Chef Asad',
          email: 'new.staff@gmail.com',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('new.staff@gmail.com');
      expect(res.body.user.role).toBe('manager');
    });
  });

  describe('Feature: 1-Tap Social Sign-In (Google & Apple)', () => {
    afterAll(async () => {
      await User.deleteMany({
        email: {
          $in: [
            'google.tester@gmail.com',
            'apple.tester@privaterelay.appleid.com',
          ],
        },
      });
    });

    it('rejects social login if provider is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/social-login')
        .send({ provider: 'facebook', email: 'test@gmail.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Valid provider/i);
    });

    it('rejects social login if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/social-login')
        .send({ provider: 'google' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Valid email is required/i);
    });

    it('creates and authenticates a new user via Google Sign-In', async () => {
      const res = await request(app)
        .post('/api/auth/social-login')
        .send({
          provider: 'google',
          email: 'google.tester@gmail.com',
          name: 'Hamza Google',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('google.tester@gmail.com');
      expect(res.body.user.name).toBe('Hamza Google');
      expect(res.body.user.authProvider).toBe('google');
      expect(res.body.isNewUser).toBe(true);
    });

    it('authenticates existing user via Google without creating duplicate', async () => {
      const res = await request(app)
        .post('/api/auth/social-login')
        .send({
          provider: 'google',
          email: 'google.tester@gmail.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.isNewUser).toBe(false);
    });

    it('creates and authenticates a user via Apple Sign-In with relay email', async () => {
      const res = await request(app)
        .post('/api/auth/social-login')
        .send({
          provider: 'apple',
          email: 'apple.tester@privaterelay.appleid.com',
          name: 'Sarah Apple',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.authProvider).toBe('apple');
    });
  });
});
