import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

export default function EmptyState({
  icon = 'receipt-outline',
  title,
  subtitle,
  actionTitle,
  onAction,
  style,
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.primaryTint,
            borderColor: colors.subtleBorder,
            borderRadius: radius.card,
          },
        ]}
      >
        <Ionicons name={icon} size={42} color={colors.primary} />
      </View>

      <Text
        style={[
          typography.headingSm,
          styles.title,
          { color: colors.textPrimary },
        ]}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            typography.body,
            styles.subtitle,
            { color: colors.mutedText },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}

      {actionTitle && onAction ? (
        <View style={styles.actionWrapper}>
          <Button
            title={actionTitle}
            onPress={onAction}
            variant="primary"
            size="medium"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginVertical: 20,
    width: '100%',
  },
  iconCircle: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    marginBottom: 20,
  },
  actionWrapper: {
    width: '100%',
    maxWidth: 240,
    marginTop: 4,
  },
});
