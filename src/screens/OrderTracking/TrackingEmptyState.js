import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './trackingStyles';

export default function TrackingEmptyState({
  onNavigateToMenu,
  colors,
  shadows,
  typography,
}) {
  return (
    <View
      style={[
        styles.emptyHeroCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      {/* Cloche with schedule beacon */}
      <View style={styles.emptyClocheCanvas}>
        <View style={[styles.emptyClocheGlow, { backgroundColor: colors.primaryTint }]} />
        <View style={[styles.emptyClocheOuter, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons name="restaurant" size={32} color={colors.primary} />
        </View>
        <View style={[styles.emptyClockBeacon, { backgroundColor: colors.primary }]}>
          <Ionicons name="time" size={14} color={colors.onPrimary} />
        </View>
      </View>

      <Text style={[typography.headingSm, styles.emptyHeroTitle, { color: colors.textPrimary }]}>
        No Active Orders in Kitchen
      </Text>
      <Text style={[typography.body, styles.emptyHeroSub, { color: colors.textSecondary }]}>
        You don't have any culinary orders currently firing in Chef Farhan's kitchen. Place a dine-in or takeaway order to track station progress live.
      </Text>

      <TouchableOpacity
        onPress={onNavigateToMenu}
        style={[styles.emptyHeroBtn, { backgroundColor: colors.primary }, shadows.button3D]}
        activeOpacity={0.88}
      >
        <Text style={[styles.emptyHeroBtnText, { color: colors.onPrimary }]}>
          Explore Artisan Menu
        </Text>
        <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </View>
  );
}
