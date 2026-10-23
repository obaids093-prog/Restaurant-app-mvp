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
const Review = require('../models/Review');

let customerUser;
let customerToken;
let otherCustomerUser;
let otherCustomerToken;
let managerUser;
let managerToken;
let testDish;
let servedOrder;
let pendingOrder;

beforeAll(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required to run test suite');
  }
  await mongoose.connect(uri);

  // Clean any existing test items
  await Review.deleteMany({ comment: { $regex: /test/i } });
  await User.deleteMany({ email: { $in: ['hamza.test@gmail.com', 'sara.test@gmail.com', 'tariq.test@gmail.com'] } });
  await MenuItem.deleteMany({ name: 'Test Handmade Agnolotti' });

  // Seed test users
  customerUser = await User.create({
    name: 'Hamza Malik',
    email: 'hamza.test@gmail.com',
    password: 'password123',
    role: 'customer',
  });
  customerToken = jwt.sign({ id: customerUser._id, role: 'customer' }, process.env.JWT_SECRET);

  otherCustomerUser = await User.create({
    name: 'Sara Khan',
    email: 'sara.test@gmail.com',
    password: 'password123',
    role: 'customer',
  });
  otherCustomerToken = jwt.sign(
    { id: otherCustomerUser._id, role: 'customer' },
    process.env.JWT_SECRET
  );

  managerUser = await User.create({
    name: 'Chef Tariq',
    email: 'tariq.test@gmail.com',
    password: 'password123',
    role: 'manager',
  });
  managerToken = jwt.sign({ id: managerUser._id, role: 'manager' }, process.env.JWT_SECRET);

  // Seed test dish
  testDish = await MenuItem.create({
    name: 'Handmade Agnolotti',
    description: 'Piedmontese pasta pockets with summer truffle',
    price: 1850,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-agnolotti',
    rating: 0,
    ratingAverage: 0,
    ratingCount: 0,
  });

  // Seed served order for customerUser
  servedOrder = await Order.create({
    user: customerUser._id,
    customerName: customerUser.name,
    items: [
      {
        menuItem: testDish._id,
        name: testDish.name,
        price: testDish.price,
        quantity: 1,
      },
    ],
    subtotal: 1850,
    totalAmount: 2220,
    status: 'Served',
  });

  // Seed pending order for customerUser
  pendingOrder = await Order.create({
    user: customerUser._id,
    customerName: customerUser.name,
    items: [
      {
        menuItem: testDish._id,
        name: testDish.name,
        price: testDish.price,
        quantity: 1,
      },
    ],
    subtotal: 1850,
    totalAmount: 2220,
    status: 'Pending',
  });
});

afterAll(async () => {
  if (testDish) {
    await Review.deleteMany({ menuItem: testDish._id });
    await MenuItem.findByIdAndDelete(testDish._id);
  }
  if (servedOrder) await Order.findByIdAndDelete(servedOrder._id);
  if (pendingOrder) await Order.findByIdAndDelete(pendingOrder._id);
  if (customerUser) await User.findByIdAndDelete(customerUser._id);
  if (otherCustomerUser) await User.findByIdAndDelete(otherCustomerUser._id);
  if (managerUser) await User.findByIdAndDelete(managerUser._id);
  await mongoose.disconnect();
});

describe('Feature 1: Ratings and Reviews Endpoints', () => {
  let createdReviewId;

  describe('POST /api/reviews', () => {
    it('successfully creates review for a dish in a Served order', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: servedOrder._id.toString(),
          menuItemId: testDish._id.toString(),
          rating: 5,
          comment: 'Exquisite pasta and delicate truffle aroma.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.comment).toBe('Exquisite pasta and delicate truffle aroma.');
      expect(res.body.data.user.name).toBe('Hamza Malik');

      createdReviewId = res.body.data._id;

      // Verify atomic update on MenuItem
      const dish = await MenuItem.findById(testDish._id);
      expect(dish.ratingCount).toBe(1);
      expect(dish.ratingAverage).toBe(5);
    });

    it('rejects duplicate review for the same dish on the same order', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: servedOrder._id.toString(),
          menuItemId: testDish._id.toString(),
          rating: 4,
          comment: 'Trying to review again.',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already reviewed/i);
    });

    it('rejects review if order status is not Served', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: pendingOrder._id.toString(),
          menuItemId: testDish._id.toString(),
          rating: 4,
          comment: 'Order is still pending',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Served orders/i);
    });

    it('rejects review if order belongs to another customer (wrong owner)', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          orderId: servedOrder._id.toString(),
          menuItemId: testDish._id.toString(),
          rating: 5,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/own orders/i);
    });

    it('rejects invalid rating values (< 1 or > 5 or non-integer)', async () => {
      // Create a fresh served order for otherCustomer
      const otherOrder = await Order.create({
        user: otherCustomerUser._id,
        customerName: otherCustomerUser.name,
        items: [{ menuItem: testDish._id, name: testDish.name, price: testDish.price, quantity: 1 }],
        subtotal: 1850,
        totalAmount: 2220,
        status: 'Served',
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          orderId: otherOrder._id.toString(),
          menuItemId: testDish._id.toString(),
          rating: 6,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/integer between 1 and 5/i);
    });
  });

  describe('GET /api/menu/:id/reviews', () => {
    it('returns paginated reviews for a menu item (public)', async () => {
      const res = await request(app).get(`/api/menu/${testDish._id}/reviews?page=1&limit=10`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toBeDefined();
      expect(res.body.data.reviews.length).toBe(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.ratingAverage).toBe(5);
      expect(res.body.data.ratingCount).toBe(1);
    });
  });

  describe('GET /api/reviews/my', () => {
    it('returns reviews created by the authenticated customer', async () => {
      const res = await request(app)
        .get('/api/reviews/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].menuItem.name).toBe('Handmade Agnolotti');
    });

    it('rejects request without token', async () => {
      const res = await request(app).get('/api/reviews/my');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/reviews/:id', () => {
    it('allows owner to edit rating and comment within 24 hours', async () => {
      const res = await request(app)
        .patch(`/api/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          rating: 4,
          comment: 'Updated review: Still great, slightly salty broth.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.comment).toBe('Updated review: Still great, slightly salty broth.');

      // Atomic rating check on MenuItem
      const dish = await MenuItem.findById(testDish._id);
      expect(dish.ratingAverage).toBe(4);
      expect(dish.ratingCount).toBe(1);
    });

    it('rejects edit from a different user (wrong owner)', async () => {
      const res = await request(app)
        .patch(`/api/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({ rating: 2 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/reviews/:id/reply', () => {
    it('allows manager to reply to a review', async () => {
      const res = await request(app)
        .patch(`/api/reviews/${createdReviewId}/reply`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          reply: 'Thank you for your valuable feedback! We have adjusted the seasoning.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.managerReply).toBe(
        'Thank you for your valuable feedback! We have adjusted the seasoning.'
      );
    });

    it('rejects reply from a non-manager customer (wrong role)', async () => {
      const res = await request(app)
        .patch(`/api/reviews/${createdReviewId}/reply`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reply: 'Unauthorized reply' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/manager/i);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('rejects deletion by non-owner, non-manager', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(403);
    });

    it('allows owner to delete their review and recalculates dish rating', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dish = await MenuItem.findById(testDish._id);
      expect(dish.ratingCount).toBe(0);
      expect(dish.ratingAverage).toBe(0);
    });
  });
});
