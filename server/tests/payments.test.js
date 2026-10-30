const express = require('express');
const request = require('supertest');
const paymentRoutes = require('../routes/paymentRoutes');
const {
  validatePakMobile,
  detectCardBrand,
} = require('../controllers/paymentController');

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

describe('Payment Helper Functions', () => {
  it('validates authentic Pakistani mobile formats', () => {
    expect(validatePakMobile('03001234567')).toBe(true);
    expect(validatePakMobile('0345 9876543')).toBe(true);
    expect(validatePakMobile('+923218765432')).toBe(true);
    expect(validatePakMobile('923001122334')).toBe(true);
  });

  it('rejects invalid or foreign mobile numbers', () => {
    expect(validatePakMobile('02134567890')).toBe(false); // PTCL landline
    expect(validatePakMobile('123456')).toBe(false);
    expect(validatePakMobile('+14155552671')).toBe(false);
    expect(validatePakMobile(null)).toBe(false);
    expect(validatePakMobile('')).toBe(false);
  });

  it('detects card brand accurately', () => {
    expect(detectCardBrand('4242424242424242')).toBe('Visa');
    expect(detectCardBrand('5100000000000000')).toBe('Mastercard');
    expect(detectCardBrand('378282246310005')).toBe('Amex');
    expect(detectCardBrand('5081680000000000')).toBe('PayPak');
  });
});

describe('GET /api/payments/methods', () => {
  it('returns list of supported Pakistani payment methods', async () => {
    const res = await request(app).get('/api/payments/methods');
    expect(res.status).toBe(200);
    expect(res.body.currency).toBe('PKR');
    expect(Array.isArray(res.body.methods)).toBe(true);

    const methodIds = res.body.methods.map((m) => m.id);
    expect(methodIds).toContain('jazzcash');
    expect(methodIds).toContain('easypaisa');
    expect(methodIds).toContain('card_online');
    expect(methodIds).toContain('pay_at_table');
  });
});

describe('POST /api/payments/initiate', () => {
  it('rejects initiation without valid positive amount', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 0, method: 'jazzcash' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid payment method', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 1500, method: 'unsupported_bitcoin' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects JazzCash without valid mobile number', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 2500, method: 'jazzcash', accountNumber: '021334455' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('valid 11-digit mobile number');
  });

  it('initiates JazzCash session and returns demo OTP', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 2500, method: 'jazzcash', accountNumber: '03001234567' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transactionRef).toMatch(/^JC_/);
    expect(res.body.requiresOtp).toBe(true);
    expect(res.body.demoOtp).toBe('123456');
    expect(res.body.maskedAccount).toContain('0300');
  });

  it('initiates EasyPaisa session and returns demo OTP', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 1800, method: 'easypaisa', accountNumber: '03459876543' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transactionRef).toMatch(/^EP_/);
    expect(res.body.requiresOtp).toBe(true);
    expect(res.body.demoOtp).toBe('123456');
  });

  it('rejects online card with invalid expiration format', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({
        amount: 3200,
        method: 'card_online',
        cardNumber: '4242424242424242',
        cardExpiry: '2028-12',
        cardCvv: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('MM/YY format');
  });

  it('initiates online Card 3DS session with valid card details', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({
        amount: 3200,
        method: 'card_online',
        cardNumber: '4242424242424242',
        cardExpiry: '12/28',
        cardCvv: '456',
        cardHolder: 'Sarah Ahmed',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transactionRef).toMatch(/^CARD_/);
    expect(res.body.cardBrand).toBe('Visa');
    expect(res.body.maskedAccount).toBe('•••• •••• •••• 4242');
  });

  it('immediately confirms offline pay_at_table without requiring OTP', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 4500, method: 'pay_at_table' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.requiresOtp).toBe(false);
  });
});

describe('POST /api/payments/verify-otp', () => {
  it('rejects confirmation with incorrect OTP', async () => {
    const initRes = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 1500, method: 'jazzcash', accountNumber: '03001234567' });

    const ref = initRes.body.transactionRef;

    const verifyRes = await request(app)
      .post('/api/payments/verify-otp')
      .send({ transactionRef: ref, otp: '999999' });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.message).toContain('Invalid verification code');
  });

  it('successfully verifies with 123456 and produces official receipt number', async () => {
    const initRes = await request(app)
      .post('/api/payments/initiate')
      .send({ amount: 2100, method: 'easypaisa', accountNumber: '03451122334' });

    const ref = initRes.body.transactionRef;

    const verifyRes = await request(app)
      .post('/api/payments/verify-otp')
      .send({ transactionRef: ref, otp: '123456' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.status).toBe('Success');
    expect(verifyRes.body.receiptNumber).toMatch(/^AURA-RCP-/);
    expect(verifyRes.body.paidAt).toBeDefined();
  });
});

describe('POST /api/payments/tokenize-card', () => {
  it('tokenizes card securely without saving raw numbers', async () => {
    const res = await request(app)
      .post('/api/payments/tokenize-card')
      .send({
        cardNumber: '5100123456789012',
        cardHolder: 'Ali Raza',
        cardExpiry: '11/27',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cardToken).toMatch(/^tok_mastercard_/);
    expect(res.body.last4).toBe('9012');
    expect(res.body.brand).toBe('Mastercard');
  });
});
