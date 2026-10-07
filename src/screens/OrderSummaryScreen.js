import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useTheme } from '../context/ThemeContext';

export default function OrderSummaryScreen({ route, navigation }) {
  const { colors, isDark, shadows } = useTheme();
  const { user } = useAuth();
  const { cartState, clearCart } = useCart();
  const { createOrder } = useOrders();

  const {
    orderType = 'Dine-in',
    tableNumber = 'Table A-01 (Atrium Glasshouse)',
    pickupTime = 'In 25 minutes',
    calculations,
  } = route.params || {};

  const handlePlaceOrder = async () => {
    try {
      const orderPayload = {
        customerId: user?.id || 'guest',
        customerName: user?.name || 'Valued Guest',
        type: orderType,
        tableNumber: orderType === 'Dine-in' ? tableNumber : '',
        pickupTime: orderType === 'Takeaway' ? pickupTime : '',
        items: cartState.items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          note: i.note || '',
        })),
        total: calculations.grandTotal,
        promoCode: cartState.promoCode,
        discountPercent: cartState.discountPercent,
      };

      const newOrder = await createOrder(orderPayload);
      clearCart();

      // Navigate to live Order Tracking
      navigation.navigate('OrderTracking', { orderId: newOrder.id || newOrder._id });
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Unable to place order at this time.');
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
                Please confirm your culinary selection and delivery details.
              </Text>
            </View>
          </View>

          <View style={[styles.diningBadge, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons
              name={orderType === 'Dine-in' ? 'restaurant' : 'bag-handle'}
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.diningBadgeText, { color: colors.textPrimary }]}>
              {orderType === 'Dine-in'
                ? `Dine-In • ${tableNumber}`
                : `Takeaway • Pickup ${pickupTime}`}
            </Text>
          </View>
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
                Rs. {(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Financial Breakdown (Task 6 Rates) */}
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

          {/* PLACE ORDER BUTTON */}
          <TouchableOpacity
            onPress={handlePlaceOrder}
            style={[styles.placeBtn, shadows.button3D]}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBtn}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isDark ? '#472a00' : '#FFFFFF'}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.placeBtnText, { color: isDark ? '#472a00' : '#FFFFFF' }]}>
                Confirm & Dispatch to Kitchen
              </Text>
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
