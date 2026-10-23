import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEALS_FOR_YOU } from './menuStyles';

export default function DealsSection({
  deals = DEALS_FOR_YOU,
  selectedCategory = 'All',
  searchQuery = '',
  appliedPromo = null,
  onApplyDeal,
  colors,
  fonts,
  radius,
}) {
  if (!deals || deals.length === 0 || selectedCategory !== 'All' || searchQuery) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {deals.map((deal) => {
          const isApplied = appliedPromo === deal.code;
          const savingText =
            deal.description ||
            (deal.discountPercent
              ? `${deal.discountPercent}% off on your order`
              : 'Special promo savings');

          return (
            <TouchableOpacity
              key={deal.code}
              activeOpacity={0.8}
              onPress={() => onApplyDeal(deal.code)}
              style={[
                styles.ticketChip,
                {
                  backgroundColor: isApplied
                    ? colors.primaryTint || '#FFF2EE'
                    : colors.surface,
                  borderColor: isApplied ? colors.primary : colors.primary + '80',
                  borderRadius: radius?.sm || 12,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Apply voucher ${deal.code}`}
            >
              {/* Voucher Code Badge */}
              <View
                style={[
                  styles.codeBadge,
                  { backgroundColor: isApplied ? colors.primary : colors.primary + '18' },
                ]}
              >
                <Text
                  style={[
                    styles.codeText,
                    {
                      color: isApplied ? '#FFFFFF' : colors.primary,
                      fontFamily: fonts.bold,
                    },
                  ]}
                >
                  {deal.code}
                </Text>
              </View>

              {/* One-line Saving text */}
              <Text
                style={[
                  styles.savingText,
                  { color: colors.textPrimary, fontFamily: fonts.medium },
                ]}
                numberOfLines={1}
              >
                {savingText}
              </Text>

              {/* Action text: Apply / Applied */}
              <View style={styles.actionRow}>
                {isApplied ? (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.applyBtnText,
                      { color: colors.primary, fontFamily: fonts.bold },
                    ]}
                  >
                    Apply
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  ticketChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    maxWidth: 320,
    gap: 8,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  savingText: {
    fontSize: 12,
    flex: 1,
  },
  actionRow: {
    marginLeft: 4,
  },
  applyBtnText: {
    fontSize: 12,
  },
});
