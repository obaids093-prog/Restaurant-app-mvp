import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './cartStyles';

export default function VoucherSection({
  colors,
  shadows,
  promoCode,
  discountPercent,
  discountAmount,
  discountType,
  promoInput,
  promoError,
  onPromoInputChange,
  onApplyPromo,
  onRemovePromo,
}) {
  return (
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

      {promoCode ? (
        <View style={[styles.activePromoBadge, { backgroundColor: colors.primaryTint }]}>
          <View style={styles.activePromoLeft}>
            <View style={[styles.promoCheckCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.activePromoText, { color: colors.primary }]}>
                {promoCode} Applied
              </Text>
              <Text style={[styles.activePromoSub, { color: colors.textSecondary }]}>
                {discountType === 'fixed' || (discountAmount > 0 && !discountPercent)
                  ? `Rs. ${Number(discountAmount || 0).toLocaleString()} Patron Privilege Active`
                  : `${discountPercent}% Patron Privilege Active`}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onRemovePromo} style={styles.removePromoBtn}>
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
              placeholder="Enter voucher code"
              placeholderTextColor={colors.mutedText}
              value={promoInput}
              onChangeText={onPromoInputChange}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={onApplyPromo}
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

          <Text style={[styles.hintText, { color: colors.mutedText, paddingHorizontal: 4, marginTop: 4, fontSize: 11 }]}>
            Browse deals on the menu for available vouchers
          </Text>
        </View>
      )}
    </View>
  );
}
