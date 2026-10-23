const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

jest.setTimeout(60000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_aura_2026';

const app = require('../server');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');

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

  // Clean test accounts and data
  await User.deleteMany({ email: { $in: ['loyalty.patron@gmail.com', 'loyalty.mgr@gmail.com'] } });
  await MenuItem.deleteMany({ name: 'Test Loyalty Tasting Dish' });

  customerUser = await User.create({
    name: 'Loyal Patron',
    email: 'loyalty.patron@gmail.com',
    password: 'password123',
    role: 'customer',
    loyaltyPoints: 300,
    lifetimePoints: 300,
    loyaltyTier: 'Bronze',
  });
  customerToken = jwt.sign({ id: customerUser._id, role: 'customer' }, process.env.JWT_SECRET);

  managerUser = await User.create({
    name: 'Loyalty Manager',
    email: 'loyalty.mgr@gmail.com',
    password: 'password123',
    role: 'manager',
  });
  managerToken = jwt.sign({ id: managerUser._id, role: 'manager' }, process.env.JWT_SECRET);

  testDish = await MenuItem.create({
    name: 'Test Loyalty Tasting Dish',
    description: 'Fine dining dish for points calculation',
    price: 3000,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-tasting-dish',
  });
});

afterAll(async () => {
  if (customerUser) {
    await LoyaltyTransaction.deleteMany({ user: customerUser._id });
    await Order.deleteMany({ user: customerUser._id });
    await User.findByIdAndDelete(customerUser._id);
  }
  if (managerUser) await User.findByIdAndDelete(managerUser._id);
  if (testDish) await MenuItem.findByIdAndDelete(testDish._id);
  await mongoose.disconnect();
});

describe('Feature 3: Patron Loyalty Points & VIP Tiers', () => {
  describe('GET /api/loyalty (Patron Loyalty Profile)', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/loyalty');
      expect(res.status).toBe(401);
    });

    it('returns patron points, tier, multiplier, and next tier progression', async () => {
      const res = await request(app)
        .get('/api/loyalty')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.points).toBe(300);
      expect(res.body.data.lifetimePoints).toBe(300);
      expect(res.body.data.tier).toBe('Bronze');
      expect(res.body.data.multiplier).toBe(1.0);
      expect(res.body.data.nextTier).toBe('Silver');
      expect(res.body.data.pointsToNextTier).toBe(200); // 500 - 300
      expect(Array.isArray(res.body.data.history)).toBe(true);
    });
  });

  describe('POST /api/loyalty/quote (Redemption Quoting)', () => {
    it('rejects redemption under 50 points with 400', async () => {
      const res = await request(app)
        .post('/api/loyalty/quote')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ points: 20, subtotal: 2000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/minimum redemption is 50/i);
    });

    it('rejects redemption exceeding customer balance with 400', async () => {
      const res = await request(app)
        .post('/api/loyalty/quote')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ points: 500, subtotal: 3000 }); // user has 300 points

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/insufficient points/i);
    });

    it('rejects redemption exceeding 50% of food subtotal with 400', async () => {
      const res = await request(app)
        .post('/api/loyalty/quote')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ points: 200, subtotal: 300 }); // 50% of 300 is 150 points

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot exceed 50%/i);
    });

    it('successfully quotes points redemption when conditions are met', async () => {
      const res = await request(app)
        .post('/api/loyalty/quote')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ points: 100, subtotal: 3000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountAmount).toBe(100);
      expect(res.body.data.remainingPoints).toBe(200);
    });
  });

  describe('Checkout Points Redemption (POST /api/orders)', () => {
    it('deducts points from user balance and applies discount to order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItem: testDish._id, quantity: 1 }], // subtotal = 3000
          pointsToRedeem: 100,
          orderType: 'Dine-in',
        });

      expect(res.status).toBe(201);
      expect(res.body.subtotal).toBe(3000);
      expect(res.body.pointsRedeemed).toBe(100);
      expect(res.body.pointsDiscountAmount).toBe(100);

      // Verify financial calculation: discountedSubtotal = 3000 - 100 = 2900
      // serviceCharge = 2900 * 0.05 = 145
      // salesTax = 2900 * 0.15 = 435
      // total = 2900 + 145 + 435 = 3480
      expect(res.body.totalAmount).toBe(3480);

      // Verify points deducted from user account
      const user = await User.findById(customerUser._id);
      expect(user.loyaltyPoints).toBe(200); // was 300, now 200

      // Verify transaction ledger logged
      const tx = await LoyaltyTransaction.findOne({ user: customerUser._id, type: 'redeem' });
      expect(tx).toBeDefined();
      expect(tx.points).toBe(-100);
      expect(tx.balanceAfter).toBe(200);
    });

    it('rejects order checkout if pointsToRedeem exceeds customer balance', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItem: testDish._id, quantity: 1 }],
          pointsToRedeem: 500, // balance is 200
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/insufficient points/i);
    });
  });

  describe('Points Earning on Served Orders & Tier Upgrade Progression', () => {
    let orderToServe;

    beforeAll(async () => {
      // Place an order for 2 dishes = Rs. 6000 subtotal
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItem: testDish._id, quantity: 2 }],
          orderType: 'Dine-in',
        });

      orderToServe = res.body;
    });

    it('awards loyalty points when manager marks order as Served and upgrades tier', async () => {
      // Advance status from Pending -> Preparing -> Ready -> Served
      await request(app)
        .patch(`/api/orders/${orderToServe._id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'Preparing' });

      await request(app)
        .patch(`/api/orders/${orderToServe._id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'Ready' });

      const serveRes = await request(app)
        .patch(`/api/orders/${orderToServe._id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'Served' });

      expect(serveRes.status).toBe(200);

      // Verify points earned on order:
      // Subtotal = 6000, 1 point per 100 = 60 points earned
      const updatedOrder = await Order.findById(orderToServe._id);
      expect(updatedOrder.pointsEarned).toBe(60);
      expect(updatedOrder.pointsAwarded).toBe(true);

      // Customer previously had 200 balance, 300 lifetime
      // + 60 = 260 balance, 360 lifetime
      const user = await User.findById(customerUser._id);
      expect(user.loyaltyPoints).toBe(260);
      expect(user.lifetimePoints).toBe(360);

      // Verify earn transaction in ledger
      const earnTx = await LoyaltyTransaction.findOne({
        user: customerUser._id,
        order: orderToServe._id,
        type: 'earn',
      });
      expect(earnTx).toBeDefined();
      expect(earnTx.points).toBe(60);
    });

    it('does not duplicate points if awardOrderPoints is called again (idempotent)', async () => {
      const loyaltyService = require('../services/loyaltyService');
      const secondCall = await loyaltyService.awardOrderPoints(orderToServe._id);

      // Returns already earned points without crediting again
      expect(secondCall.pointsEarned).toBe(60);

      const user = await User.findById(customerUser._id);
      expect(user.loyaltyPoints).toBe(260); // Still 260, not 320!
    });

    it('automatically upgrades patron to Silver tier when lifetime points reach 500', async () => {
      // Manually top up lifetime points to 500 to test tier recalculation
      await User.findByIdAndUpdate(customerUser._id, { lifetimePoints: 500 });

      const res = await request(app)
        .get('/api/loyalty')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe('Silver');
      expect(res.body.data.multiplier).toBe(1.05); // 5% bonus multiplier
      expect(res.body.data.nextTier).toBe('Gold');
    });
  });
});
