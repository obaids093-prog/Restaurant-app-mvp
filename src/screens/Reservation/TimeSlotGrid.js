import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './step2Styles';

const LUNCH_SLOTS = [
  { time: '12:00', label: '12:00 PM', sub: 'Midday tea' },
  { time: '12:30', label: '12:30 PM', sub: 'Lunch rush' },
  { time: '13:00', label: '1:00 PM', sub: 'Table free' },
  { time: '13:30', label: '1:30 PM', sub: 'Prime slot' },
  { time: '14:00', label: '2:00 PM', sub: 'Outdoor opt.' },
  { time: '14:30', label: '2:30 PM', sub: 'Quiet hour' },
];

const DINNER_SLOTS = [
  { time: '18:00', label: '6:00 PM', sub: 'Early dinner' },
  { time: '18:30', label: '6:30 PM', sub: 'Window seat' },
  { time: '19:00', label: '7:00 PM', sub: 'Popular 🔥' },
  { time: '19:30', label: '7:30 PM', sub: 'Candlelight' },
  { time: '20:00', label: '8:00 PM', sub: 'Chef special' },
  { time: '20:30', label: '8:30 PM', sub: 'Late dinner' },
  { time: '21:00', label: '9:00 PM', sub: 'Late seating' },
  { time: '21:30', label: '9:30 PM', sub: 'Bar & Table' },
];

export default function TimeSlotGrid({
  selectedTimeSlot,
  setSelectedTimeSlot,
  isSlotAvailable,
}) {
  const { isDark } = useTheme();
  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  const renderSlotGroup = (title, iconName, timeRange, slots) => {
    return (
      <View style={styles.slotGroupSection}>
        <View style={styles.slotGroupHeader}>
          <View style={styles.slotGroupLeft}>
            <Ionicons name={iconName} size={18} color={primaryCoral} />
            <Text style={[styles.slotGroupTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              {title}
            </Text>
          </View>
          <Text style={[styles.slotGroupRange, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
            {timeRange}
          </Text>
        </View>

        <View style={styles.slotsGrid3Col}>
          {slots.map((item) => {
            const isAvailable = isSlotAvailable ? isSlotAvailable(item.time) : true;
            const isSelected = selectedTimeSlot === item.time || selectedTimeSlot === item.label;

            if (!isAvailable) {
              return (
                <View
                  key={item.time}
                  style={[
                    styles.slotCard,
                    styles.slotCardDisabled,
                    {
                      backgroundColor: isDark ? '#1A1A1A' : '#ECECEC',
                      borderColor: isDark ? '#252525' : '#E5E5E5',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.slotTimeText,
                      {
                        color: isDark ? '#666666' : '#999999',
                        textDecorationLine: 'line-through',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.slotSubText, { color: isDark ? '#666666' : '#999999' }]}>
                    FULL
                  </Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={item.time}
                onPress={() => setSelectedTimeSlot(item.time)}
                activeOpacity={0.85}
                style={[
                  styles.slotCard,
                  isSelected
                    ? [
                        styles.slotCardSelected,
                        {
                          backgroundColor: primaryCoral,
                          borderColor: primaryCoral,
                        },
                      ]
                    : {
                        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                        borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
                      },
                ]}
              >
                <Text
                  style={[
                    styles.slotTimeText,
                    { color: isSelected ? '#FFFFFF' : isDark ? '#F5F5F5' : '#1A1B22' },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.slotSubText,
                    {
                      color: isSelected
                        ? 'rgba(255, 255, 255, 0.95)'
                        : item.sub.includes('Popular')
                        ? primaryCoral
                        : isDark
                        ? '#A8A8A8'
                        : '#71717A',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {isSelected ? 'Selected' : item.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View>
      {renderSlotGroup('Lunch', 'sunny-outline', '12:00 PM – 3:30 PM', LUNCH_SLOTS)}
      {renderSlotGroup('Dinner', 'moon-outline', '6:00 PM – 10:30 PM', DINNER_SLOTS)}
    </View>
  );
}
