import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { useTheme } from '../context/ThemeContext';
import { PROMO_CODES } from '../reducers/cartReducer';

// Task 6: Named Financial Constants
export const SERVICE_CHARGE_RATE = 0.05; // 5%
export const SALES_TAX_RATE = 0.15;      // 15%

export default function CartScreen({ navigation }) {
  const { colors, isDark, shadows } = useTheme();
  const {
    cartState,
    increment,
    decrement,
    removeItem,
    updateNote,
    applyPromo,
    removePromo,
    clearCart,
  } = useCart();
  const { menuItems, fetchMenu } = useMenu();

  // Refetch fresh menu on Cart screen focus so latest prices apply immediately
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

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  // Dining preference state (Task 8 requirement)
  const [orderType, setOrderType] = useState('Dine-In Table'); // 'Dine-In Table' | 'Curbside' | 'Priority'
  const [tableNumber, setTableNumber] = useState('Table #07 · Courtyard Garden');
  const [pickupTime, setPickupTime] = useState('In 25 minutes');
  const [selectedTip, setSelectedTip] = useState(15); // 10%, 15%, 20%

  /**
   * Task 6: Financial Calculations computed with useMemo
   * Depends strictly on [cartState.items, cartState.discountPercent, selectedTip, getItemPrice]
   */
  const calculations = useMemo(() => {
    const subtotal = cartState.items.reduce(
      (sum, item) => sum + getItemPrice(item) * item.quantity,
      0
    );

    const discountAmount = subtotal * (cartState.discountPercent / 100);
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    const serviceCharge = discountedSubtotal * SERVICE_CHARGE_RATE;
    const salesTax = discountedSubtotal * SALES_TAX_RATE;
    const tipAmount = discountedSubtotal * (selectedTip / 100);
    const grandTotal = discountedSubtotal + serviceCharge + salesTax + tipAmount;

    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      serviceCharge,
      salesTax,
      tipAmount,
      selectedTip,
      grandTotal,
    };
  }, [cartState.items, cartState.discountPercent, selectedTip, getItemPrice]);

  // Handle promo code submission
  const handleApplyPromo = () => {
    setPromoError('');
    if (!promoInput.trim()) {
      setPromoError('Please enter a voucher code.');
      return;
    }

    try {
      applyPromo(promoInput);
      setPromoInput('');
      Alert.alert(
        'Promo Applied!',
        `Voucher ${promoInput.toUpperCase()} successfully applied. You saved ${
          PROMO_CODES[promoInput.trim().toUpperCase()]
        }%!`
      );
    } catch (err) {
      setPromoError(err.message);
      Alert.alert('Invalid Code', err.message);
    }
  };

  // Navigate to Order Summary / Checkout
  const handleProceedToSummary = () => {
    if (cartState.items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items from the menu before ordering.');
      return;
    }

    navigation.navigate('OrderSummary', {
      orderType,
      tableNumber,
      pickupTime,
      calculations,
    });
  };

  // Cart item card renderer
  const renderCartItem = ({ item }) => {
    const unitPrice = getItemPrice(item);
    return (
      <View
        style={[
          styles.cartCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
      >
        <View style={styles.cartCardHeader}>
          <Image source={{ uri: item.image }} style={styles.itemThumb} />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemUnitPrice, { color: colors.textSecondary }]}>
              Rs. {unitPrice.toLocaleString()} each
            </Text>
            <Text style={[styles.itemSubtotal, { color: colors.primary }]}>
              Line Total: Rs. {(unitPrice * item.quantity).toLocaleString()}
            </Text>
          </View>

        {/* Delete Item Button */}
        <TouchableOpacity
          onPress={() => removeItem(item.id)}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Special Instructions Field (Task 5: per-item notes) */}
      <View style={styles.noteInputWrapper}>
        <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.textMuted} />
        <TextInput
          style={[styles.noteInput, { color: colors.textPrimary }]}
          placeholder="Special notes (e.g. no onions, extra sauce)..."
          placeholderTextColor={colors.textMuted}
          value={item.note || ''}
          onChangeText={(text) => updateNote(item.id, text)}
        />
      </View>

      {/* Quantity Stepper */}
      <View style={styles.stepperRow}>
        <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>Quantity</Text>
        <View
          style={[
            styles.stepperBox,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
          ]}
        >
          <TouchableOpacity
            onPress={() => decrement(item.id)}
            style={styles.stepBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>

          <Text style={[styles.quantityValue, { color: colors.textPrimary }]}>
            {item.quantity}
          </Text>

          <TouchableOpacity
            onPress={() => increment(item.id)}
            style={styles.stepBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {cartState.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={72} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Your Tray is Empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Explore our curated menu and add signature delicacies to begin your order.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Menu')}
            style={[styles.browseBtn, { backgroundColor: colors.primary }, shadows.button3D]}
          >
            <Ionicons name="restaurant" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.browseBtnText}>Explore Gourmet Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Table Service Header Banner (from Stitch AI) */}
          <View style={[styles.liveServiceBanner, shadows.medium3D]}>
            <View style={styles.liveServiceBannerGlow} />
            <View style={styles.liveServiceBannerContent}>
              <View>
                <View style={styles.liveSeatingRow}>
                  <View style={styles.liveSeatingDot} />
                  <Text style={styles.liveSeatingTag}>LIVE SEATING</Text>
                </View>
                <Text style={styles.liveSeatingTitle}>Your Curated Selection</Text>
                <View style={styles.liveSeatingSubRow}>
                  <Ionicons name="restaurant-outline" size={13} color="#ffc174" />
                  <Text style={styles.liveSeatingTableText}>{tableNumber}</Text>
                </View>
              </View>
              <View style={styles.liveSeatingIconCircle}>
                <Ionicons name="notifications-outline" size={20} color="#ffc174" />
              </View>
            </View>
          </View>

          {/* Dining Type Segmented Switch (from Stitch AI) */}
          <View style={styles.diningTypePillContainer}>
            {['Dine-In Table', 'Curbside', 'Priority'].map((type) => {
              const isSelected = orderType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setOrderType(type)}
                  style={[
                    styles.diningTypePillBtn,
                    isSelected && styles.diningTypePillBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.diningTypePillText,
                      isSelected && styles.diningTypePillTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cart Header Bar with item count and clear tray */}
          <View style={styles.cartHeaderBar}>
            <Text style={[styles.cartHeading, { color: colors.textPrimary }]}>
              Selected Dishes ({cartState.items.length})
            </Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearCartText}>Clear Tray</Text>
            </TouchableOpacity>
          </View>

          {/* Cart Item Cards */}
          <FlatList
            data={cartState.items}
            keyExtractor={(item) => item.id}
            renderItem={renderCartItem}
            scrollEnabled={false}
          />

          {/* VOUCHER / PROMO CODE SECTION */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: '#1c2028', borderColor: 'rgba(255, 193, 116, 0.1)' },
              shadows.soft,
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>PATRON PRIVILEGE & VOUCHERS</Text>
            </View>

            {cartState.promoCode ? (
              <View style={styles.activePromoBadge}>
                <View style={styles.activePromoLeft}>
                  <View style={styles.promoCheckCircle}>
                    <Ionicons name="checkmark" size={12} color="#00311f" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.activePromoText}>
                      {cartState.promoCode} Applied
                    </Text>
                    <Text style={styles.activePromoSub}>
                      {cartState.discountPercent}% Patron Privilege Active
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={removePromo} style={styles.removePromoBtn}>
                  <Text style={styles.removePromoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.promoInputRow}>
                  <TextInput
                    style={styles.promoTextInput}
                    placeholder="Enter voucher: AURA_VIP15, AURA30"
                    placeholderTextColor="#a08e7a"
                    value={promoInput}
                    onChangeText={(val) => {
                      setPromoInput(val);
                      if (promoError) setPromoError('');
                    }}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    onPress={handleApplyPromo}
                    style={styles.applyPromoBtn}
                  >
                    <LinearGradient
                      colors={['#f59e0b', '#ffc174']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.applyPromoGradient}
                    >
                      <Text style={styles.applyPromoText}>Apply</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {promoError ? (
                  <Text style={styles.promoErrorText}>{promoError}</Text>
                ) : null}

                {/* Quick Hint Chips */}
                <View style={styles.promoHintsRow}>
                  <TouchableOpacity
                    onPress={() => setPromoInput('WELCOME10')}
                    style={styles.hintChip}
                  >
                    <Text style={styles.hintText}>WELCOME10 (10%)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPromoInput('FEAST20')}
                    style={styles.hintChip}
                  >
                    <Text style={styles.hintText}>FEAST20 (20%)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPromoInput('AURA30')}
                    style={[styles.hintChip, styles.hintChipGold]}
                  >
                    <Text style={styles.hintTextGold}>AURA30 (30% VIP)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* BILL SUMMARY & CALCULATIONS (from Stitch AI) */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: '#1c2028', borderColor: 'rgba(255, 193, 116, 0.1)' },
              shadows.medium3D,
            ]}
          >
            <Text style={styles.sectionHeading}>BILL BREAKDOWN</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>
                Rs. {calculations.subtotal.toLocaleString()}
              </Text>
            </View>

            {cartState.discountPercent > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#4edea3' }]}>
                  Privilege Savings ({cartState.discountPercent}%)
                </Text>
                <Text style={[styles.billValue, { color: '#4edea3', fontWeight: '700' }]}>
                  - Rs. {calculations.discountAmount.toFixed(0)}
                </Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Hospitality Service (5%)</Text>
              <Text style={styles.billValue}>
                Rs. {calculations.serviceCharge.toFixed(0)}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>State & Hospitality Tax (15%)</Text>
              <Text style={styles.billValue}>
                Rs. {calculations.salesTax.toFixed(0)}
              </Text>
            </View>

            {/* Gratuity / Sommelier Tip Chips */}
            <View style={styles.tipSection}>
              <View style={styles.tipHeaderRow}>
                <Text style={styles.tipLabel}>Gratuity / Sommelier Tip</Text>
                <Text style={styles.tipAmountText}>
                  Rs. {calculations.tipAmount.toFixed(0)} ({selectedTip}%)
                </Text>
              </View>
              <View style={styles.tipChipsRow}>
                {[10, 15, 20].map((tip) => {
                  const isSelected = selectedTip === tip;
                  return (
                    <TouchableOpacity
                      key={tip}
                      onPress={() => setSelectedTip(tip)}
                      style={[
                        styles.tipChipBtn,
                        isSelected && styles.tipChipBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.tipChipText,
                          isSelected && styles.tipChipTextActive,
                        ]}
                      >
                        {tip}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.totalDivider} />

            {/* Final Total Area */}
            <View style={styles.grandTotalContainer}>
              <View>
                <Text style={styles.grandTotalLabel}>Final Total</Text>
                <Text style={styles.grandTotalSub}>
                  Inclusive of curated pairings & duties
                </Text>
              </View>
              <Text style={styles.grandTotalAmount}>
                Rs. {calculations.grandTotal.toFixed(0)}
              </Text>
            </View>

            {/* HIGH-GLOW ORDER CONFIRMATION BUTTON */}
            <TouchableOpacity
              onPress={handleProceedToSummary}
              style={[styles.checkoutBtn, shadows.goldGlow || shadows.button3D]}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#f59e0b', '#ffc174']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutGradient}
              >
                <Text style={styles.checkoutBtnText}>Confirm & Proceed to Summary</Text>
                <Ionicons name="arrow-forward" size={18} color="#472a00" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
    paddingBottom: 50,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 320,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    marginTop: 24,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cartHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cartHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  clearCartText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cartCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  cartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemUnitPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  noteInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginTop: 10,
  },
  noteInput: {
    flex: 1,
    fontSize: 12,
    marginLeft: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  // Table Service Header Banner
  liveServiceBanner: {
    borderRadius: 18,
    backgroundColor: '#1c2028',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.15)',
    padding: 16,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  liveServiceBannerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  liveServiceBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  liveSeatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveSeatingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  liveSeatingTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4edea3',
    letterSpacing: 1.2,
  },
  liveSeatingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dfe2ee',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  liveSeatingSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  liveSeatingTableText: {
    fontSize: 12,
    color: '#d8c3ad',
  },
  liveSeatingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#262a33',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dining Type Segmented Switch
  diningTypePillContainer: {
    flexDirection: 'row',
    backgroundColor: '#181c24',
    borderRadius: 999,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.08)',
  },
  diningTypePillBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  diningTypePillBtnActive: {
    backgroundColor: '#f59e0b',
  },
  diningTypePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d8c3ad',
  },
  diningTypePillTextActive: {
    color: '#472a00',
    fontWeight: '700',
  },

  // Section Cards
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d8c3ad',
    letterSpacing: 1,
    marginBottom: 10,
  },
  activePromoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 165, 114, 0.12)',
    borderWidth: 1,
    borderColor: '#4edea3',
  },
  activePromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4edea3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePromoText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4edea3',
  },
  activePromoSub: {
    fontSize: 11,
    color: '#d8c3ad',
    marginTop: 2,
  },
  removePromoBtn: {
    padding: 6,
  },
  removePromoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffb4ab',
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoTextInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31353e',
    backgroundColor: '#0a0e16',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#dfe2ee',
  },
  applyPromoBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyPromoGradient: {
    paddingHorizontal: 18,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyPromoText: {
    color: '#472a00',
    fontSize: 13,
    fontWeight: '800',
  },
  promoErrorText: {
    fontSize: 11,
    color: '#ffb4ab',
    fontWeight: '600',
    marginTop: 6,
  },
  promoHintsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  hintChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#262a33',
  },
  hintChipGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.3)',
  },
  hintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d8c3ad',
  },
  hintTextGold: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffc174',
  },

  // Bill Breakdown
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 13,
    color: '#d8c3ad',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dfe2ee',
  },

  // Gratuity / Sommelier Tip
  tipSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#262a33',
  },
  tipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipLabel: {
    fontSize: 12,
    color: '#d8c3ad',
  },
  tipAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffc174',
  },
  tipChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipChipBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#262a33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipChipBtnActive: {
    backgroundColor: '#ffc174',
  },
  tipChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d8c3ad',
  },
  tipChipTextActive: {
    color: '#472a00',
    fontWeight: '800',
  },

  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: '#31353e',
    marginVertical: 12,
  },

  // Final Total
  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    backgroundColor: 'rgba(49, 53, 62, 0.4)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#dfe2ee',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  grandTotalSub: {
    fontSize: 10,
    color: '#a08e7a',
    marginTop: 2,
  },
  grandTotalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffc174',
  },

  // Checkout Button
  checkoutBtn: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  checkoutBtnText: {
    color: '#472a00',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
