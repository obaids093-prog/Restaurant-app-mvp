import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HourlyBarChart({ hourlyData = [], colors, typography, radius, isDark }) {
  if (!Array.isArray(hourlyData) || hourlyData.length === 0) {
    return null;
  }

  // Filter to daytime/evening dining hours (e.g. 11 AM to 11 PM or non-zero hours)
  // Or show 2-hour groups or 12 active hours to look clean on mobile screens
  const activeHours = hourlyData.filter((h) => h.hour >= 11 && h.hour <= 23);
  const displayHours = activeHours.length > 0 ? activeHours : hourlyData.slice(11, 23);

  const maxOrders = Math.max(...displayHours.map((h) => h.orderCount), 1);
  const CHART_HEIGHT = 100;

  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: colors.surfaceSubtle,
          borderColor: colors.cardBorder,
          borderRadius: radius.card,
        },
      ]}
    >
      <View style={styles.chartHeader}>
        <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}>
          Hourly Order Rush
        </Text>
        <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
          11 AM – 11 PM
        </Text>
      </View>

      <View style={[styles.barsContainer, { height: CHART_HEIGHT }]}>
        {displayHours.map((item) => {
          const barHeight = Math.max(
            (item.orderCount / maxOrders) * (CHART_HEIGHT - 24),
            item.orderCount > 0 ? 8 : 3
          );
          const hasOrders = item.orderCount > 0;

          return (
            <View key={item.hour} style={styles.barCol}>
              {/* Order Count Label above bar if > 0 */}
              <Text
                style={[
                  typography.caption,
                  {
                    fontSize: 9,
                    color: hasOrders ? colors.primary : 'transparent',
                    fontWeight: '700',
                    marginBottom: 2,
                  },
                ]}
              >
                {hasOrders ? item.orderCount : ''}
              </Text>

              {/* Bar view */}
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: hasOrders
                      ? colors.primary
                      : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                    borderRadius: radius.pill || 4,
                  },
                ]}
              />

              {/* Hour label below bar */}
              <Text
                style={[
                  typography.caption,
                  {
                    fontSize: 9,
                    color: colors.mutedText,
                    marginTop: 6,
                    fontWeight: hasOrders ? '600' : '400',
                  },
                ]}
              >
                {item.hour % 3 === 0 ? item.label.replace(' ', '') : '•'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    padding: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 10,
  },
});
