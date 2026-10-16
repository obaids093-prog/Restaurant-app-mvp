import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
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
import { useBranch } from '../context/BranchContext';
import { BranchChip } from '../components/ui';
import { brand } from '../config/brand';

// Named rate constants for transparent breakdown
const SERVICE_CHARGE_RATE = 0.05;
const SALES_TAX_RATE = 0.15;

// Cross-platform alert helper
const showOrderAlert = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Pure payload builder
const buildOrderPayload = (user, cartState, calculations, orderType, tableNumber, pickupTime, getItemPrice, activeBranch) => {
  const isTakeaway =
    String(orderType || '').toLowerCase().includes('takeaway') ||
    String(orderType || '').toLowerCase().includes('curbside');
  const normalizedType = isTakeaway ? 'Takeaway' : 'Dine-in';

  return {
    customerId: user?.id || user?._id || 'guest',
    customerName: user?.name || 'Valued Guest',
    type: normalizedType,
    tableNumber: isTakeaway ? 'Takeaway Counter' : (tableNumber || 'Table A-01'),
    pickupTime: isTakeaway ? (pickupTime || 'In 25 minutes') : null,
    branchId: activeBranch?.id || 'lhr_gulberg',
    branchName: activeBranch?.fullName || 'AURA • Gulberg III, Lahore',
    branchCity: activeBranch?.city || 'Lahore',
    items: (cartState.items || []).map((item) => ({
      id: item.id || item._id,
      name: item.name,
      price: getItemPrice(item),
      quantity: item.quantity,
      note: item.note || '',
    })),
    subtotal: calculations.subtotal,
    promoCode: cartState.promoCode || null,
    discountPercent: cartState.discountPercent || 0,
    discountAmount: calculations.discountAmount,
    discountedSubtotal: calculations.discountedSubtotal,
    serviceCharge: calculations.serviceCharge,
    salesTax: calculations.salesTax,
    totalPrice: calculations.grandTotal,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };
};

export default function OrderSummaryScreen({ route, navigation }) {
  const { colors, isDark, shadows, typography } = useTheme();
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const { cartState, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { menuItems, fetchMenu } = useMenu();

  // Refetch fresh menu on focus
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
      return match?.price !== undefined ? Number(match.price) : Number(item.price);
    },
    [menuItems]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    orderType: initialOrderType = 'Dine-in',
    tableNumber = 'Table A-01 (Atrium Glasshouse)',
    pickupTime = 'In 25 minutes',
  } = route.params || {};

  // Interactive dining type switcher
  const [activeDiningType, setActiveDiningType] = useState(
    String(initialOrderType).toLowerCase().includes('takeaway') ? 'Takeaway' : 'Dine-in'
  );

  // Settlement preference
  const [paymentMethod, setPaymentMethod] = useState('pay_at_table'); // 'pay_at_table' | 'cash' | 'card_online'

  const isDineIn = activeDiningType === 'Dine-in';
  const userName = user?.name || 'Valued Guest';
  const phoneText = user?.phone || 'No phone linked (Update in Profile)';

  // Live calculations reflecting latest fetched menu prices
  const calculations = useMemo(() => {
    const subtotal = (cartState?.items || []).reduce(
      (sum, item) => sum + getItemPrice(item) * (Number(item.quantity) || 1),
      0
    );
    const discountPercent = cartState?.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    const serviceCharge = discountedSubtotal * SERVICE_CHARGE_RATE;
    const salesTax = discountedSubtotal * SALES_TAX_RATE;
    const grandTotal = discountedSubtotal + serviceCharge + salesTax;

    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      serviceCharge,
      salesTax,
      grandTotal,
    };
  }, [cartState?.items, cartState?.discountPercent, getItemPrice]);

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
      const msg = 'Your tray is empty. Please add items first.';
      setErrorMessage(msg);
      showOrderAlert('Empty Tray', msg);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const orderPayload = buildOrderPayload(
        user,
        cartState,
        calculations,
        activeDiningType,
        tableNumber,
        pickupTime,
        getItemPrice,
        activeBranch
      );

      const newOrder = await createOrder(orderPayload);
      const snapshotItems = [...cartState.items];
      clearCart();

      // Navigate to Order Placed celebration screen
      navigation.replace('OrderPlaced', {
        order: newOrder,
        orderType: activeDiningType,
        tableNumber,
        branch: activeBranch,
        grandTotal: calculations.grandTotal,
        items: snapshotItems,
      });
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
        {/* Verification Title & Ready Badge */}
        <View style={styles.topHeaderRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[typography.headingLg, { color: colors.textPrimary, fontWeight: '800' }]}>
              Order Summary
            </Text>
            <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}>
              Review details before transmission to kitchen brigade
            </Text>
          </View>
          <BranchChip compact />
        </View>

        {/* Dine-in vs Takeaway Segmented Pill Switcher */}
        <View style={[styles.diningPillContainer, { backgroundColor: colors.surfaceSubtle }]}>
          <TouchableOpacity
            onPress={() => setActiveDiningType('Dine-in')}
            style={[
              styles.diningPillBtn,
              isDineIn && { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons
              name="restaurant"
              size={16}
              color={isDineIn ? colors.onPrimary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.diningPillText,
                { color: isDineIn ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              Dine-in
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveDiningType('Takeaway')}
            style={[
              styles.diningPillBtn,
              !isDineIn && { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons
              name="bag-handle"
              size={16}
              color={!isDineIn ? colors.onPrimary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.diningPillText,
                { color: !isDineIn ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              Takeaway
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table Allocation / Pickup Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <View style={styles.cardHeaderWithAction}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={isDineIn ? 'restaurant-outline' : 'time-outline'}
                size={18}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.cardHeading, { color: colors.mutedText }]}>
                {isDineIn ? 'TABLE ALLOCATION' : 'PICKUP SCHEDULE'}
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
              {isDineIn ? 'Atrium Window' : 'Express'}
            </Text>
          </View>

          <View style={[styles.detailTile, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
            <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
              {isDineIn ? tableNumber : 'Takeaway Express Pickup'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {isDineIn
                ? `Sanctuary: ${activeBranch?.fullName || 'AURA Dining'}`
                : `Pickup at: ${activeBranch?.address || brand.address}`}
            </Text>
          </View>

          <View style={styles.gridThreeCol}>
            <View style={[styles.colTile, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.colTileLabel, { color: colors.mutedText }]}>Guest</Text>
              <Text style={[styles.colTileValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {userName}
              </Text>
            </View>
            <View style={[styles.colTile, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.colTileLabel, { color: colors.mutedText }]}>Service</Text>
              <Text style={[styles.colTileValue, { color: colors.textPrimary }]}>
                {isDineIn ? 'Dine-In' : 'Takeaway'}
              </Text>
            </View>
            <View style={[styles.colTile, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.colTileLabel, { color: colors.mutedText }]}>Est. Time</Text>
              <Text style={[styles.colTileValue, { color: colors.primary }]}>
                ~20 mins
              </Text>
            </View>
          </View>
        </View>

        {/* Patron Contact & Profile Shortcut */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <View style={styles.cardHeaderWithAction}>
            <Text style={[styles.cardHeading, { color: colors.mutedText }]}>
              PATRON CONTACT INFO
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('CustomerApp', { screen: 'Profile' })}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                Edit in Profile →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.textPrimary }]}>{userName}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.textPrimary }]}>{phoneText}</Text>
          </View>
          {user?.email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={16} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>{user.email}</Text>
            </View>
          )}
        </View>

        {/* Selected Dishes Summary with 56x56 Thumbnails */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <View style={styles.cardHeaderWithAction}>
            <Text style={[styles.cardHeading, { color: colors.mutedText }]}>
              SELECTED COURSES ({cartState.items.length})
            </Text>
            <Text style={[typography.caption, { color: colors.mutedText }]}>
              {cartState.items.reduce((s, i) => s + (i.quantity || 1), 0)} Total Portions
            </Text>
          </View>

          {cartState.items.map((item, idx) => {
            const unitPrice = getItemPrice(item);
            const lineTotal = unitPrice * (item.quantity || 1);
            return (
              <View
                key={item.id || idx}
                style={[
                  styles.dishItemRow,
                  idx < cartState.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                  },
                ]}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.dishThumb} />
                ) : (
                  <View style={[styles.dishThumbFallback, { backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                  </View>
                )}

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text
                      style={[typography.body, { color: colors.textPrimary, fontWeight: '700', flex: 1 }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', marginLeft: 8 }]}>
                      {brand.formatPrice(lineTotal)}
                    </Text>
                  </View>

                  {item.note ? (
                    <Text style={[typography.caption, { color: colors.primary, fontStyle: 'italic', marginTop: 2 }]}>
                      Note: "{item.note}"
                    </Text>
                  ) : null}

                  <View style={styles.dishPortionRow}>
                    <View style={[styles.portionBadge, { backgroundColor: colors.surfaceSubtle }]}>
                      <Text style={[styles.portionBadgeText, { color: colors.textSecondary }]}>
                        {item.quantity}x Portion ({brand.formatPrice(unitPrice)} ea)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Settlement Preference Selector */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <Text style={[styles.cardHeading, { color: colors.mutedText, marginBottom: 12 }]}>
            SETTLEMENT PREFERENCE
          </Text>

          {/* Pay at Table Option */}
          <TouchableOpacity
            onPress={() => setPaymentMethod('pay_at_table')}
            style={[
              styles.paymentOptionRow,
              {
                backgroundColor: paymentMethod === 'pay_at_table' ? colors.primaryTint : colors.surfaceSubtle,
                borderColor: paymentMethod === 'pay_at_table' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: paymentMethod === 'pay_at_table' ? colors.primary : colors.border },
                ]}
              >
                {paymentMethod === 'pay_at_table' && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}>
                  Pay at Table
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11 }]}>
                  Card or terminal upon cloche presentation
                </Text>
              </View>
            </View>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Direct Cash Option */}
          <TouchableOpacity
            onPress={() => setPaymentMethod('cash')}
            style={[
              styles.paymentOptionRow,
              {
                backgroundColor: paymentMethod === 'cash' ? colors.primaryTint : colors.surfaceSubtle,
                borderColor: paymentMethod === 'cash' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: paymentMethod === 'cash' ? colors.primary : colors.border },
                ]}
              >
                {paymentMethod === 'cash' && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}>
                  Direct Cash
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11 }]}>
                  Settle in PKR notes directly with your attendant
                </Text>
              </View>
            </View>
            <Ionicons name="cash-outline" size={20} color={colors.ready} />
          </TouchableOpacity>
        </View>

        {/* Financial Folio Breakdown */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.medium3D,
          ]}
        >
          <Text style={[styles.cardHeading, { color: colors.mutedText, marginBottom: 10 }]}>
            FOLIO COST BREAKDOWN
          </Text>

          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
              {brand.formatPrice(calculations.subtotal)}
            </Text>
          </View>

          {cartState.discountPercent > 0 && (
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.ready }]}>
                Voucher ({cartState.promoCode} - {cartState.discountPercent}%)
              </Text>
              <Text style={[styles.calcValue, { color: colors.ready, fontWeight: '700' }]}>
                - {brand.formatPrice(calculations.discountAmount)}
              </Text>
            </View>
          )}

          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>
              Hospitality Service (5%)
            </Text>
            <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
              {brand.formatPrice(calculations.serviceCharge)}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>
              Provincial Sales Tax (15%)
            </Text>
            <Text style={[styles.calcValue, { color: colors.textPrimary }]}>
              {brand.formatPrice(calculations.salesTax)}
            </Text>
          </View>


          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.grandRow}>
            <View>
              <Text style={[styles.grandLabel, { color: colors.textPrimary }]}>Grand Total</Text>
              <Text style={[styles.grandSub, { color: colors.mutedText }]}>
                {paymentMethod === 'cash' ? 'Cash Settlement' : 'Pay at Table'}
              </Text>
            </View>
            <Text style={[styles.grandValue, { color: colors.primary }]}>
              {brand.formatPrice(calculations.grandTotal)}
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

          {/* PROMINENT CONFIRM & DISPATCH BUTTON */}
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
            style={[
              styles.placeBtn,
              { backgroundColor: colors.primary },
              shadows.button3D,
              isSubmitting && { opacity: 0.7 },
            ]}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={colors.gradientPrimary || [colors.primary, colors.primaryPressed || '#E04A27']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color={colors.onPrimary} style={{ marginRight: 8 }} />
                  <Text style={[styles.placeBtnText, { color: colors.onPrimary }]}>
                    Dispatching to Kitchen Brigade...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
                  <Text style={[styles.placeBtnText, { color: colors.onPrimary }]}>
                    Confirm & Dispatch to Kitchen
                  </Text>
                </>
              )}
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
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  readyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diningPillContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  diningPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 13,
  },
  diningPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailTile: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  gridThreeCol: {
    flexDirection: 'row',
    gap: 8,
  },
  colTile: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  colTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  colTileValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  contactText: {
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
  },
  dishItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dishThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  dishThumbFallback: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishPortionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  portionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  portionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  comingSoonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    height: 1,
    marginVertical: 12,
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
    marginTop: 8,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  placeBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
