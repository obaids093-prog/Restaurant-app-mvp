import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { brand } from '../../config/brand';
import { styles } from './digitalReceiptStyles';

export default function DigitalReceiptModal({
  visible,
  order,
  receiptNumber,
  onClose,
}) {
  const { colors, isDark } = useTheme();
  const [copiedToast, setCopiedToast] = useState(false);

  if (!visible || !order) return null;

  const ticketId =
    order._id || order.id ? String(order._id || order.id).slice(-6).toUpperCase() : 'AURA-01';
  const items = Array.isArray(order.items) ? order.items : [];
  const grandTotal = Number(order.totalAmount || order.total || order.totalPrice || 0);

  // Compile formatted WhatsApp message
  const compileWhatsAppText = () => {
    const lines = [
      `✨ *AURA Artisanal Dining* ✨`,
      `📍 _${order.branchName || 'AURA • Gulberg III, Lahore'}_`,
      `🧾 *Official Order Receipt: #${ticketId}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Customer:* ${order.customerName || 'Valued Guest'}`,
      `🍽 *Service:* ${order.orderType || 'Dine-in'}${order.tableNumber ? ` (${order.tableNumber})` : ''}`,
      `💳 *Payment:* ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'ONLINE'} (${order.paymentStatus || 'Paid'})`,
      receiptNumber ? `🔢 *Receipt #:* ${receiptNumber}` : '',
      `━━━━━━━━━━━━━━━━━━━━`,
      `📋 *ORDER SUMMARY:*`,
    ];

    items.forEach((item, idx) => {
      const qty = item.quantity || 1;
      const price = Number(item.price || 0) * qty;
      lines.push(`${idx + 1}. ${item.name} x${qty} — Rs. ${price.toLocaleString()}`);
    });

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💰 *GRAND TOTAL: Rs. ${grandTotal.toLocaleString()}*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🙏 Thank you for dining with AURA!`);

    return lines.filter(Boolean).join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = compileWhatsAppText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleShareSms = () => {
    const text = `AURA Receipt #${ticketId}: Rs. ${grandTotal.toLocaleString()} confirmed. Thank you for dining with us!`;
    const url = Platform.select({
      ios: `sms:&body=${encodeURIComponent(text)}`,
      android: `sms:?body=${encodeURIComponent(text)}`,
      default: `sms:?body=${encodeURIComponent(text)}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  const handleCopy = async () => {
    const text = compileWhatsAppText();
    if (Clipboard?.setStringAsync) {
      await Clipboard.setStringAsync(text);
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[
            styles.receiptContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Copied Feedback Toast */}
            {copiedToast && (
              <View style={styles.toastBar}>
                <Text style={styles.toastText}>✓ Copied receipt to clipboard!</Text>
              </View>
            )}

            {/* Receipt Top Crest & Branch Header */}
            <View style={styles.receiptHeader}>
              <Ionicons name="restaurant" size={28} color={colors.primary} style={{ marginBottom: 6 }} />
              <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
                A U R A
              </Text>
              <Text style={[styles.branchSubtitle, { color: colors.textSecondary }]}>
                {order.branchName || 'AURA • Gulberg III, Lahore'}
              </Text>
              <Text
                style={[
                  styles.ticketBadge,
                  { backgroundColor: `${colors.primary}18`, color: colors.primary },
                ]}
              >
                TICKET #{ticketId}
              </Text>
            </View>

            {/* Folio Info Grid */}
            <View style={styles.infoSection}>
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.mutedText }]}>Guest</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {order.customerName || 'Valued Guest'}
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.mutedText }]}>Service</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {order.orderType || 'Dine-in'}
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.mutedText }]}>Table / Mode</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {order.tableNumber || 'Main Hall'}
                </Text>
              </View>
            </View>

            {/* Courses / Items Breakdown */}
            <View style={styles.itemsSection}>
              <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
                Items ({items.length})
              </Text>
              {items.map((item, idx) => {
                const qty = item.quantity || 1;
                const lineTotal = Number(item.price || 0) * qty;
                return (
                  <View key={item.id || idx} style={styles.itemRow}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {qty}x {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                      {brand.formatPrice(lineTotal)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Financial Calculations */}
            <View style={styles.calculationSection}>
              {order.subtotal ? (
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                  <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
                    {brand.formatPrice(order.subtotal)}
                  </Text>
                </View>
              ) : null}

              {order.discountAmount > 0 ? (
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.ready || '#10B981' }]}>
                    Voucher Discount
                  </Text>
                  <Text style={[styles.calcValue, { color: colors.ready || '#10B981' }]}>
                    - {brand.formatPrice(order.discountAmount)}
                  </Text>
                </View>
              ) : null}

              {order.serviceCharge > 0 ? (
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Service Charge (5%)</Text>
                  <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
                    {brand.formatPrice(order.serviceCharge)}
                  </Text>
                </View>
              ) : null}

              {order.salesTax > 0 ? (
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Sales Tax (15%)</Text>
                  <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
                    {brand.formatPrice(order.salesTax)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Grand Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  {brand.formatPrice(grandTotal)}
                </Text>
              </View>
            </View>

            {/* Quick Actions: WhatsApp Share, Copy, SMS */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShareWhatsApp}
                style={styles.whatsappBtn}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.btnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCopy}
                style={[
                  styles.copyBtn,
                  { borderColor: colors.cardBorder, backgroundColor: colors.surface },
                ]}
              >
                <Ionicons name="copy-outline" size={16} color={colors.textPrimary} />
                <Text style={[styles.btnText, { color: colors.textPrimary }]}>Copy</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
                Done
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
