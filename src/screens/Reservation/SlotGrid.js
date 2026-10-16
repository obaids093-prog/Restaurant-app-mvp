import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles, DINING_SLOT_GROUPS, getSlotChipStyles } from './reservationStyles';

export default function SlotGrid({
  selectedDate,
  selectedTimeSlot,
  setSelectedTimeSlot,
  isSlotAvailable,
  validationError,
}) {
  const { colors, typography, radius, shadows, isDark } = useTheme();

  // Check if slot is in the past for today (under 1 hour ahead)
  const isSlotPastToday = (slot) => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate !== today) return false;
    const [slotHour] = slot.split(':').map(Number);
    const currentHour = new Date().getHours();
    return slotHour <= currentHour;
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[typography.caption, styles.sectionHeaderLabel, { color: colors.mutedText }]}>
          AVAILABLE TIME-SLOTS
        </Text>
        <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
          Selected: {selectedTimeSlot}
        </Text>
      </View>

      {DINING_SLOT_GROUPS.map((group) => (
        <View
          key={group.title}
          style={[
            styles.slotGroupCard,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.cardBorder,
              borderRadius: radius.card,
            },
          ]}
        >
          <View style={styles.slotGroupHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={group.icon} size={16} color={colors.primary} />
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 14 }]}>
                {group.title}
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
              {group.timeRange}
            </Text>
          </View>

          <View style={styles.slotsGrid}>
            {group.slots.map((slot) => {
              const isSelected = selectedTimeSlot === slot;
              const isAvailable = isSlotAvailable(slot);
              const isPast = isSlotPastToday(slot);
              const isDisabled = !isAvailable || isPast;
              const chipStyles = getSlotChipStyles(isSelected, isDisabled, isDark, colors);

              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => {
                    if (!isDisabled) {
                      setSelectedTimeSlot(slot);
                    }
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.8}
                  style={[
                    styles.slotChip,
                    {
                      backgroundColor: chipStyles.backgroundColor,
                      borderColor: chipStyles.borderColor,
                      borderRadius: radius.button,
                      opacity: isDisabled ? 0.45 : 1,
                    },
                    isSelected && shadows.soft,
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      styles.slotChipText,
                      {
                        color: chipStyles.textColor,
                        fontWeight: isSelected ? '700' : '600',
                        textDecorationLine: isDisabled ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {slot}
                  </Text>
                  {isDisabled && (
                    <Text
                      style={[
                        styles.slotStatusSub,
                        { color: colors.mutedText },
                      ]}
                    >
                      {isPast ? 'Passed' : 'Full'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {validationError && (
        <Text style={[styles.inlineError, { color: colors.error }]}>
          {validationError}
        </Text>
      )}
    </View>
  );
}
