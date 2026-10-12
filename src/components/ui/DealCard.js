import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function DealCard({
  code,
  discountPercent,
  description,
  onApply,
  isApplied = false,
  style,
}) {
  const { colors, typography, radius, isDark } = useTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: isApplied ? colors.primary : colors.cardBorder,
          borderRadius: radius.card,
        },
        !isDark && styles.lightShadow,
        style,
      ]}
    >
      <View style={styles.leftColumn}>
        <View
          style={[
            styles.discountBadge,
            {
              backgroundColor: colors.primaryTint,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Ionicons name="pricetag" size={13} color={colors.primary} />
          <Text
            style={[
              typography.caption,
              styles.discountText,
              { color: colors.primary },
            ]}
          >
            {discountPercent}% OFF
          </Text>
        </View>

        <Text
          style={[
            typography.headingSm,
            styles.codeTitle,
            { color: colors.textPrimary },
          ]}
        >
          {code}
        </Text>

        {description ? (
          <Text
            style={[
              typography.caption,
              { color: colors.mutedText, fontSize: 12 },
            ]}
            numberOfLines={1}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => onApply && onApply(code)}
        activeOpacity={0.8}
        style={[
          styles.actionBtn,
          {
            backgroundColor: isApplied ? colors.ready : colors.primary,
            borderRadius: radius.button - 2,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Apply promo code ${code}`}
      >
        <Ionicons
          name={isApplied ? 'checkmark-circle' : 'arrow-forward'}
          size={16}
          color={colors.onPrimary}
        />
        <Text
          style={[
            typography.caption,
            styles.btnText,
            { color: colors.onPrimary },
          ]}
        >
          {isApplied ? 'Applied' : 'Apply'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1.2,
    marginVertical: 6,
    width: '100%',
  },
  lightShadow: {
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 12,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  discountText: {
    fontWeight: '700',
    fontSize: 11,
  },
  codeTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    minWidth: 80,
  },
  btnText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
