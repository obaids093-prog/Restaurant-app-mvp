import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles, getDateChipBadgeBg } from './reservationStyles';

export default function DateRow({
  upcomingDates,
  selectedDate,
  setSelectedDate,
  validationError,
}) {
  const { colors, typography, radius, shadows, isDark } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[typography.caption, styles.sectionHeaderLabel, { color: colors.mutedText }]}>
          SELECT DATE
        </Text>
        <View style={styles.sectionHeaderRight}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
            Next 7 Days Available
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScrollContainer}
      >
        {upcomingDates.map((d) => {
          const isSelected = selectedDate === d.iso;
          return (
            <TouchableOpacity
              key={d.iso}
              onPress={() => setSelectedDate(d.iso)}
              activeOpacity={0.8}
              style={[
                styles.dateChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                  borderRadius: radius.card,
                },
                isSelected && shadows.soft,
              ]}
            >
              <Text
                style={[
                  styles.dateChipDay,
                  {
                    color: isSelected ? colors.onPrimary : colors.mutedText,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {d.dayName}
              </Text>
              <Text
                style={[
                  styles.dateChipNum,
                  {
                    color: isSelected ? colors.onPrimary : colors.textPrimary,
                    fontWeight: '800',
                  },
                ]}
              >
                {d.dayNum}
              </Text>
              <View
                style={[
                  styles.dateChipBadge,
                  {
                    backgroundColor: getDateChipBadgeBg(isSelected, isDark, colors),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateChipStatus,
                    {
                      color: isSelected ? colors.onPrimary : colors.mutedText,
                    },
                  ]}
                >
                  {d.status}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {validationError && (
        <Text style={[styles.inlineError, { color: colors.error }]}>
          {validationError}
        </Text>
      )}
    </View>
  );
}
