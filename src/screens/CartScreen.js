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
import { brand } from '../config/brand';
import { PROMO_CODES } from '../reducers/cartReducer';

// Named Financial Constants
export const SERVICE_CHARGE_RATE = 0.05; // 5%
export const SALES_TAX_RATE = 0.15;      // 15%

// Styled pure-View Cloche Illustration for Empty State
const EmptyClocheIllustration = ({ colors, isDark }) => (
  <View style={styles.clocheCanvas}>
    {/* Ambient Glow */}
    <View
      style={[
        styles.clocheAmbientGlow,
        { backgroundColor: colors.primaryTint, opacity: isDark ? 0.25 : 0.6 },
      ]}
    />

    {/* Steam Sparks */}
    <View style={styles.sparksContainer}>
      <View style={[styles.sparkDot, { top: 0, left: '38%', backgroundColor: colors.primary }]} />
      <View style={[styles.sparkDot, { top: 8, left: '50%', backgroundColor: colors.secondary }]} />
      <View style={[styles.sparkDot, { top: 4, left: '62%', backgroundColor: colors.primary }]} />
    </View>

    {/* Cloche Dome & Handle */}
    <View style={styles.clocheStructure}>
      {/* Handle */}
      <View
        style={[
          styles.clocheHandle,
          { backgroundColor: isDark ? '#3A3A3A' : '#D1D5DB', borderColor: colors.primary },
        ]}
      />
      {/* Dome */}
      <View
        style={[
          styles.clocheDome,
          {
            backgroundColor: isDark ? '#262626' : '#F3F4F6',
            borderColor: isDark ? '#3A3A3A' : '#E5E7EB',
          },
        ]}
      >
        <View
          style={[
            styles.clocheHighlight,
            { backgroundColor: isDark ? '#404040' : '#FFFFFF' },
          ]}
        />
      </View>
      {/* Base Rim */}
      <View
        style={[
          styles.clocheRim,
          { backgroundColor: colors.primary },
        ]}
      />
      {/* Platter Plate */}
      <View
        style={[
          styles.clochePlatter,
          { backgroundColor: isDark ? '#333333' : '#E5E7EB' },
        ]}
      />
    </View>
  </View>
);

export default function CartScreen({ navigation }) {
  const { colors, isDark, shadows, typography, radius } = useTheme();
  const {
    cartState,
    addItem,
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

  // Dining preference state
  const [orderType, setOrderType] = useState('Dine-In Table');
  const [tableNumber] = useState('Table A-01 (Atrium Glasshouse)');
  const [pickupTime] = useState('In 25 minutes');

  // Financial Calculations computed with useMemo (subtotal, discount, service 5%, tax 15%)
  const calculations = useMemo(() => {
    const subtotal = cartState.items.reduce(
      (sum, item) => sum + getItemPrice(item) * item.quantity,
      0
    );

    const discountAmount = subtotal * (cartState.discountPercent / 100);
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
  }, [cartState.items, cartState.discountPercent, getItemPrice]);

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
      const disc = PROMO_CODES[promoInput.trim().toUpperCase()] || 10;
      Alert.alert(
        'Voucher Applied',
        `Privilege voucher ${promoInput.toUpperCase()} activated (${disc}% savings).`
      );
    } catch (err) {
      setPromoError(err.message);
      Alert.alert('Invalid Code', err.message);
    }
  };

  // Safe delete with confirmation
  const handleConfirmDelete = (itemId, itemName) => {
    Alert.alert(
      'Remove Dish',
      `Remove "${itemName}" from your culinary tray?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId) },
      ]
    );
  };

  // Navigate to Order Summary / Checkout
  const handleProceedToSummary = () => {
    if (cartState.items.length === 0) {
      Alert.alert('Empty Tray', 'Please select dishes from the menu before ordering.');
      return;
    }

    navigation.navigate('OrderSummary', {
      orderType,
      tableNumber,
      pickupTime,
      calculations,
    });
  };

  // Quick recommend list for empty state
  const recommendedDishes = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    return menuItems.slice(0, 4);
  }, [menuItems]);

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
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemThumb} />
          ) : (
            <View style={[styles.itemThumbFallback, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="restaurant" size={24} color={colors.primary} />
            </View>
          )}

          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemUnitPrice, { color: colors.textSecondary }]}>
              {brand.formatPrice(unitPrice)} each
            </Text>
            <Text style={[styles.itemSubtotal, { color: colors.primary }]}>
              {brand.formatPrice(unitPrice * item.quantity)}
            </Text>
          </View>

          {/* Delete Item Button with 44px min touch target */}
          <TouchableOpacity
            onPress={() => handleConfirmDelete(item.id, item.name)}
            style={styles.deleteBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={`Remove ${item.name}`}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Special Instructions Field (per-item notes) */}
        <View
          style={[
            styles.noteInputWrapper,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
          ]}
        >
          <Ionicons name="create-outline" size={15} color={colors.mutedText} />
          <TextInput
            style={[styles.noteInput, { color: colors.textPrimary }]}
            placeholder="Special instructions (e.g., extra spicy, no onions)..."
            placeholderTextColor={colors.mutedText}
            value={item.note || ''}
            onChangeText={(text) => updateNote(item.id, text)}
          />
        </View>

        {/* Quantity Stepper with 44px min tap targets */}
        <View style={styles.stepperRow}>
          <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>
            Course Portions
          </Text>
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons name="remove" size={18} color={colors.primary} />
            </TouchableOpacity>

            <Text style={[styles.quantityValue, { color: colors.textPrimary }]}>
              {item.quantity}
            </Text>

            <TouchableOpacity
              onPress={() => increment(item.id)}
              style={styles.stepBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={18} color={colors.primary} />
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
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Banner Row */}
          <View style={styles.emptyHeaderRow}>
            <View>
              <Text style={[typography.headingLg, { color: colors.textPrimary, fontWeight: '800' }]}>
                My Tray
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText }]}>
                (0 creations selected)
              </Text>
            </View>
            <View style={[styles.serviceTypeBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="restaurant" size={14} color={colors.primary} />
              <Text style={[styles.serviceTypeBadgeText, { color: colors.textPrimary }]}>
                Dine-in / Takeaway
              </Text>
            </View>
          </View>

          {/* Privilege Voucher Banner */}
          <TouchableOpacity
            style={[
              styles.welcomeVoucherBanner,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              shadows.soft,
            ]}
            onPress={() => applyPromo('WELCOME10')}
            activeOpacity={0.85}
          >
            <View style={[styles.voucherIconCircle, { backgroundColor: colors.primaryTint }]}>
              <Ionicons name="ticket" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.caption, { color: colors.textPrimary }]}>
                Voucher <Text style={{ color: colors.primary, fontWeight: '700' }}>WELCOME10</Text> (10% off) ready for checkout.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
          </TouchableOpacity>

          {/* Cloche Graphic & Empty Copy */}
          <View style={styles.clocheCenterSection}>
            <EmptyClocheIllustration colors={colors} isDark={isDark} />

            <Text style={[typography.headingLg, styles.emptyTitle, { color: colors.textPrimary }]}>
              Your Tray is Empty
            </Text>
            <Text style={[typography.body, styles.emptySubtitle, { color: colors.textSecondary }]}>
              You haven't added any culinary creations yet. Explore Chef Farhan's handcrafted repertoire and reserve your courses.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Menu')}
              style={[
                styles.browseBtn,
                { backgroundColor: colors.primary },
                shadows.button3D,
              ]}
              activeOpacity={0.88}
            >
              <Text style={[styles.browseBtnText, { color: colors.onPrimary }]}>
                Explore Artisan Menu
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>

          {/* Recommended by Chef Row */}
          {recommendedDishes.length > 0 && (
            <View style={styles.recommendedSection}>
              <View style={styles.recommendedHeader}>
                <View>
                  <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                    Recommended by Chef
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedText }]}>
                    Seasonal pairings curated for you
                  </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                    View All →
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedScroll}
              >
                {recommendedDishes.map((dish) => (
                  <View
                    key={dish.id || dish._id}
                    style={[
                      styles.recommendCard,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                      shadows.soft,
                    ]}
                  >
                    {dish.image ? (
                      <Image source={{ uri: dish.image }} style={styles.recommendImage} />
                    ) : (
                      <View style={[styles.recommendImageFallback, { backgroundColor: colors.surfaceSubtle }]}>
                        <Ionicons name="restaurant-outline" size={28} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.recommendBody}>
                      <Text
                        style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}
                        numberOfLines={1}
                      >
                        {dish.name}
                      </Text>
                      <Text style={[typography.caption, { color: colors.mutedText }]} numberOfLines={1}>
                        {dish.category || 'Chef Signature'}
                      </Text>
                      <View style={styles.recommendFooter}>
                        <Text style={[typography.price, { color: colors.primary, fontWeight: '800' }]}>
                          {brand.formatPrice(dish.price)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (dish.isAvailable === false) {
                              Alert.alert('Item Sold Out', `${dish.name} is currently unavailable.`);
                              return;
                            }
                            addItem(dish);
                          }}
                          style={[styles.quickAddBtn, { backgroundColor: colors.primary }]}
                          activeOpacity={0.8}
                          accessibilityLabel={`Add ${dish.name} to tray`}
                        >
                          <Ionicons name="add" size={18} color={colors.onPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Table Service Banner */}
            <View
              style={[
                styles.liveServiceBanner,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                shadows.soft,
              ]}
            >
              <View style={styles.liveServiceBannerContent}>
                <View style={{ flex: 1 }}>
                  <View style={styles.liveSeatingRow}>
                    <View style={[styles.liveSeatingDot, { backgroundColor: colors.ready }]} />
                    <Text style={[styles.liveSeatingTag, { color: colors.ready }]}>
                      LIVE SERVICE ACTIVE
                    </Text>
                  </View>
                  <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                    Curated Table Order
                  </Text>
                  <View style={styles.liveSeatingSubRow}>
                    <Ionicons name="restaurant-outline" size={14} color={colors.primary} />
                    <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 5 }]}>
                      {tableNumber}
                    </Text>
                  </View>
                </View>

                <View style={[styles.liveSeatingIconCircle, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* Dining Type Segmented Pill */}
            <View style={[styles.diningTypePillContainer, { backgroundColor: colors.surfaceSubtle }]}>
              {['Dine-In Table', 'Curbside', 'Express'].map((type) => {
                const isSelected = orderType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setOrderType(type)}
                    style={[
                      styles.diningTypePillBtn,
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.diningTypePillText,
                        { color: isSelected ? colors.onPrimary : colors.textSecondary },
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
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                Selected Dishes ({cartState.items.length})
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Clear Tray', 'Remove all items from your tray?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear All', style: 'destructive', onPress: clearCart },
                  ])
                }
              >
                <Text style={[styles.clearCartText, { color: colors.error }]}>Clear Tray</Text>
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
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                shadows.soft,
              ]}
            >
              <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
                PATRON PRIVILEGE & VOUCHERS
              </Text>

              {cartState.promoCode ? (
                <View style={[styles.activePromoBadge, { backgroundColor: colors.primaryTint }]}>
                  <View style={styles.activePromoLeft}>
                    <View style={[styles.promoCheckCircle, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[styles.activePromoText, { color: colors.primary }]}>
                        {cartState.promoCode} Applied
                      </Text>
                      <Text style={[styles.activePromoSub, { color: colors.textSecondary }]}>
                        {cartState.discountPercent}% Patron Privilege Active
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={removePromo} style={styles.removePromoBtn}>
                    <Text style={[styles.removePromoText, { color: colors.error }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.promoInputRow}>
                    <TextInput
                      style={[
                        styles.promoTextInput,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.surfaceBorder,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="Enter voucher (e.g. WELCOME10)"
                      placeholderTextColor={colors.mutedText}
                      value={promoInput}
                      onChangeText={(val) => {
                        setPromoInput(val);
                        if (promoError) setPromoError('');
                      }}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      onPress={handleApplyPromo}
                      style={[styles.applyPromoBtn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.applyPromoText, { color: colors.onPrimary }]}>
                        Apply
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {promoError ? (
                    <Text style={[styles.promoErrorText, { color: colors.error }]}>
                      {promoError}
                    </Text>
                  ) : null}

                  {/* Quick Hint Chips */}
                  <View style={styles.promoHintsRow}>
                    {['WELCOME10 (10%)', 'FEAST20 (20%)', 'AURA30 (30%)'].map((hint) => {
                      const code = hint.split(' ')[0];
                      return (
                        <TouchableOpacity
                          key={code}
                          onPress={() => setPromoInput(code)}
                          style={[
                            styles.hintChip,
                            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                          ]}
                        >
                          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                            {hint}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* BILL SUMMARY & CALCULATIONS */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                shadows.soft,
              ]}
            >
              <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
                FOLIO BREAKDOWN
              </Text>

              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.billValue, { color: colors.textPrimary }]}>
                  {brand.formatPrice(calculations.subtotal)}
                </Text>
              </View>

              {cartState.discountPercent > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.ready }]}>
                    Privilege Savings ({cartState.discountPercent}%)
                  </Text>
                  <Text style={[styles.billValue, { color: colors.ready, fontWeight: '700' }]}>
                    - {brand.formatPrice(calculations.discountAmount)}
                  </Text>
                </View>
              )}

              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
                  Hospitality Service (5%)
                </Text>
                <Text style={[styles.billValue, { color: colors.textPrimary }]}>
                  {brand.formatPrice(calculations.serviceCharge)}
                </Text>
              </View>

              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
                  Provincial Sales Tax (15%)
                </Text>
                <Text style={[styles.billValue, { color: colors.textPrimary }]}>
                  {brand.formatPrice(calculations.salesTax)}
                </Text>
              </View>


              <View style={[styles.totalDivider, { backgroundColor: colors.surfaceBorder }]} />

              {/* Final Total Area */}
              <View style={styles.grandTotalContainer}>
                <View>
                  <Text style={[styles.grandTotalLabel, { color: colors.textPrimary }]}>
                    Grand Total
                  </Text>
                  <Text style={[styles.grandTotalSub, { color: colors.mutedText }]}>
                    Inclusive of duties & service
                  </Text>
                </View>
                <Text style={[styles.grandTotalAmount, { color: colors.primary }]}>
                  {brand.formatPrice(calculations.grandTotal)}
                </Text>
              </View>
            </View>

            <View style={{ height: 90 }} />
          </ScrollView>

          {/* STICKY FLOATING BOTTOM BAR Pinned Above TabBar */}
          <View
            style={[
              styles.floatingBottomBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.cardBorder,
              },
              shadows.medium3D,
            ]}
          >
            <View style={styles.floatingBarInner}>
              <View>
                <Text style={[typography.caption, { color: colors.mutedText }]}>
                  {cartState.items.length} {cartState.items.length === 1 ? 'item' : 'items'} in Tray
                </Text>
                <Text style={[typography.headingSm, { color: colors.primary, fontWeight: '800' }]}>
                  {brand.formatPrice(calculations.grandTotal)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleProceedToSummary}
                style={[
                  styles.floatingProceedBtn,
                  { backgroundColor: colors.primary },
                  shadows.button3D,
                ]}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={colors.gradientPrimary || [colors.primary, colors.primaryPressed || '#E04A27']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.floatingProceedGradient}
                >
                  <Text style={[styles.floatingProceedText, { color: colors.onPrimary }]}>
                    Review Order
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </>
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
    paddingBottom: 24,
  },
  emptyScrollContent: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 48,
  },
  emptyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  serviceTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  welcomeVoucherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  voucherIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clocheCenterSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 12,
    marginBottom: 28,
  },
  clocheCanvas: {
    width: 160,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  clocheAmbientGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  sparksContainer: {
    position: 'absolute',
    top: 6,
    width: '80%',
    height: 20,
  },
  sparkDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  clocheStructure: {
    alignItems: 'center',
    zIndex: 2,
  },
  clocheHandle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginBottom: -4,
    zIndex: 3,
  },
  clocheDome: {
    width: 90,
    height: 48,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    borderWidth: 2,
    overflow: 'hidden',
  },
  clocheHighlight: {
    width: 60,
    height: 20,
    borderRadius: 10,
    marginTop: 4,
    marginLeft: 12,
    opacity: 0.4,
  },
  clocheRim: {
    width: 104,
    height: 6,
    borderRadius: 3,
    marginTop: -2,
  },
  clochePlatter: {
    width: 120,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 20,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  browseBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  recommendedSection: {
    marginTop: 8,
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendedScroll: {
    gap: 12,
    paddingBottom: 8,
  },
  recommendCard: {
    width: 190,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recommendImage: {
    width: '100%',
    height: 110,
  },
  recommendImageFallback: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendBody: {
    padding: 10,
  },
  recommendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quickAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveServiceBanner: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  liveServiceBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveSeatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveSeatingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  liveSeatingTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveSeatingSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  liveSeatingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diningTypePillContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  diningTypePillBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diningTypePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cartHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearCartText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cartCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  itemThumbFallback: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
    marginTop: 2,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  noteInput: {
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
    padding: 0,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 44,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 26,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  activePromoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
  },
  activePromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePromoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activePromoSub: {
    fontSize: 12,
  },
  removePromoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removePromoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoTextInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  applyPromoBtn: {
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyPromoText: {
    fontSize: 13,
    fontWeight: '700',
  },
  promoErrorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  promoHintsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  hintChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  billLabel: {
    fontSize: 13,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalDivider: {
    height: 1,
    marginVertical: 12,
  },
  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  grandTotalSub: {
    fontSize: 11,
  },
  grandTotalAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  floatingBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  floatingProceedBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  floatingProceedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  floatingProceedText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
