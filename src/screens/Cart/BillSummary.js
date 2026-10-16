import React from 'react';
import { View, Text } from 'react-native';
import { brand } from '../../config/brand';
import { styles } from './cartStyles';

export default function BillSummary({
  calculations,
  discountPercent,
  colors,
  shadows,
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
        FOLIO BREAKDOWN
      </Text>

      <View style={styles.billRow}>
        <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Subtotal</Text>
        <Text style={[styles.billValue, { color: colors.textPrimary }]}>
          {brand.formatPrice(calculations.subtotal)}
        </Text>
      </View>

      {discountPercent > 0 && (
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.ready }]}>
            Privilege Savings ({discountPercent}%)
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
  );
}
