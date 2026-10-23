import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoyaltySection({
  colors,
  shadows,
  loyaltyPoints = 0,
  tier = 'Bronze',
  pointsRedeemed = 0,
  pointsDiscountAmount = 0,
  subtotal = 0,
  onApplyPoints,
  onRemovePoints,
}) {
  if (loyaltyPoints < 50 && pointsRedeemed === 0) {
    return null;
  }

  const maxRedeemable = Math.min(loyaltyPoints, Math.floor(subtotal * 0.5));

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="sparkles" size={14} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            LOYALTY REWARDS • {tier.toUpperCase()} TIER
          </Text>
        </View>
        <Text style={[styles.balancePill, { color: colors.primary }]}>
          {loyaltyPoints} pts available
        </Text>
      </View>

      {pointsRedeemed > 0 ? (
        <View style={[styles.activePointsBadge, { backgroundColor: colors.primaryTint }]}>
          <View style={styles.activePointsLeft}>
            <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.activePointsText, { color: colors.primary }]}>
                {pointsRedeemed} Points Applied
              </Text>
              <Text style={[styles.activePointsSub, { color: colors.textSecondary }]}>
                -Rs. {pointsDiscountAmount?.toLocaleString()} instant VIP deduction
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onRemovePoints} style={styles.removeBtn}>
            <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          <Text style={[styles.hintLabel, { color: colors.textSecondary }]}>
            Redeem your patron points for instant savings (1 pt = Rs. 1):
          </Text>

          <View style={styles.chipsRow}>
            {maxRedeemable >= 50 && (
              <TouchableOpacity
                onPress={() => onApplyPoints(50)}
                style={[
                  styles.chipBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.textPrimary }]}>50 pts (Rs. 50)</Text>
              </TouchableOpacity>
            )}

            {maxRedeemable >= 100 && (
              <TouchableOpacity
                onPress={() => onApplyPoints(100)}
                style={[
                  styles.chipBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.textPrimary }]}>100 pts (Rs. 100)</Text>
              </TouchableOpacity>
            )}

            {maxRedeemable > 100 && (
              <TouchableOpacity
                onPress={() => onApplyPoints(maxRedeemable)}
                style={[
                  styles.chipBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.primary, fontWeight: '700' }]}>
                  Max {maxRedeemable} pts
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  balancePill: {
    fontSize: 12,
    fontWeight: '700',
  },
  activePointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  activePointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePointsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activePointsSub: {
    fontSize: 11,
    marginTop: 1,
  },
  removeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionsContainer: {
    marginTop: 2,
  },
  hintLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
