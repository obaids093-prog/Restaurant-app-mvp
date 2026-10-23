import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { BranchChip } from '../../components/ui';
import { styles } from './step1Styles';
import DateStripSection from './DateStripSection';
import GuestCounterSection from './GuestCounterSection';
import SeatingGridSection from './SeatingGridSection';
import VenueSnapshotCard from './VenueSnapshotCard';

export default function Step1WhenGuests({
  upcomingDates = [],
  selectedDate,
  setSelectedDate,
  partySize = 2,
  setPartySize,
  selectedZone = 'indoor',
  setSelectedZone,
  onNext,
  onViewBookings,
  bookingsCount = 0,
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // Primary coral token from specs
  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FBFBF9' }]}>
      {/* 3-SEGMENT PROGRESS HEADER TRACK */}
      <View style={[styles.progressTrack, { paddingTop: insets.top > 0 ? insets.top + 6 : 10 }]}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressSegment, { backgroundColor: primaryCoral }]} />
          <View
            style={[
              styles.progressSegment,
              { backgroundColor: isDark ? '#2E2E2E' : '#EBEAE5' },
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              { backgroundColor: isDark ? '#2E2E2E' : '#EBEAE5' },
            ]}
          />
        </View>

        {/* TOP BAR WITH TITLE & ACTIONS */}
        <View style={styles.topBarRow}>
          <View style={styles.topBarLeft}>
            <Text style={[styles.topBarTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              Select Party & Time
            </Text>
          </View>
          <View style={styles.topBarRight}>
            <BranchChip />
            {onViewBookings && (
              <TouchableOpacity
                onPress={onViewBookings}
                style={[
                  styles.myBookingsPill,
                  {
                    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                    borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="receipt-outline" size={14} color={primaryCoral} />
                <Text style={[styles.myBookingsText, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
                  Bookings{bookingsCount > 0 ? ` (${bookingsCount})` : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, 12) + 72 },
        ]}
      >
        {/* STEP PILL & HERO CONTEXT */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.stepBadge,
              {
                backgroundColor: isDark ? '#262626' : '#FFDAD2',
                borderColor: isDark ? '#2E2E2E' : '#FFDAD2',
              },
            ]}
          >
            <Ionicons name="restaurant" size={13} color={primaryCoral} />
            <Text
              style={[
                styles.stepBadgeText,
                { color: isDark ? primaryCoral : '#3D0600' },
              ]}
            >
              Step 1 of 3
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
            Book a table
          </Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
            Select your date, party size & seating preference
          </Text>
        </View>

        {/* SECTION 1: SELECT DATE */}
        <DateStripSection
          upcomingDates={upcomingDates}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        {/* SECTION 2: NUMBER OF GUESTS */}
        <GuestCounterSection
          partySize={partySize}
          setPartySize={setPartySize}
        />

        {/* SECTION 3: SEATING PREFERENCE */}
        <SeatingGridSection
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
        />

        {/* SECTION 4: VENUE SNAPSHOT & TRUST SIGNALS */}
        <VenueSnapshotCard />
      </ScrollView>

      {/* STICKY BOTTOM PRIMARY CTA */}
      <View
        style={[
          styles.stickyBottomContainer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: isDark
              ? 'rgba(18, 18, 18, 0.94)'
              : 'rgba(251, 251, 249, 0.94)',
            borderTopColor: isDark ? '#2E2E2E' : '#EBEAE5',
          },
        ]}
      >
        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.88}
          style={[styles.primaryCtaBtn, { backgroundColor: primaryCoral }]}
        >
          <Text style={styles.primaryCtaText}>Next: Pick a time</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
