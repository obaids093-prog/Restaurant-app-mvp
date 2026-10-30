const { parseTableQRPayload } = require('../controllers/tableController');
const express = require('express');
const request = require('supertest');
const tableRoutes = require('../routes/tableRoutes');

// Create test app for routes
const app = express();
app.use(express.json());
app.use('/api/tables', tableRoutes);

describe('Table QR Code Payload Parser', () => {
  it('parses valid aura:// URI scheme', () => {
    const res = parseTableQRPayload('aura://table?branch=lhr_gulberg&table=4');
    expect(res).toEqual({
      branchId: 'lhr_gulberg',
      tableNumber: '4',
    });
  });

  it('parses Islamabad branch URI scheme', () => {
    const res = parseTableQRPayload('aura://table?branch=isb_blue_area&table=11');
    expect(res).toEqual({
      branchId: 'isb_blue_area',
      tableNumber: '11',
    });
  });

  it('parses JSON formatted string payload', () => {
    const res = parseTableQRPayload(JSON.stringify({ branchId: 'lhr_gulberg', tableNumber: '7' }));
    expect(res).toEqual({
      branchId: 'lhr_gulberg',
      tableNumber: '7',
    });
  });

  it('parses natural table strings like "Table 5"', () => {
    const res = parseTableQRPayload('Table 5');
    expect(res).toEqual({
      branchId: 'lhr_gulberg',
      tableNumber: '5',
    });
  });

  it('parses raw table number "9"', () => {
    const res = parseTableQRPayload('9');
    expect(res).toEqual({
      branchId: 'lhr_gulberg',
      tableNumber: '9',
    });
  });

  it('returns null for empty or invalid strings', () => {
    expect(parseTableQRPayload('')).toBeNull();
    expect(parseTableQRPayload('invalid-random-text-without-digits')).toBeNull();
    expect(parseTableQRPayload(null)).toBeNull();
  });
});

describe('POST /api/tables/verify-qr', () => {
  it('rejects malformed QR code with 400', async () => {
    const res = await request(app)
      .post('/api/tables/verify-qr')
      .send({ code: 'some-non-table-garbage' });

    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('verifies valid aura:// QR code and returns table + branch metadata', async () => {
    const res = await request(app)
      .post('/api/tables/verify-qr')
      .send({ code: 'aura://table?branch=lhr_gulberg&table=4' });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.tableNumber).toBe('4');
    expect(res.body.branch.branchId).toBe('lhr_gulberg');
    expect(res.body.branch.branchName).toContain('Gulberg');
    expect(res.body.deepLink).toBe('aura://table?branch=lhr_gulberg&table=4');
  });

  it('verifies table with Islamabad branch tag', async () => {
    const res = await request(app)
      .post('/api/tables/verify-qr')
      .send({ code: 'aura://table?branch=isb_blue_area&table=8' });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.tableNumber).toBe('8');
    expect(res.body.branch.branchId).toBe('isb_blue_area');
    expect(res.body.branch.branchCity).toBe('Islamabad');
  });

  it('verifies table when tableNumber is provided directly in request body', async () => {
    const res = await request(app)
      .post('/api/tables/verify-qr')
      .send({ tableNumber: '3', branchId: 'lhr_gulberg' });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.tableNumber).toBe('3');
  });
});

describe('GET /api/tables/qr-standees', () => {
  it('returns standees list for Lahore Gulberg by default', async () => {
    const res = await request(app).get('/api/tables/qr-standees');
    expect(res.status).toBe(200);
    expect(res.body.branch.branchId).toBe('lhr_gulberg');
    expect(Array.isArray(res.body.standees)).toBe(true);
    expect(res.body.standees.length).toBeGreaterThanOrEqual(1);
    expect(res.body.standees[0].deepLink).toContain('aura://table?branch=lhr_gulberg');
  });

  it('returns standees for Islamabad branch when requested', async () => {
    const res = await request(app).get('/api/tables/qr-standees?branchId=isb_blue_area');
    expect(res.status).toBe(200);
    expect(res.body.branch.branchId).toBe('isb_blue_area');
    expect(res.body.standees[0].deepLink).toContain('branch=isb_blue_area');
  });
});
