import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../hooks/useApi';
import { brand } from '../../config/brand';

/**
 * Build chip label from voucher fields only.
 * Format: "CODE · 20% off" or "CODE · Rs. 500 off" + optional "Min Rs. 3,000"
 */
export function buildChipLabel(voucher) {
  const parts = [voucher.code];

  if (voucher.discountType === 'percentage') {
    parts.push(`${voucher.discountValue}% off`);
  } else {
    parts.push(`${brand.formatPrice(voucher.discountValue)} off`);
  }

  if (voucher.minOrderAmount && voucher.minOrderAmount > 0) {
    parts.push(`Min ${brand.formatPrice(voucher.minOrderAmount)}`);
  }

  return parts.join(' · ');
}

/**
 * Build chip details text for details sheet / tooltip.
 * Shows maxDiscountAmount for percent vouchers and expiration.
 */
export function buildChipDetails(voucher) {
  const lines = [];

  if (voucher.discountType === 'percentage' && voucher.maxDiscountAmount) {
    lines.push(`Up to ${brand.formatPrice(voucher.maxDiscountAmount)}`);
  }

  if (voucher.validUntil) {
    try {
      const expiry = new Date(voucher.validUntil).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
      lines.push(`Expires ${expiry}`);
    } catch {
      // ignore
    }
  }

  return lines.join(' · ');
}

export default function DealsSection({
  selectedCategory = 'All',
  searchQuery = '',
  appliedPromo = null,
  onApplyDeal,
  colors,
  fonts,
  radius,
}) {
  const [deals, setDeals] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const {
    data: activeVouchers,
    loading,
    error,
    refetch,
  } = useApi('/api/vouchers/active');

  const extractVouchers = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  };

  // Sync fetched vouchers into state
  useEffect(() => {
    if (activeVouchers) {
      const list = extractVouchers(activeVouchers);
      setDeals(list);
      setLoaded(true);
    } else if (activeVouchers === null && !loading && !error) {
      setDeals([]);
      setLoaded(true);
    }
  }, [activeVouchers, loading, error]);

  // Refetch when Menu screen gains focus (freshness requirement)
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      refetch()
        .then((freshData) => {
          if (mounted && freshData) {
            setDeals(extractVouchers(freshData));
            setLoaded(true);
          }
        })
        .catch(() => {});
      return () => { mounted = false; };
    }, [refetch])
  );

  // Hide entire Deals row: if loading not done, no deals, error, filtered, or searching
  if (!loaded || deals.length === 0 || selectedCategory !== 'All' || searchQuery) {
    return null;
  }

  const handleChipPress = async (voucher) => {
    try {
      await onApplyDeal(voucher.code);
    } catch (err) {
      // On rejection: show server message and refetch list
      Alert.alert('Voucher Unavailable', err.message || 'This voucher is no longer available.');
      refetch().catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {deals.map((deal) => {
          const isApplied = appliedPromo === deal.code;
          const chipLabel = buildChipLabel(deal);
          const details = buildChipDetails(deal);

          return (
            <TouchableOpacity
              key={deal._id || deal.code}
              activeOpacity={0.8}
              onPress={() => handleChipPress(deal)}
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
                  numberOfLines={1}
                >
                  {deal.code}
                </Text>
              </View>

              {/* One-line saving + min order text */}
              <View style={styles.labelColumn}>
                <Text
                  style={[
                    styles.savingText,
                    { color: colors.textPrimary, fontFamily: fonts.medium },
                  ]}
                  numberOfLines={1}
                >
                  {deal.discountType === 'percentage'
                    ? `${deal.discountValue}% off`
                    : `${brand.formatPrice(deal.discountValue)} off`}
                  {deal.minOrderAmount > 0
                    ? ` · Min ${brand.formatPrice(deal.minOrderAmount)}`
                    : ''}
                </Text>
                {details ? (
                  <Text
                    style={[
                      styles.detailText,
                      { color: colors.mutedText, fontFamily: fonts.regular },
                    ]}
                    numberOfLines={1}
                  >
                    {details}
                  </Text>
                ) : null}
              </View>

              {/* Action: Apply / Applied */}
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
    maxWidth: 340,
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
  labelColumn: {
    flex: 1,
  },
  savingText: {
    fontSize: 12,
  },
  detailText: {
    fontSize: 10,
    marginTop: 1,
  },
  actionRow: {
    marginLeft: 4,
  },
  applyBtnText: {
    fontSize: 12,
  },
});
