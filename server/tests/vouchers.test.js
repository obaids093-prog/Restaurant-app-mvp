const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

jest.setTimeout(30000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_aura_2026';

const app = require('../server');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Voucher = require('../models/Voucher');

let customerUser;
let customerToken;
let managerUser;
let managerToken;
let testDish;

beforeAll(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required to run test suite');
  }
  await mongoose.connect(uri);

  // Clean test vouchers and test data
  await Voucher.deleteMany({ code: { $regex: /^TEST_/ } });
  await User.deleteMany({ email: { $in: ['voucher.customer@gmail.com', 'voucher.manager@gmail.com'] } });
  await MenuItem.deleteMany({ name: 'Test Voucher Dish' });

  customerUser = await User.create({
    name: 'Voucher Patron',
    email: 'voucher.customer@gmail.com',
    password: 'password123',
    role: 'customer',
  });
  customerToken = jwt.sign({ id: customerUser._id, role: 'customer' }, process.env.JWT_SECRET);

  managerUser = await User.create({
    name: 'Voucher Manager',
    email: 'voucher.manager@gmail.com',
    password: 'password123',
    role: 'manager',
  });
  managerToken = jwt.sign({ id: managerUser._id, role: 'manager' }, process.env.JWT_SECRET);

  testDish = await MenuItem.create({
    name: 'Test Voucher Dish',
    description: 'Fresh truffle risotto for voucher tests',
    price: 2000,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-test-dish',
  });
});

afterAll(async () => {
  await Voucher.deleteMany({ code: { $regex: /^TEST_/ } });
  if (testDish) {
    await Order.deleteMany({ 'items.menuItem': testDish._id });
    await MenuItem.findByIdAndDelete(testDish._id);
  }
  if (customerUser) await User.findByIdAndDelete(customerUser._id);
  if (managerUser) await User.findByIdAndDelete(managerUser._id);
  await mongoose.disconnect();
});

describe('Feature 2: Promotional Coupon & Voucher Engine', () => {
  describe('POST /api/vouchers/validate (Public Validation Engine)', () => {
    beforeAll(async () => {
      await Voucher.create({
        code: 'TEST_PERC20',
        discountType: 'percentage',
        discountValue: 20,
        validUntil: new Date(Date.now() + 86400000), // tomorrow
        isActive: true,
      });

      await Voucher.create({
        code: 'TEST_FIXED500',
        discountType: 'fixed',
        discountValue: 500,
        validUntil: new Date(Date.now() + 86400000),
        isActive: true,
      });

      await Voucher.create({
        code: 'TEST_EXPIRED',
        discountType: 'percentage',
        discountValue: 15,
        validUntil: new Date(Date.now() - 86400000), // yesterday
        isActive: true,
      });

      await Voucher.create({
        code: 'TEST_INACTIVE',
        discountType: 'percentage',
        discountValue: 25,
        validUntil: new Date(Date.now() + 86400000),
        isActive: false,
      });

      await Voucher.create({
        code: 'TEST_ISB_ONLY',
        discountType: 'percentage',
        discountValue: 10,
        applicableBranchId: 'isb_f7',
        validUntil: new Date(Date.now() + 86400000),
        isActive: true,
      });

      await Voucher.create({
        code: 'TEST_CAP300',
        discountType: 'percentage',
        discountValue: 50,
        maxDiscountAmount: 300,
        validUntil: new Date(Date.now() + 86400000),
        isActive: true,
      });

      await Voucher.create({
        code: 'TEST_MIN3000',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 3000,
        validUntil: new Date(Date.now() + 86400000),
        isActive: true,
      });

      await Voucher.create({
        code: 'TEST_MAXED',
        discountType: 'percentage',
        discountValue: 30,
        usageLimit: 3,
        usageCount: 3,
        validUntil: new Date(Date.now() + 86400000),
        isActive: true,
      });
    });

    it('successfully validates percentage voucher and computes discount', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_PERC20', subtotal: 2000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountAmount).toBe(400); // 20% of 2000
      expect(res.body.data.discountedSubtotal).toBe(1600);
    });

    it('successfully validates fixed voucher and computes discount', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_FIXED500', subtotal: 2000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountAmount).toBe(500);
      expect(res.body.data.discountedSubtotal).toBe(1500);
    });

    it('respects maxDiscountAmount cap for percentage vouchers', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_CAP300', subtotal: 2000 }); // 50% would be 1000, capped at 300

      expect(res.status).toBe(200);
      expect(res.body.data.discountAmount).toBe(300);
    });

    it('rejects expired vouchers with 400', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_EXPIRED', subtotal: 2000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('rejects inactive vouchers with 400', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_INACTIVE', subtotal: 2000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive/i);
    });

    it('rejects voucher if subtotal is below minOrderAmount', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_MIN3000', subtotal: 2000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/minimum order/i);
    });

    it('rejects voucher if usage limit is reached', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_MAXED', subtotal: 2000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/maximum usage limit/i);
    });

    it('enforces branch restriction (rejects wrong branch, accepts valid branch)', async () => {
      const wrongBranch = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_ISB_ONLY', subtotal: 2000, branchId: 'lhr_gulberg' });

      expect(wrongBranch.status).toBe(400);
      expect(wrongBranch.body.message).toMatch(/specific outlet/i);

      const correctBranch = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_ISB_ONLY', subtotal: 2000, branchId: 'isb_f7' });

      expect(correctBranch.status).toBe(200);
      expect(correctBranch.body.success).toBe(true);
    });

    it('returns 404 for unknown voucher code', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .send({ code: 'TEST_DOES_NOT_EXIST', subtotal: 2000 });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/invalid/i);
    });
  });

  describe('Order Placement & Voucher Usage Tracking (POST /api/orders)', () => {
    let usageTrackingVoucher;

    beforeAll(async () => {
      usageTrackingVoucher = await Voucher.create({
        code: 'TEST_ORDER_USE',
        discountType: 'percentage',
        discountValue: 20,
        validUntil: new Date(Date.now() + 86400000),
        isActive: true,
        usageCount: 0,
        usageLimit: 10,
      });
    });

    it('applies voucher discount during checkout and increments usageCount', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItem: testDish._id, quantity: 1 }],
          promoCode: 'TEST_ORDER_USE',
          orderType: 'Dine-in',
        });

      expect(res.status).toBe(201);
      expect(res.body.subtotal).toBe(2000);
      expect(res.body.discountAmount).toBe(400); // 20% of 2000
      expect(res.body.promoCode).toBe('TEST_ORDER_USE');

      // Verify financial calculation: discountedSubtotal = 1600
      // serviceCharge = 1600 * 0.05 = 80
      // salesTax = 1600 * 0.15 = 240
      // total = 1600 + 80 + 240 = 1920
      expect(res.body.totalAmount).toBe(1920);

      // Verify voucher usageCount incremented in database
      const updatedVoucher = await Voucher.findById(usageTrackingVoucher._id);
      expect(updatedVoucher.usageCount).toBe(1);
    });

    it('rejects order creation if an invalid voucher code is submitted', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItem: testDish._id, quantity: 1 }],
          promoCode: 'TEST_INVALID_CODE_XYZ',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid/i);
    });
  });

  describe('Manager Voucher Management (CRUD & RBAC)', () => {
    let createdVoucherId;

    it('rejects unauthenticated requests to manager voucher routes', async () => {
      const res = await request(app).get('/api/vouchers');
      expect(res.status).toBe(401);
    });

    it('rejects regular customer access to manager voucher routes (RBAC)', async () => {
      const res = await request(app)
        .get('/api/vouchers')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('allows manager to create a new promotional voucher', async () => {
      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          code: 'TEST_MGR_NEW',
          description: 'Manager special VIP voucher',
          discountType: 'percentage',
          discountValue: 15,
          minOrderAmount: 1000,
          validUntil: new Date(Date.now() + 86400000 * 30),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('TEST_MGR_NEW');
      createdVoucherId = res.body.data._id;
    });

    it('allows manager to list all vouchers with status filter', async () => {
      const res = await request(app)
        .get('/api/vouchers?status=active')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.vouchers)).toBe(true);
    });

    it('allows manager to update voucher details', async () => {
      const res = await request(app)
        .put(`/api/vouchers/${createdVoucherId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          description: 'Updated VIP patron voucher description',
          discountValue: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountValue).toBe(25);
      expect(res.body.data.description).toBe('Updated VIP patron voucher description');
    });

    it('allows manager to toggle active status of a voucher', async () => {
      const res = await request(app)
        .patch(`/api/vouchers/${createdVoucherId}/toggle`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false); // was true, now false
    });

    it('allows manager to delete a voucher', async () => {
      const res = await request(app)
        .delete(`/api/vouchers/${createdVoucherId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const found = await Voucher.findById(createdVoucherId);
      expect(found).toBeNull();
    });
  });
});
