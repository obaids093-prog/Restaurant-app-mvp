import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useTheme } from '../context/ThemeContext';
import { useMenu } from '../context/MenuContext';

// Named rate constants for transparent breakdown
const SERVICE_CHARGE_RATE = 0.05;
const SALES_TAX_RATE = 0.15;

// Cross-platform alert helper to reduce complexity in event handlers
const showOrderAlert = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Pure payload builder extracted to minimize cognitive complexity
const buildOrderPayload = (user, cartState, calculations, orderType, tableNumber, pickupTime, getItemPrice) => {
  const isTakeaway =
    String(orderType || '').toLowerCase().includes('takeaway') ||
    String(orderType || '').toLowerCase().includes('curbside');
  const normalizedType = isTakeaway ? 'Takeaway' : 'Dine-in';

  return {
    customerId: user?.id || user?._id || 'guest',
    customerName: user?.name || 'Valued Guest',
    type: normalizedType,
    orderType: normalizedType,
    tableNumber: !isTakeaway ? tableNumber : '',
    pickupTime: isTakeaway ? pickupTime : '',
    items: (cartState?.items || []).map((i) => ({
      id: i.id || i._id,
      name: i.name,
      price: getItemPrice ? getItemPrice(i) : i.price,
      quantity: i.quantity,
      note: i.note || '',
    })),
    total: calculations.grandTotal,
    promoCode: cartState?.promoCode,
    discountPercent: cartState?.discountPercent || 0,
  };
};

// Reusable row for contact info display
const ContactInfoRow = ({ icon, text, color, textColor }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
    <Ionicons name={icon} size={16} color={color} style={{ marginRight: 8 }} />
    <Text style={{ fontSize: 13, color: textColor }}>{text}</Text>
  </View>
);

// Reusable row for a single cart item
const OrderItemRow = ({ item, colors, unitPrice }) => {
  const price = unitPrice !== undefined ? unitPrice : item.price;
  return (
    <View key={item.id} style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
          {item.quantity}x {item.name}
        </Text>
        {item.note ? (
          <Text style={[styles.itemNote, { color: colors.primary }]}>
            Note: "{item.note}"
          </Text>
        ) : null}
      </View>
      <Text style={[styles.itemTotal, { color: colors.textPrimary }]}>
        Rs. {(price * item.quantity).toLocaleString()}
      </Text>
    </View>
  );
};

// Place order button content (avoids ternary nesting in main JSX)
const PlaceOrderButtonContent = ({ isSubmitting, btnTextColor }) => {
  if (isSubmitting) {
    return (
      <>
        <ActivityIndicator size="small" color={btnTextColor} style={{ marginRight: 8 }} />
        <Text style={[styles.placeBtnText, { color: btnTextColor }]}>
          Dispatching to Kitchen...
        </Text>
      </>
    );
  }
  return (
    <>
      <Ionicons name="checkmark-circle" size={20} color={btnTextColor} style={{ marginRight: 8 }} />
      <Text style={[styles.placeBtnText, { color: btnTextColor }]}>
        Confirm & Dispatch to Kitchen
      </Text>
    </>
  );
};

export default function OrderSummaryScreen({ route, navigation }) {
  const { colors, isDark, shadows } = useTheme();
  const { user } = useAuth();
  const { cartState, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { menuItems, fetchMenu } = useMenu();

  // Refetch fresh menu on Order Summary focus
  useFocusEffect(
    useCallback(() => {
      fetchMenu().catch(() => {});
    }, [fetchMenu])
  );

  // Helper to ensure item price strictly reflects the latest fetched menu data
  const getItemPrice = useCallback(
    (item) => {
      const match = (menuItems || []).find(
        (m) =>
          (m.id && String(m.id) === String(item.id)) ||
          (m._id && String(m._id) === String(item._id || item.id)) ||
          (m.name && m.name.toLowerCase().trim() === item.name?.toLowerCase()?.trim())
      );
      return match && match.price !== undefined ? Number(match.price) : Number(item.price);
    },
    [menuItems]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    orderType = 'Dine-in',
    tableNumber = 'Table A-01 (Atrium Glasshouse)',
    pickupTime = 'In 25 minutes',
    calculations: rawCalculations,
  } = route.params || {};

  const btnTextColor = isDark ? '#472a00' : '#FFFFFF';
  const isDineIn = orderType === 'Dine-in';
  const userName = user?.name || 'Valued Guest';
  const phoneText = user?.phone || 'No phone linked (Update in Profile)';

  // Live calculations reflecting latest fetched menu prices
  const calculations = useMemo(() => {
    const subtotal = (cartState?.items || []).reduce(
      (sum, item) => sum + getItemPrice(item) * (Number(item.quantity) || 1),
      0
    );
    const discountRate = (cartState?.discountPercent || 0) / 100;
    const discountAmount = subtotal * discountRate;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const serviceCharge = discountedSubtotal * SERVICE_CHARGE_RATE;
    const salesTax = discountedSubtotal * SALES_TAX_RATE;
    const tipAmount = rawCalculations?.selectedTip
      ? discountedSubtotal * (rawCalculations.selectedTip / 100)
      : (rawCalculations?.tipAmount || 0);
    const grandTotal = discountedSubtotal + serviceCharge + salesTax + tipAmount;

    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      serviceCharge,
      salesTax,
      tipAmount,
      selectedTip: rawCalculations?.selectedTip,
      grandTotal,
    };
  }, [cartState?.items, cartState?.discountPercent, getItemPrice, rawCalculations]);

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    if (!user) {
      const msg = 'Please log in before placing your order.';
      setErrorMessage(msg);
      showOrderAlert('Authentication Required', msg);
      navigation.navigate('Login');
      return;
    }

    if (!cartState?.items || cartState.items.length === 0) {
      const msg = 'Your cart is empty. Please add items first.';
      setErrorMessage(msg);
      showOrderAlert('Empty Cart', msg);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const orderPayload = buildOrderPayload(
        user,
        cartState,
        calculations,
        orderType,
        tableNumber,
        pickupTime,
        getItemPrice
      );

      const newOrder = await createOrder(orderPayload);
      clearCart();

      // Navigate to live Order Tracking
      navigation.navigate('OrderTracking', { orderId: newOrder.id || newOrder._id });
    } catch (err) {
      console.error('Order dispatch error:', err);
      const errMsg = err.message || 'Unable to place order at this time.';
      setErrorMessage(errMsg);
      showOrderAlert('Order Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Banner */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.primary + '18' },
              ]}
            >
              <Ionicons name="receipt" size={24} color={colors.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Order Verification
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Please confirm your selection and delivery details.
              </Text>
            </View>
          </View>

          <View style={[styles.diningBadge, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons
              name={isDineIn ? 'restaurant' : 'bag-handle'}
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.diningBadgeText, { color: colors.textPrimary }]}>
              {isDineIn
                ? `Dine-In • ${tableNumber}`
                : `Takeaway • Pickup ${pickupTime}`}
            </Text>
          </View>
        </View>

        {/* Patron Contact & Dispatch Info */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <Text style={[styles.cardHeading, { color: colors.textMuted }]}>
            CONTACT & DISPATCH INFO
          </Text>

          <ContactInfoRow
            icon="person-outline"
            text={userName}
            color={colors.primary}
            textColor={colors.textPrimary}
          />
          <ContactInfoRow
            icon="call-outline"
            text={phoneText}
            color={colors.primary}
            textColor={user?.phone ? colors.textPrimary : colors.textMuted}
          />
          {user?.email ? (
            <ContactInfoRow
              icon="mail-outline"
              text={user.email}
              color={colors.primary}
              textColor={colors.textSecondary}
            />
          ) : null}
        </View>

        {/* Selected Dishes Summary */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <Text style={[styles.cardHeading, { color: colors.textMuted }]}>
            ORDERED ITEMS ({cartState.items.length})
          </Text>

          {cartState.items.map((item) => (
            <OrderItemRow
              key={item.id}
              item={item}
              colors={colors}
              unitPrice={getItemPrice(item)}
            />
          ))}
        </View>

        {/* Financial Breakdown */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.medium3D,
          ]}
        >
          <Text style={[styles.cardHeading, { color: colors.textMuted }]}>
            TOTAL COST BREAKDOWN
          </Text>

          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Items Subtotal</Text>
            <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
              Rs. {calculations?.subtotal?.toLocaleString()}
            </Text>
          </View>

          {cartState.discountPercent > 0 && (
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.success }]}>
                Voucher ({cartState.promoCode} - {cartState.discountPercent}%)
              </Text>
              <Text style={[styles.calcValue, { color: colors.success }]}>
                - Rs. {calculations?.discountAmount?.toFixed(0)}
              </Text>
            </View>
          )}

          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>
              Service Charge (5%)
            </Text>
            <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
              Rs. {calculations?.serviceCharge?.toFixed(0)}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>
              Sales Tax (15%)
            </Text>
            <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
              Rs. {calculations?.salesTax?.toFixed(0)}
            </Text>
          </View>

          <View style={[styles.divider, { borderTopColor: colors.surfaceBorder }]} />

          <View style={styles.grandRow}>
            <View>
              <Text style={[styles.grandLabel, { color: colors.textPrimary }]}>Grand Total</Text>
              <Text style={[styles.grandSub, { color: colors.textMuted }]}>Cash / Card on Delivery</Text>
            </View>
            <Text style={[styles.grandValue, { color: colors.primary }]}>
              Rs. {calculations?.grandTotal?.toFixed(0)}
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ef444422',
                borderColor: '#ef4444',
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginTop: 14,
                marginBottom: 8,
              }}
            >
              <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={{ color: '#ef4444', fontSize: 13, flex: 1, fontWeight: '600' }}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* PLACE ORDER BUTTON */}
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
            style={[styles.placeBtn, shadows.button3D, isSubmitting && { opacity: 0.7 }]}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBtn}
            >
              <PlaceOrderButtonContent isSubmitting={isSubmitting} btnTextColor={btnTextColor} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  diningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
  },
  diningBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  calcLabel: {
    fontSize: 13,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 10,
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  grandLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  grandSub: {
    fontSize: 11,
  },
  grandValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  placeBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  placeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
