import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './step3Styles';

const QUICK_TAGS = [
  { id: 'bday', emoji: '🎂', label: 'Birthday' },
  { id: 'window', emoji: '🪟', label: 'Window seat' },
  { id: 'chair', emoji: '👶', label: 'High chair' },
  { id: 'gluten', emoji: '🌾', label: 'Gluten allergy' },
];

export default function SpecialRequestsCard({
  specialRequests,
  setSpecialRequests,
}) {
  const { isDark } = useTheme();
  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  const handleToggleTag = (tagLabel) => {
    const current = (specialRequests || '').trim();
    if (!current) {
      setSpecialRequests(tagLabel);
      return;
    }
    if (current.includes(tagLabel)) {
      // remove
      const updated = current
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== tagLabel)
        .join(', ');
      setSpecialRequests(updated);
    } else {
      // append
      setSpecialRequests(`${current}, ${tagLabel}`);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
          🛎️ Special requests & notes
        </Text>
        <Text style={[styles.optionalBadge, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
          Optional
        </Text>
      </View>

      <TextInput
        style={[
          styles.textareaInput,
          {
            backgroundColor: isDark ? '#262626' : '#F4F2FD',
            borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
            color: isDark ? '#F5F5F5' : '#1A1B22',
          },
        ]}
        placeholder="Any allergies, celebration, or seating preferences?"
        placeholderTextColor={isDark ? '#777777' : '#999999'}
        multiline
        numberOfLines={3}
        value={specialRequests}
        onChangeText={setSpecialRequests}
      />

      {/* QUICK CHIP SUGGESTIONS */}
      <View style={styles.chipsWrap}>
        {QUICK_TAGS.map((tag) => {
          const isIncluded = (specialRequests || '').includes(tag.label);
          return (
            <TouchableOpacity
              key={tag.id}
              onPress={() => handleToggleTag(tag.label)}
              activeOpacity={0.8}
              style={[
                styles.requestChip,
                isIncluded
                  ? {
                      backgroundColor: isDark ? 'rgba(255, 107, 74, 0.16)' : '#FFDAD2',
                      borderColor: primaryCoral,
                    }
                  : {
                      backgroundColor: isDark ? '#262626' : '#F4F2FD',
                      borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
                    },
              ]}
            >
              <Text>{tag.emoji}</Text>
              <Text
                style={[
                  styles.requestChipText,
                  { color: isIncluded ? primaryCoral : isDark ? '#F5F5F5' : '#1A1B22' },
                ]}
              >
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
