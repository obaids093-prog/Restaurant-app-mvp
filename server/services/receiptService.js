/**
 * server/services/receiptService.js
 * ═══════════════════════════════════════════════════════════
 * Generates formatted WhatsApp, SMS, and digital receipts for orders
 * with zero paid third-party dependencies (Twilio/WhatsApp Cloud API optional).
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Formats order as WhatsApp message with bolding and emojis
 */
function formatWhatsAppReceipt(order, brandInfo = {}) {
  if (!order) return '';

  const restaurantName = brandInfo.name || 'AURA Artisanal Dining';
  const branchName = order.branchName || 'AURA • Gulberg III, Lahore';
  const ticketId = order._id ? String(order._id).slice(-6).toUpperCase() : 'AURA-01';
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.totalAmount || order.totalPrice || 0);

  const lines = [
    `✨ *${restaurantName}* ✨`,
    `📍 _${branchName}_`,
    `🧾 *Official Order Receipt: #${ticketId}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Customer:* ${order.customerName || 'Valued Guest'}`,
    `🍽 *Service:* ${order.orderType || 'Dine-in'}${order.tableNumber ? ` (${order.tableNumber})` : ''}`,
    `💳 *Payment:* ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'PENDING'} (${order.paymentStatus || 'Pending'})`,
    ...(order.paymentRef ? [`🔢 *Ref:* ${order.paymentRef}`] : []),
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 *ORDER SUMMARY:*`,
  ];

  items.forEach((item, idx) => {
    const qty = item.quantity || 1;
    const price = Number(item.price || 0) * qty;
    lines.push(`${idx + 1}. ${item.name} x${qty} — Rs. ${price.toLocaleString()}`);
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  if (order.subtotal) lines.push(`• Subtotal: Rs. ${Number(order.subtotal).toLocaleString()}`);
  if (order.discountAmount > 0) lines.push(`• Discount: -Rs. ${Number(order.discountAmount).toLocaleString()}`);
  if (order.serviceCharge > 0) lines.push(`• Service Charge (5%): Rs. ${Number(order.serviceCharge).toLocaleString()}`);
  if (order.salesTax > 0) lines.push(`• Sales Tax (15%): Rs. ${Number(order.salesTax).toLocaleString()}`);
  lines.push(`💰 *GRAND TOTAL: Rs. ${total.toLocaleString()}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🙏 Thank you for dining with AURA!`);
  lines.push(`📲 Track live status: aura://track?orderId=${order._id || ticketId}`);

  return lines.join('\n');
}

/**
 * Formats a concise SMS payload suitable for standard 160-character limits
 */
function formatSmsReceipt(order) {
  if (!order) return '';
  const ticketId = order._id ? String(order._id).slice(-6).toUpperCase() : 'AURA-01';
  const total = Number(order.totalAmount || order.totalPrice || 0);
  return `AURA: Order #${ticketId} confirmed! Total Rs. ${total.toLocaleString()} (${order.paymentStatus || 'Pending'}). Preparing at ${order.branchCity || 'Lahore'} branch.`;
}

/**
 * Generates pre-filled WhatsApp deep link
 */
function generateWhatsAppShareUrl(phone, text) {
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

module.exports = {
  formatWhatsAppReceipt,
  formatSmsReceipt,
  generateWhatsAppShareUrl,
};
