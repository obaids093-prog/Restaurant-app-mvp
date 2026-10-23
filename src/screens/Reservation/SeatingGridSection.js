import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './step1Styles';

const SEATING_OPTIONS = [
  { id: 'indoor', emoji: '🌿', name: 'Indoor', desc: 'Cozy dining room' },
  { id: 'patio', emoji: '☀️', name: 'Patio', desc: 'Heated garden' },
  { id: 'family', emoji: '👨‍👩‍👧', name: 'Family', desc: 'Spacious area' },
  { id: 'booth', emoji: '🍷', name: 'Booth', desc: 'Intimate lounge' },
];

export default function SeatingGridSection({
  selectedZone = 'indoor',
  setSelectedZone,
}) {
  const { isDark } = useTheme();
  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name="leaf-outline" size={18} color={primaryCoral} />
          <Text style={[styles.sectionHeading, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
            Seating preference
          </Text>
        </View>
        <View
          style={[
            styles.optionalBadge,
            {
              backgroundColor: isDark ? '#262626' : '#F4F2FD',
              borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
            },
          ]}
        >
          <Text
            style={[
              styles.optionalText,
              { color: isDark ? '#A8A8A8' : '#71717A' },
            ]}
          >
            Optional
          </Text>
        </View>
      </View>

      {/* 2x2 SEATING OPTIONS GRID */}
      <View style={styles.seatingGrid}>
        {SEATING_OPTIONS.map((opt) => {
          const isSelected = selectedZone === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setSelectedZone(opt.id)}
              activeOpacity={0.85}
              style={[
                styles.seatingCard,
                isSelected
                  ? [
                      styles.seatingCardActive,
                      {
                        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                        borderColor: primaryCoral,
                      },
                    ]
                  : [
                      styles.seatingCardInactive,
                      {
                        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                        borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
                      },
                    ],
              ]}
            >
              <Text style={styles.seatingEmoji}>{opt.emoji}</Text>
              <View style={styles.seatingInfo}>
                <Text
                  style={[
                    styles.seatingTitle,
                    { color: isDark ? '#F5F5F5' : '#1A1B22' },
                  ]}
                >
                  {opt.name}
                </Text>
                <Text
                  style={[
                    styles.seatingDesc,
                    { color: isDark ? '#A8A8A8' : '#71717A' },
                  ]}
                >
                  {opt.desc}
                </Text>
              </View>

              {isSelected && (
                <View
                  style={[
                    styles.seatCheckBadge,
                    { backgroundColor: primaryCoral },
                  ]}
                >
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
