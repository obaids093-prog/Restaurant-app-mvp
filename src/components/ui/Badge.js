import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function Badge({
  label,
  status, // 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Confirmed' | 'Cancelled' | 'Declined' | 'neutral'
  icon,
  style,
  textStyle,
}) {
  const { colors, typography, radius, isDark } = useTheme();

  const getStatusStyles = () => {
    const norm = (status || label || '').toLowerCase().trim();
    switch (norm) {
      case 'pending':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.20)' : 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.35)',
          text: colors.pending,
          iconName: 'time-outline',
        };
      case 'preparing':
        return {
          bg: isDark ? 'rgba(37, 99, 235, 0.20)' : 'rgba(37, 99, 235, 0.12)',
          border: 'rgba(37, 99, 235, 0.35)',
          text: colors.preparing,
          iconName: 'flame-outline',
        };
      case 'ready':
      case 'served':
      case 'confirmed':
        return {
          bg: isDark ? 'rgba(22, 163, 74, 0.20)' : 'rgba(22, 163, 74, 0.12)',
          border: 'rgba(22, 163, 74, 0.35)',
          text: colors.ready,
          iconName: 'checkmark-circle-outline',
        };
      case 'cancelled':
      case 'declined':
      case 'error':
        return {
          bg: isDark ? 'rgba(220, 38, 38, 0.20)' : 'rgba(220, 38, 38, 0.12)',
          border: 'rgba(220, 38, 38, 0.35)',
          text: colors.error,
          iconName: 'close-circle-outline',
        };
      default:
        return {
          bg: colors.surfaceSubtle,
          border: colors.subtleBorder,
          text: colors.textSecondary,
          iconName: null,
        };
    }
  };

  const statusStyle = getStatusStyles();

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: statusStyle.bg,
          borderColor: statusStyle.border,
          borderRadius: radius.pill,
        },
        style,
      ]}
    >
      {icon || (statusStyle.iconName ? (
        <Ionicons
          name={statusStyle.iconName}
          size={12}
          color={statusStyle.text}
          style={styles.icon}
        />
      ) : null)}
      <Text
        style={[
          typography.caption,
          styles.text,
          { color: statusStyle.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
    fontSize: 12,
  },
});
