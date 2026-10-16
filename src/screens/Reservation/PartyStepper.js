import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './reservationStyles';

const GUEST_PILLS = [
  { count: 2, icon: 'person-outline', label: '2 Guests' },
  { count: 4, icon: 'people-outline', label: '4 Guests' },
  { count: 6, icon: 'people-outline', label: '6 Guests' },
  { count: 8, icon: 'restaurant-outline', label: '8+ Guests' },
];

export default function PartyStepper({
  partySize,
  setPartySize,
  validationError,
}) {
  const { colors, typography, radius, shadows } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[typography.caption, styles.sectionHeaderLabel, { color: colors.mutedText }]}>
          PARTY SIZE
        </Text>
        <View
          style={[
            styles.stepperContainer,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.pill },
          ]}
        >
          <TouchableOpacity
            onPress={() => setPartySize((p) => Math.max(1, p - 1))}
            disabled={partySize <= 1}
            style={[styles.stepperBtn, partySize <= 1 && { opacity: 0.4 }]}
            activeOpacity={0.7}
            accessibilityLabel="Decrease guest count"
          >
            <Ionicons name="remove" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[typography.headingSm, styles.stepperValue, { color: colors.textPrimary }]}>
            {partySize}
          </Text>
          <TouchableOpacity
            onPress={() => setPartySize((p) => Math.min(12, p + 1))}
            disabled={partySize >= 12}
            style={[styles.stepperBtn, partySize >= 12 && { opacity: 0.4 }]}
            activeOpacity={0.7}
            accessibilityLabel="Increase guest count"
          >
            <Ionicons name="add" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.guestPillsGrid}>
        {GUEST_PILLS.map((item) => {
          const isSelected = partySize === item.count;
          return (
            <TouchableOpacity
              key={item.count}
              onPress={() => setPartySize(item.count)}
              style={[
                styles.guestPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                  borderRadius: radius.card,
                },
                isSelected && shadows.soft,
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon}
                size={15}
                color={isSelected ? colors.onPrimary : colors.mutedText}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected ? colors.onPrimary : colors.textPrimary,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {validationError && (
        <Text style={[styles.inlineError, { color: colors.error }]}>
          {validationError}
        </Text>
      )}
    </View>
  );
}
