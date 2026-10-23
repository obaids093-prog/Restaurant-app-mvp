import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useMenu } from '../../context/MenuContext';
import { useTheme } from '../../context/ThemeContext';
import { styles, SERVICE_CHARGE_RATE, SALES_TAX_RATE } from './cartStyles';
import CartEmptyState from './CartEmptyState';
import CartItemCard from './CartItemCard';
import VoucherSection from './VoucherSection';
import BillSummary from './BillSummary';
import FloatingCartFooter from './FloatingCartFooter';

export { SERVICE_CHARGE_RATE, SALES_TAX_RATE };

export default function CartScreen({ navigation }) {
  const { colors, isDark, shadows, typography } = useTheme();
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

    let discountAmount = 0;
    if (cartState.discountAmount > 0 && cartState.discountType === 'fixed') {
      discountAmount = Math.min(subtotal, cartState.discountAmount);
    } else if (cartState.discountPercent > 0) {
      discountAmount = subtotal * (cartState.discountPercent / 100);
      if (cartState.voucherDetails?.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, cartState.voucherDetails.maxDiscountAmount);
      }
    } else if (cartState.discountAmount > 0) {
      discountAmount = Math.min(subtotal, cartState.discountAmount);
    }

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
  }, [
    cartState.items,
    cartState.discountPercent,
    cartState.discountAmount,
    cartState.discountType,
    cartState.voucherDetails,
    getItemPrice,
  ]);

  // Handle promo code submission
  const handleApplyPromo = async (codeToApply) => {
    const code = (codeToApply || promoInput).trim();
    setPromoError('');
    if (!code) {
      setPromoError('Please enter a voucher code.');
      return;
    }

    try {
      const data = await applyPromo(code, calculations.subtotal);
      setPromoInput('');
      const discText =
        data?.discountType === 'percentage'
          ? `${data.discountValue}%`
          : `Rs. ${data?.discountAmount || data?.discountValue || ''}`;
      Alert.alert(
        'Voucher Applied',
        `Privilege voucher ${code.toUpperCase()} activated (${discText} savings).`
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {cartState.items.length === 0 ? (
        <CartEmptyState
          navigation={navigation}
          colors={colors}
          isDark={isDark}
          shadows={shadows}
          typography={typography}
          recommendedDishes={recommendedDishes}
          onApplyPromo={handleApplyPromo}
          onAddItem={addItem}
        />
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
              renderItem={({ item }) => (
                <CartItemCard
                  item={item}
                  unitPrice={getItemPrice(item)}
                  colors={colors}
                  shadows={shadows}
                  onIncrement={increment}
                  onDecrement={decrement}
                  onConfirmDelete={handleConfirmDelete}
                  onUpdateNote={updateNote}
                />
              )}
              scrollEnabled={false}
            />

            {/* VOUCHER / PROMO CODE SECTION */}
            <VoucherSection
              colors={colors}
              shadows={shadows}
              promoCode={cartState.promoCode}
              discountPercent={cartState.discountPercent}
              discountAmount={calculations.discountAmount}
              discountType={cartState.discountType}
              promoInput={promoInput}
              promoError={promoError}
              onPromoInputChange={(val) => {
                setPromoInput(val);
                if (promoError) setPromoError('');
              }}
              onApplyPromo={() => handleApplyPromo()}
              onRemovePromo={removePromo}
            />

            {/* BILL SUMMARY & CALCULATIONS */}
            <BillSummary
              calculations={calculations}
              discountPercent={cartState.discountPercent}
              colors={colors}
              shadows={shadows}
            />

            <View style={{ height: 90 }} />
          </ScrollView>

          {/* STICKY FLOATING BOTTOM BAR Pinned Above TabBar */}
          <FloatingCartFooter
            itemCount={cartState.items.length}
            grandTotal={calculations.grandTotal}
            colors={colors}
            shadows={shadows}
            typography={typography}
            onProceed={handleProceedToSummary}
          />
        </>
      )}
    </View>
  );
}
