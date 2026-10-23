import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './step1Styles';

const QUICK_GUEST_OPTIONS = [1, 2, 4, 6, 8];

export default function GuestCounterSection({
  partySize = 2,
  setPartySize,
}) {
  const { isDark } = useTheme();
  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  const handleMinus = () => {
    if (partySize > 1) {
      setPartySize(partySize - 1);
    }
  };

  const handlePlus = () => {
    if (partySize < 12) {
      setPartySize(partySize + 1);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name="people-outline" size={18} color={primaryCoral} />
        <Text style={[styles.sectionHeading, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
          Number of guests
        </Text>
      </View>

      <View
        style={[
          styles.guestCounterCard,
          {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
          },
        ]}
      >
        {/* MINUS / COUNT / PLUS ROW */}
        <View style={styles.counterRow}>
          <TouchableOpacity
            onPress={handleMinus}
            disabled={partySize <= 1}
            activeOpacity={0.8}
            style={[
              styles.stepperCircleBtn,
              {
                backgroundColor: isDark ? '#262626' : '#F4F2FD',
                borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
                opacity: partySize <= 1 ? 0.4 : 1,
              },
            ]}
          >
            <Ionicons
              name="remove"
              size={20}
              color={isDark ? '#F5F5F5' : '#1A1B22'}
            />
          </TouchableOpacity>

          <View style={styles.counterCenter}>
            <Text style={[styles.counterValue, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              {partySize} {partySize === 1 ? 'guest' : 'guests'}
            </Text>
            <View style={styles.autoConfigRow}>
              <Ionicons name="options-outline" size={13} color={primaryCoral} />
              <Text style={[styles.autoConfigText, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
                Tables automatically configured
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handlePlus}
            disabled={partySize >= 12}
            activeOpacity={0.8}
            style={[
              styles.stepperCircleBtn,
              {
                backgroundColor: primaryCoral,
                borderColor: primaryCoral,
                opacity: partySize >= 12 ? 0.4 : 1,
              },
            ]}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* QUICK SELECTOR CHIPS */}
        <View
          style={[
            styles.quickChipsRow,
            { borderTopColor: isDark ? '#2E2E2E' : '#F4F2FD' },
          ]}
        >
          {QUICK_GUEST_OPTIONS.map((val) => {
            const isActive = val === 8 ? partySize >= 8 : partySize === val;
            return (
              <TouchableOpacity
                key={val}
                onPress={() => setPartySize(val)}
                activeOpacity={0.8}
                style={[
                  styles.quickChip,
                  isActive
                    ? [
                        styles.quickChipActive,
                        {
                          backgroundColor: isDark ? 'rgba(255, 107, 74, 0.16)' : '#FFDAD2',
                          borderColor: primaryCoral,
                        },
                      ]
                    : [
                        styles.quickChipInactive,
                        {
                          backgroundColor: isDark ? '#262626' : '#F4F2FD',
                          borderColor: isDark ? '#2E2E2E' : 'transparent',
                        },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    {
                      color: isActive
                        ? primaryCoral
                        : isDark
                        ? '#A8A8A8'
                        : '#71717A',
                      fontWeight: isActive ? '700' : '600',
                    },
                  ]}
                >
                  {val === 8 ? '8+' : val}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
