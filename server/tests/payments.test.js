const express = require('express');
const request = require('supertest');
const paymentRoutes = require('../routes/paymentRoutes');
const {
  AVAILABLE_PAYMENT_METHODS,
} = require('../controllers/paymentController');

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

describe('Payment Methods Configuration', () => {
  it('exposes only real in-person payment methods (cash & pay_at_table)', () => {
    const ids = AVAILABLE_PAYMENT_METHODS.map((m) => m.id);
    expect(ids).toEqual(['pay_at_table', 'cash']);
    expect(ids).not.toContain('jazzcash');
    expect(ids).not.toContain('easypaisa');
    expect(ids).not.toContain('card_online');
  });
});

describe('GET /api/payments/methods', () => {
  it('returns currency PKR and supported methods', async () => {
    const res = await request(app).get('/api/payments/methods');
    expect(res.status).toBe(200);
    expect(res.body.currency).toBe('PKR');
    expect(Array.isArray(res.body.methods)).toBe(true);

    const methodIds = res.body.methods.map((m) => m.id);
    expect(methodIds).toContain('cash');
    expect(methodIds).toContain('pay_at_table');
    expect(methodIds).not.toContain('jazzcash');
    expect(methodIds).not.toContain('easypaisa');
    expect(methodIds).not.toContain('card_online');
  });
});

describe('POST /api/payments/initiate', () => {
  it('rejects initiation without valid positive amount', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 0, method: 'cash' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects negative amount', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: -100, method: 'cash' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects simulated/unsupported payment methods like jazzcash', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 1500, method: 'jazzcash' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only cash and pay-at-table/i);
  });

  it('rejects card_online method', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 2000, method: 'card_online' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('successfully initiates cash payment', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 1250, method: 'cash' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.method).toBe('cash');
    expect(res.body.amount).toBe(1250);
    expect(res.body.requiresOtp).toBe(false);
    expect(res.body.transactionRef).toMatch(/^CASH_/);
  });

  it('successfully initiates pay_at_table payment', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 3500, method: 'pay_at_table' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.method).toBe('pay_at_table');
    expect(res.body.amount).toBe(3500);
    expect(res.body.requiresOtp).toBe(false);
    expect(res.body.transactionRef).toMatch(/^TABLE_/);
  });
});

describe('Removed Simulated Payment Endpoints', () => {
  it('verify-otp endpoint no longer exists (404)', async () => {
    const res = await request(app)
      .post('/api/payments/verify-otp')
      .send({ transactionRef: 'TEST_123', otp: '123456' });
    expect(res.status).toBe(404);
  });

  it('tokenize-card endpoint no longer exists (404)', async () => {
    const res = await request(app)
      .post('/api/payments/tokenize-card')
      .send({ cardNumber: '4242424242424242' });
    expect(res.status).toBe(404);
  });
});
