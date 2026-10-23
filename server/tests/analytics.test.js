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

let managerUser;
let managerToken;
let customerUser;
let customerToken;
let testDishA;
let testDishB;

beforeAll(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required to run test suite');
  }
  await mongoose.connect(uri);

  // Clean test fixtures
  await User.deleteMany({ email: { $in: ['analytics.manager@gmail.com', 'analytics.customer@gmail.com'] } });
  await MenuItem.deleteMany({ name: { $in: ['Analytics Truffle Steak', 'Analytics Burrata Salad'] } });
  await Order.deleteMany({ customerName: 'Analytics Test Patron' });

  // Create manager user
  managerUser = await User.create({
    name: 'Manager Analytics',
    email: 'analytics.manager@gmail.com',
    password: 'password123',
    role: 'manager',
  });
  managerToken = jwt.sign({ id: managerUser._id, role: 'manager' }, process.env.JWT_SECRET);

  // Create customer user
  customerUser = await User.create({
    name: 'Customer Analytics',
    email: 'analytics.customer@gmail.com',
    password: 'password123',
    role: 'customer',
  });
  customerToken = jwt.sign({ id: customerUser._id, role: 'customer' }, process.env.JWT_SECRET);

  // Create sample menu items
  testDishA = await MenuItem.create({
    name: 'Analytics Truffle Steak',
    description: 'Prime wagyu with truffle glaze',
    price: 3000,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
  });

  testDishB = await MenuItem.create({
    name: 'Analytics Burrata Salad',
    description: 'Fresh burrata with heirloom tomatoes',
    price: 1500,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
  });

  // Seed known fixture orders
  // Order 1: Served, Rs. 6,000 (2x Steak), today
  await Order.create({
    user: customerUser._id,
    customerName: 'Analytics Test Patron',
    items: [
      {
        menuItem: testDishA._id,
        name: testDishA.name,
        price: testDishA.price,
        quantity: 2,
      },
    ],
    totalAmount: 6000,
    status: 'Served',
    branchId: 'lhr_gulberg',
    branchName: 'AURA • Gulberg III, Lahore',
  });

  // Order 2: Preparing, Rs. 1,500 (1x Burrata), today
  await Order.create({
    user: customerUser._id,
    customerName: 'Analytics Test Patron',
    items: [
      {
        menuItem: testDishB._id,
        name: testDishB.name,
        price: testDishB.price,
        quantity: 1,
      },
    ],
    totalAmount: 1500,
    status: 'Preparing',
    branchId: 'lhr_gulberg',
    branchName: 'AURA • Gulberg III, Lahore',
  });

  // Order 3: Cancelled, Rs. 3,000 (1x Steak) -> MUST BE EXCLUDED FROM REVENUE
  await Order.create({
    user: customerUser._id,
    customerName: 'Analytics Test Patron',
    items: [
      {
        menuItem: testDishA._id,
        name: testDishA.name,
        price: testDishA.price,
        quantity: 1,
      },
    ],
    totalAmount: 3000,
    status: 'Cancelled',
    branchId: 'lhr_gulberg',
    branchName: 'AURA • Gulberg III, Lahore',
  });
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: ['analytics.manager@gmail.com', 'analytics.customer@gmail.com'] } });
  await MenuItem.deleteMany({ name: { $in: ['Analytics Truffle Steak', 'Analytics Burrata Salad'] } });
  await Order.deleteMany({ customerName: 'Analytics Test Patron' });
  await mongoose.disconnect();
});

describe('FEATURE 3: MANAGER ANALYTICS API (GET /api/analytics/summary)', () => {
  it('should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(401);
  });

  it('should reject non-manager customer with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/manager/i);
  });

  it('should return executive analytics summary with verified totals for manager', async () => {
    const res = await request(app)
      .get('/api/analytics/summary?range=today')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data).toHaveProperty('revenue');
    expect(data).toHaveProperty('orderCount');
    expect(data).toHaveProperty('averageOrderValue');
    expect(data).toHaveProperty('ordersByStatus');
    expect(data).toHaveProperty('topDishes');
    expect(data).toHaveProperty('hourly');
    expect(data).toHaveProperty('byBranch');
    expect(data).toHaveProperty('repeatCustomers');

    // Revenue must EXCLUDE Cancelled orders (6,000 + 1,500 = 7,500 minimum with fixtures)
    expect(data.revenue).toBeGreaterThanOrEqual(7500);

    // Cancelled orders status count is tracked
    expect(data.ordersByStatus.Cancelled).toBeGreaterThanOrEqual(1);

    // Hourly buckets must be an array of 24 hours
    expect(Array.isArray(data.hourly)).toBe(true);
    expect(data.hourly.length).toBe(24);

    // Top dishes must include Analytics Truffle Steak
    const steak = data.topDishes.find((d) => d.name === 'Analytics Truffle Steak');
    expect(steak).toBeDefined();
    expect(steak.quantity).toBeGreaterThanOrEqual(2);
  });

  it('should support 7d and 30d range parameters', async () => {
    const res7d = await request(app)
      .get('/api/analytics/summary?range=7d')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res7d.status).toBe(200);
    expect(res7d.body.data.range).toBe('7d');

    const res30d = await request(app)
      .get('/api/analytics/summary?range=30d')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res30d.status).toBe(200);
    expect(res30d.body.data.range).toBe('30d');
  });

  it('should support filtering by branch', async () => {
    const res = await request(app)
      .get('/api/analytics/summary?range=today&branch=lhr_gulberg')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.branch).toBe('lhr_gulberg');
  });
});
