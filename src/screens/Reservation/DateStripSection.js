import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './step1Styles';

export default function DateStripSection({
  upcomingDates = [],
  selectedDate,
  setSelectedDate,
}) {
  const { isDark } = useTheme();
  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  const monthYearLabel = useMemo(() => {
    if (!selectedDate) return 'Select Date';
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return 'Select Date';
  }, [selectedDate]);

  const getStatusDotColor = (status, isSelected) => {
    if (isSelected) return '#FFFFFF';
    const s = String(status).toLowerCase();
    if (s.includes('few') || s.includes('fast')) return primaryCoral;
    if (s.includes('full')) return isDark ? '#777777' : '#8F7069';
    return '#10B981';
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name="calendar-outline" size={18} color={primaryCoral} />
          <Text style={[styles.sectionHeading, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
            Select Date
          </Text>
        </View>
        <View style={styles.monthPill}>
          <Text style={[styles.monthText, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
            {monthYearLabel}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStripContainer}
      >
        {upcomingDates.map((item) => {
          const isSelected = selectedDate === item.iso;
          const dotColor = getStatusDotColor(item.status, isSelected);

          return (
            <TouchableOpacity
              key={item.iso}
              onPress={() => setSelectedDate(item.iso)}
              activeOpacity={0.85}
              style={[
                styles.dateCard,
                isSelected
                  ? [styles.dateCardActive, { backgroundColor: primaryCoral }]
                  : [
                      styles.dateCardInactive,
                      {
                        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                        borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
                      },
                    ],
              ]}
            >
              <Text
                style={[
                  styles.dateDayName,
                  { color: isSelected ? '#FFFFFF' : isDark ? '#A8A8A8' : '#71717A' },
                ]}
              >
                {item.dayName}
              </Text>
              <Text
                style={[
                  styles.dateDayNum,
                  { color: isSelected ? '#FFFFFF' : isDark ? '#F5F5F5' : '#1A1B22' },
                ]}
              >
                {item.dayNum}
              </Text>
              <View style={styles.statusIndicatorRow}>
                <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                <Text
                  style={[
                    styles.statusText,
                    { color: isSelected ? '#FFFFFF' : isDark ? '#A8A8A8' : '#71717A' },
                  ]}
                  numberOfLines={1}
                >
                  {item.status === 'Available' ? 'Open' : item.status}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
