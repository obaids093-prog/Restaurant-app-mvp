import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBranch } from '../../context/BranchContext';
import { styles } from './step1Styles';

const VENUE_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';

export default function VenueSnapshotCard() {
  const { isDark } = useTheme();
  const { activeBranch } = useBranch();
  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  return (
    <View
      style={[
        styles.venueCard,
        {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
        },
      ]}
    >
      <View style={styles.venueImageWrapper}>
        <Image
          source={{ uri: VENUE_IMAGE }}
          style={styles.venueImage}
          resizeMode="cover"
        />
        <View style={styles.venueOverlayGradient} />
        <View style={styles.venueBadgesRow}>
          <View
            style={[
              styles.venueNamePill,
              {
                backgroundColor: isDark
                  ? 'rgba(18, 18, 18, 0.85)'
                  : 'rgba(255, 255, 255, 0.92)',
              },
            ]}
          >
            <Text
              style={[
                styles.venueNameText,
                { color: isDark ? '#F5F5F5' : '#1A1B22' },
              ]}
              numberOfLines={1}
            >
              {activeBranch?.fullName || 'Aura Kitchen'} • Fine Dining
            </Text>
          </View>
          <View style={styles.noFeePill}>
            <Text style={styles.noFeeText}>No booking fee</Text>
          </View>
        </View>
      </View>

      {/* TRUST MICRO-ROW */}
      <View style={styles.trustRow}>
        <View style={styles.trustItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
          <Text
            style={[
              styles.trustText,
              { color: isDark ? '#A8A8A8' : '#71717A' },
            ]}
          >
            Instant confirmation
          </Text>
        </View>
        <View style={styles.trustItem}>
          <Ionicons name="time-outline" size={16} color={primaryCoral} />
          <Text
            style={[
              styles.trustText,
              { color: isDark ? '#A8A8A8' : '#71717A' },
            ]}
          >
            Free cancel up to 2h before
          </Text>
        </View>
      </View>
    </View>
  );
}
