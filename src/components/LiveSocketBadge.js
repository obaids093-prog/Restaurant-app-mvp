/**
 * src/components/LiveSocketBadge.js
 * ═══════════════════════════════════════════════════════════
 * REAL-TIME STATUS BADGE (Roadmap Item #2)
 *
 * Displays current WebSocket connectivity status with a pulsing
 * colored dot (Green = Live, Amber = Reconnecting, Gray = Offline).
 * Used across Manager Operations Dashboard and Kitchen Display System.
 * ═══════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

export function LiveSocketBadge({ compact = false, style }) {
  const { isConnected, connectionState } = useSocket();
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isConnected) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isConnected, pulseAnim]);

  const dotColor = isConnected
    ? '#10B981' // emerald-500
    : connectionState === 'reconnecting'
    ? '#F59E0B' // amber-500
    : '#6B7280'; // gray-500

  const statusLabel = isConnected
    ? 'LIVE'
    : connectionState === 'reconnecting'
    ? 'SYNCING...'
    : 'OFFLINE';

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Real-time connection: ${statusLabel}`}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            opacity: isConnected ? pulseAnim : 0.7,
            shadowColor: dotColor,
          },
        ]}
      />
      {!compact && (
        <Text
          style={[
            styles.label,
            {
              color: isDark ? colors.textSecondary || '#9CA3AF' : '#4B5563',
            },
          ]}
        >
          {statusLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

export default LiveSocketBadge;
