import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { brand } from '../../config/brand';

export default function PriceSummary({
  subtotal = 0,
  tax = 0,
  serviceCharge = 0,
  discount = 0,
  promoCode = null,
  grandTotal = 0,
  style,
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Subtotal */}
      <View style={styles.row}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Subtotal
        </Text>
        <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
          {brand.formatPrice(subtotal)}
        </Text>
      </View>

      {/* Service Charge */}
      {serviceCharge > 0 ? (
        <View style={styles.row}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Service Charge (5%)
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
            {brand.formatPrice(serviceCharge)}
          </Text>
        </View>
      ) : null}

      {/* Sales Tax */}
      {tax > 0 ? (
        <View style={styles.row}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Sales Tax (15%)
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
            {brand.formatPrice(tax)}
          </Text>
        </View>
      ) : null}

      {/* Discount */}
      {discount > 0 ? (
        <View style={styles.row}>
          <Text style={[typography.body, { color: colors.ready }]}>
            Promo Discount {promoCode ? `(${promoCode})` : ''}
          </Text>
          <Text style={[typography.body, { color: colors.ready, fontWeight: '700' }]}>
            -{brand.formatPrice(discount)}
          </Text>
        </View>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.subtleBorder }]} />

      {/* Grand Total */}
      <View style={styles.totalRow}>
        <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
          Total Amount
        </Text>
        <Text style={[typography.price, { color: colors.primary, fontSize: 18 }]}>
          {brand.formatPrice(grandTotal)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
});
