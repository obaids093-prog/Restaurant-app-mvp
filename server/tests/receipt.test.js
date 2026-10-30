const {
  formatWhatsAppReceipt,
  formatSmsReceipt,
  generateWhatsAppShareUrl,
} = require('../services/receiptService');

describe('Digital Receipt Service', () => {
  const sampleOrder = {
    _id: '507f1f77bcf86cd799439011',
    customerName: 'Sarah Ahmed',
    orderType: 'Dine-in',
    tableNumber: 'Table 4',
    branchName: 'AURA • Gulberg III, Lahore',
    branchCity: 'Lahore',
    paymentMethod: 'jazzcash',
    paymentStatus: 'Paid',
    paymentRef: 'JC_1793345_A9B',
    items: [
      { name: 'Truffle Wagyu Slider', quantity: 2, price: 1200 },
      { name: 'Artisan Mocktail', quantity: 1, price: 650 },
    ],
    subtotal: 3050,
    discountAmount: 305,
    serviceCharge: 137.25,
    salesTax: 411.75,
    totalAmount: 3294,
  };

  it('formats comprehensive WhatsApp receipt with emojis, items, and folio breakdown', () => {
    const text = formatWhatsAppReceipt(sampleOrder);
    expect(text).toContain('AURA Artisanal Dining');
    expect(text).toContain('Sarah Ahmed');
    expect(text).toContain('Truffle Wagyu Slider x2 — Rs. 2,400');
    expect(text).toContain('Artisan Mocktail x1 — Rs. 650');
    expect(text).toContain('GRAND TOTAL: Rs. 3,294');
    expect(text).toContain('JAZZCASH');
    expect(text).toContain('JC_1793345_A9B');
  });

  it('formats concise SMS receipt within text limit', () => {
    const sms = formatSmsReceipt(sampleOrder);
    expect(sms).toContain('Order #439011 confirmed!');
    expect(sms).toContain('Rs. 3,294');
    expect(sms).toContain('Paid');
  });

  it('generates wa.me link with encoded text', () => {
    const url = generateWhatsAppShareUrl('+92 300 1234567', 'Hello AURA');
    expect(url).toContain('https://wa.me/923001234567?text=Hello%20AURA');
  });

  it('generates wa.me share link without specific phone', () => {
    const url = generateWhatsAppShareUrl(null, 'Receipt text');
    expect(url).toContain('https://wa.me/?text=Receipt%20text');
  });
});
