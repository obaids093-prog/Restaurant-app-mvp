import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';
import Card from './Card';

export default function SuccessState({
  title,
  subtitle,
  referenceId,
  referenceLabel = 'Order Reference',
  details,
  primaryActionTitle,
  onPrimaryAction,
  secondaryActionTitle,
  onSecondaryAction,
  style,
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Halo Success Icon */}
      <View
        style={[
          styles.outerHalo,
          { backgroundColor: 'rgba(22, 163, 74, 0.12)' },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            { backgroundColor: colors.success },
          ]}
        >
          <Ionicons name="checkmark" size={36} color={colors.onPrimary} />
        </View>
      </View>

      <Text
        style={[
          typography.headingLg,
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

      {referenceId ? (
        <Card style={styles.referenceCard} padding={14}>
          <Text
            style={[
              typography.caption,
              { color: colors.mutedText, textTransform: 'uppercase' },
            ]}
          >
            {referenceLabel}
          </Text>
          <Text
            style={[
              typography.headingSm,
              styles.referenceIdText,
              { color: colors.primary },
            ]}
          >
            {referenceId}
          </Text>
          {details ? (
            <View style={styles.detailsBox}>{details}</View>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.buttonsContainer}>
        {primaryActionTitle && onPrimaryAction ? (
          <Button
            title={primaryActionTitle}
            onPress={onPrimaryAction}
            variant="primary"
            size="large"
            style={styles.primaryBtn}
          />
        ) : null}

        {secondaryActionTitle && onSecondaryAction ? (
          <Button
            title={secondaryActionTitle}
            onPress={onSecondaryAction}
            variant="outline"
            size="large"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  outerHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 22,
    marginBottom: 20,
  },
  referenceCard: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  referenceIdText: {
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
  },
  detailsBox: {
    width: '100%',
    marginTop: 12,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    marginBottom: 4,
  },
});
