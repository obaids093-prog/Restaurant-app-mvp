import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const STAGES = [
  { key: 'Pending', label: 'Order Received', desc: 'Sent to kitchen display', icon: 'receipt-outline' },
  { key: 'Preparing', label: 'Chef Cooking', desc: 'Crafting signature ingredients', icon: 'flame-outline' },
  { key: 'Ready', label: 'Plated & Ready', desc: 'Inspected and garnished', icon: 'restaurant-outline' },
  { key: 'Served', label: 'Delivered / Completed', desc: 'Bon appetit!', icon: 'checkmark-circle-outline' },
];

export default function OrderStepper({ currentStatus = 'Pending', style }) {
  const { colors, typography, radius } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const getStageIndex = (status) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Preparing':
        return 1;
      case 'Ready':
        return 2;
      case 'Served':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [pulseAnim, currentIndex]);

  return (
    <View style={[styles.container, style]}>
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STAGES.length - 1;

        return (
          <View key={stage.key} style={styles.stepRow}>
            {/* Left Timeline Column (Circle + Connector Line) */}
            <View style={styles.timelineColumn}>
              {isCurrent ? (
                <Animated.View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: colors.pending,
                      borderColor: colors.pending,
                      borderRadius: radius.pill,
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Ionicons name={stage.icon} size={16} color={colors.onPrimary} />
                </Animated.View>
              ) : (
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: isCompleted ? colors.ready : colors.surfaceSubtle,
                      borderColor: isCompleted ? colors.ready : colors.subtleBorder,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark' : stage.icon}
                    size={16}
                    color={isCompleted ? colors.onPrimary : colors.mutedText}
                  />
                </View>
              )}

              {!isLast ? (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: isCompleted ? colors.ready : colors.subtleBorder,
                    },
                  ]}
                />
              ) : null}
            </View>

            {/* Right Text Content */}
            <View style={styles.stepContent}>
              <Text
                style={[
                  typography.caption,
                  styles.stepLabel,
                  {
                    color: isCurrent
                      ? colors.pending
                      : isCompleted
                      ? colors.textPrimary
                      : colors.mutedText,
                    fontWeight: isCurrent ? '700' : isCompleted ? '600' : '400',
                  },
                ]}
              >
                {stage.label}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: isCurrent ? colors.textSecondary : colors.mutedText, fontSize: 12 },
                ]}
              >
                {stage.desc}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 56,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 36,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 4,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
});
