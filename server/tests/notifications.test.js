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
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

let patronUser;
let patronToken;
let otherPatron;
let otherToken;
let managerUser;
let managerToken;
let testDish;

beforeAll(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required to run test suite');
  }
  await mongoose.connect(uri);

  // Clean test accounts
  await User.deleteMany({
    email: {
      $in: [
        'notif.patron@gmail.com',
        'notif.other@gmail.com',
        'notif.mgr@gmail.com',
      ],
    },
  });
  await MenuItem.deleteMany({ name: 'Notification Tasting Ribeye' });

  patronUser = await User.create({
    name: 'Notification Patron',
    email: 'notif.patron@gmail.com',
    password: 'password123',
    role: 'customer',
  });
  patronToken = jwt.sign({ id: patronUser._id, role: 'customer' }, process.env.JWT_SECRET);

  otherPatron = await User.create({
    name: 'Other Patron',
    email: 'notif.other@gmail.com',
    password: 'password123',
    role: 'customer',
  });
  otherToken = jwt.sign({ id: otherPatron._id, role: 'customer' }, process.env.JWT_SECRET);

  managerUser = await User.create({
    name: 'Notification Manager',
    email: 'notif.mgr@gmail.com',
    password: 'password123',
    role: 'manager',
  });
  managerToken = jwt.sign({ id: managerUser._id, role: 'manager' }, process.env.JWT_SECRET);

  testDish = await MenuItem.create({
    name: 'Notification Tasting Ribeye',
    description: 'Juicy ribeye steak with truffle butter',
    price: 3500,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-ribeye-steak',
    isAvailable: true,
  });

  // Clean notifications for test users
  await Notification.deleteMany({
    user: { $in: [patronUser._id, otherPatron._id, managerUser._id] },
  });
});

afterAll(async () => {
  await Notification.deleteMany({
    user: { $in: [patronUser._id, otherPatron._id, managerUser._id] },
  });
  await Order.deleteMany({ user: patronUser._id });
  await Review.deleteMany({ user: patronUser._id });
  await MenuItem.deleteMany({ name: 'Notification Tasting Ribeye' });
  await User.deleteMany({
    email: {
      $in: [
        'notif.patron@gmail.com',
        'notif.other@gmail.com',
        'notif.mgr@gmail.com',
      ],
    },
  });
  await mongoose.connection.close();
});

describe('Feature 4: In-App Notification System', () => {
  let createdNotifId;

  it('1. GET /api/notifications should require authentication', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('2. GET /api/notifications should return empty list initially with pagination metadata', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${patronToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
    expect(res.body.data.unreadCount).toBe(0);
    expect(res.body.data.total).toBe(0);
  });

  it('3. GET /api/notifications/unread-count should return 0 unread', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${patronToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBe(0);
  });

  it('4. Directly created notification appears in feed and increments unread count', async () => {
    const notif = await notificationService.createNotification({
      user: patronUser._id,
      type: 'welcome',
      title: 'Welcome to AURA!',
      body: 'Thank you for joining our culinary journey.',
    });
    createdNotifId = notif._id.toString();

    // Fetch feed
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${patronToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications.length).toBe(1);
    expect(res.body.data.notifications[0].title).toBe('Welcome to AURA!');
    expect(res.body.data.notifications[0].isRead).toBe(false);
    expect(res.body.data.unreadCount).toBe(1);

    // Check count endpoint
    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${patronToken}`);

    expect(countRes.body.data.unreadCount).toBe(1);
  });

  it('5. PATCH /api/notifications/:id/read marks single notification as read', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${createdNotifId}/read`)
      .set('Authorization', `Bearer ${patronToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
    expect(res.body.data.readAt).toBeTruthy();

    // Verify unread count is now 0
    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${patronToken}`);

    expect(countRes.body.data.unreadCount).toBe(0);
  });

  it('6. Cannot mark another user’s notification as read', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${createdNotifId}/read`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  it('7. PATCH /api/notifications/read-all marks all notifications as read', async () => {
    // Create two new unread notifications
    await notificationService.createNotification({
      user: patronUser._id,
      type: 'general',
      title: 'Alert 1',
      body: 'First test notification',
    });
    await notificationService.createNotification({
      user: patronUser._id,
      type: 'general',
      title: 'Alert 2',
      body: 'Second test notification',
    });

    // Verify unread count is 2
    let countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${patronToken}`);
    expect(countRes.body.data.unreadCount).toBe(2);

    // Call read-all
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${patronToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.modifiedCount).toBe(2);
    expect(res.body.data.unreadCount).toBe(0);

    // Verify count dropped to 0
    countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${patronToken}`);
    expect(countRes.body.data.unreadCount).toBe(0);
  });

  it('8. Manager advancing order status generates order_status notification for patron', async () => {
    // Patron places an order
    const placeRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({
        items: [{ menuItem: testDish._id, quantity: 1 }],
        orderType: 'Dine-in',
      });

    expect(placeRes.status).toBe(201);
    const orderId = placeRes.body._id;

    // Manager updates order status to 'Preparing'
    const statusRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'Preparing' });

    expect(statusRes.status).toBe(200);

    // Check patron's notifications
    const notifs = await Notification.find({
      user: patronUser._id,
      type: 'order_status',
      refId: orderId,
    });

    expect(notifs.length).toBeGreaterThanOrEqual(1);
    expect(notifs[0].title).toContain('Kitchen');
  });

  it('9. Manager replying to dish review generates review_reply notification for reviewer', async () => {
    // Complete the order to 'Served' so review is allowed
    const orders = await Order.find({ user: patronUser._id });
    const order = orders[0];
    order.status = 'Served';
    await order.save();

    // Patron creates a review
    const reviewRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({
        orderId: order._id,
        menuItemId: testDish._id,
        rating: 5,
        comment: 'Outstanding flavor!',
      });

    expect(reviewRes.status).toBe(201);
    const reviewId = reviewRes.body.data._id;

    // Manager replies to review
    const replyRes = await request(app)
      .patch(`/api/reviews/${reviewId}/reply`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reply: 'Thank you for dining with us! We appreciate your patronage.' });

    expect(replyRes.status).toBe(200);

    // Check patron's notifications
    const replyNotif = await Notification.findOne({
      user: patronUser._id,
      type: 'review_reply',
      refId: reviewId,
    });

    expect(replyNotif).toBeTruthy();
    expect(replyNotif.title).toContain('Management Replied');
    expect(replyNotif.body).toContain('Thank you for dining with us');
  });

  it('10. Filter unreadOnly query returns only unread notifications', async () => {
    // Add one new unread
    await notificationService.createNotification({
      user: patronUser._id,
      type: 'general',
      title: 'Only Unread',
      body: 'Should be visible in unreadOnly query',
    });

    const res = await request(app)
      .get('/api/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${patronToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications.every((n) => n.isRead === false)).toBe(true);
  });

  it('11. POST /api/notifications/push-token rejects missing or malformed token', async () => {
    const res1 = await request(app)
      .post('/api/notifications/push-token')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({});
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post('/api/notifications/push-token')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({ token: 'invalid_token_format' });
    expect(res2.status).toBe(400);
  });

  it('12. POST /api/notifications/push-token registers valid ExponentPushToken to user', async () => {
    const validToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    const res = await request(app)
      .post('/api/notifications/push-token')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({ token: validToken });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBe(validToken);

    const updatedUser = await User.findById(patronUser._id);
    expect(updatedUser.pushTokens).toContain(validToken);
  });

  it('13. POST /api/notifications/push-token deduplicates token using $addToSet', async () => {
    const validToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    await request(app)
      .post('/api/notifications/push-token')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({ token: validToken });

    const updatedUser = await User.findById(patronUser._id);
    const count = updatedUser.pushTokens.filter((t) => t === validToken).length;
    expect(count).toBe(1);
  });

  it('14. DELETE /api/notifications/push-token unregisters token from user', async () => {
    const validToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    const res = await request(app)
      .delete('/api/notifications/push-token')
      .set('Authorization', `Bearer ${patronToken}`)
      .send({ token: validToken });

    expect(res.status).toBe(200);

    const updatedUser = await User.findById(patronUser._id);
    expect(updatedUser.pushTokens).not.toContain(validToken);
  });

  it('15. pushNotificationService.sendPushToUser gracefully handles dispatches', async () => {
    const pushNotificationService = require('../services/pushNotificationService');
    const result = await pushNotificationService.sendPushToUser(patronUser._id, {
      title: 'Test Push',
      body: 'Testing non-blocking delivery',
      data: { orderId: 'test123' },
    });
    // With 0 valid tokens registered at this point, sent should be 0 and no error thrown
    expect(result.sent).toBe(0);
  });
});
