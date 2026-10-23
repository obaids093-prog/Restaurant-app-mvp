import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { BranchChip } from '../../components/ui';
import { styles } from './step2Styles';
import TimeSlotGrid from './TimeSlotGrid';

const AMBIENT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80';

const SEATING_FILTERS = [
  { id: 'indoor', label: 'Main Dining' },
  { id: 'patio', label: 'Outdoor Terrace' },
  { id: 'booth', label: 'Quiet Corner' },
];

export default function Step2PickTime({
  selectedDate,
  setSelectedDate,
  upcomingDates = [],
  partySize = 2,
  selectedZone = 'indoor',
  setSelectedZone,
  selectedTimeSlot = '19:00',
  setSelectedTimeSlot,
  isSlotAvailable,
  onBack,
  onNext,
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  // Format active criteria for summary card
  const summaryDateString = useMemo(() => {
    if (!selectedDate) return 'Today';
    const found = upcomingDates.find((d) => d.iso === selectedDate);
    if (found) {
      return `${found.dayName}, ${found.dayNum}`;
    }
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      // fallback
    }
    return selectedDate;
  }, [selectedDate, upcomingDates]);

  // Zone display name
  const zoneDisplayName = useMemo(() => {
    const map = {
      indoor: 'Indoor',
      patio: 'Patio',
      family: 'Family',
      booth: 'Booth',
      glasshouse: 'Glasshouse',
      courtyard: 'Courtyard',
      counter: "Chef's Counter",
    };
    return map[selectedZone] || 'Indoor';
  }, [selectedZone]);

  // Format time slot for CTA button
  const displayTime = useMemo(() => {
    if (!selectedTimeSlot) return '1:30 PM';
    if (selectedTimeSlot.includes('PM') || selectedTimeSlot.includes('AM')) {
      return selectedTimeSlot;
    }
    const [h, m] = selectedTimeSlot.split(':').map(Number);
    if (isNaN(h)) return selectedTimeSlot;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
  }, [selectedTimeSlot]);

  // Select tomorrow helper for rush alert
  const handleTryTomorrow = () => {
    if (upcomingDates.length > 1) {
      setSelectedDate(upcomingDates[1].iso);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FBFBF9' }]}>
      {/* TOP BAR WITH BACK BUTTON & BRANCH */}
      <View style={[styles.topBarHeader, { paddingTop: insets.top > 0 ? insets.top + 6 : 10 }]}>
        <View style={styles.topBarRow}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.8}
              style={[
                styles.backBtn,
                { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? '#F5F5F5' : '#1A1B22'}
              />
            </TouchableOpacity>
            <Text style={[styles.topBarTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              Seating & Area
            </Text>
          </View>
          <View style={styles.topBarRight}>
            <BranchChip />
          </View>
        </View>

        {/* 3-SEGMENT PROGRESS BAR (STEP 2 ACTIVE) */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressSegment, { backgroundColor: primaryCoral }]} />
          <View style={[styles.progressSegment, { backgroundColor: primaryCoral }]} />
          <View
            style={[
              styles.progressSegment,
              { backgroundColor: isDark ? '#2E2E2E' : '#EBEAE5' },
            ]}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, 12) + 80 },
        ]}
      >
        {/* ACTIVE CRITERIA SUMMARY CARD */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
            },
          ]}
        >
          <View style={styles.summaryLeft}>
            <Ionicons name="calendar" size={17} color={primaryCoral} />
            <Text
              style={[
                styles.summaryText,
                { color: isDark ? '#F5F5F5' : '#1A1B22' },
              ]}
              numberOfLines={1}
            >
              {summaryDateString} • {partySize} {partySize === 1 ? 'Guest' : 'Guests'} • {zoneDisplayName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.8}
            style={styles.summaryEditBtn}
          >
            <Text style={[styles.summaryEditText, { color: primaryCoral }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* TITLE & DURATION HELPER */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              Pick a time
            </Text>
            <View
              style={[
                styles.stepCounterBadge,
                {
                  backgroundColor: isDark ? '#262626' : '#FFDAD2',
                  borderColor: isDark ? '#2E2E2E' : '#FFDAD2',
                },
              ]}
            >
              <Text style={[styles.stepCounterText, { color: primaryCoral }]}>
                2/3
              </Text>
            </View>
          </View>
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={15} color={isDark ? '#A8A8A8' : '#71717A'} />
            <Text style={[styles.durationText, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
              Estimated dining duration: <Text style={{ fontWeight: '700', color: isDark ? '#F5F5F5' : '#1A1B22' }}>1h 30m</Text>
            </Text>
          </View>
        </View>

        {/* AMBIENT HERO IMAGE CARD */}
        <View
          style={[
            styles.ambientHeroCard,
            { borderColor: isDark ? '#2E2E2E' : '#EBEAE5' },
          ]}
        >
          <Image
            source={{ uri: AMBIENT_HERO_IMAGE }}
            style={styles.ambientHeroImage}
            resizeMode="cover"
          />
          <View style={styles.ambientHeroGradient} />
          <View
            style={[
              styles.ambientHeroPill,
              { backgroundColor: 'rgba(0, 0, 0, 0.65)' },
            ]}
          >
            <Ionicons name="flame" size={16} color={primaryCoral} />
            <Text style={styles.ambientHeroPillText} numberOfLines={1}>
              Prime dinner tables fill up quickly for {partySize} guests
            </Text>
          </View>
        </View>

        {/* TIME SLOTS GRID (LUNCH & DINNER) */}
        <TimeSlotGrid
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
          isSlotAvailable={isSlotAvailable}
        />

        {/* EVENING RUSH ALERT BANNER */}
        <View
          style={[
            styles.rushAlertCard,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
            },
          ]}
        >
          <View
            style={[
              styles.rushIconCircle,
              {
                backgroundColor: isDark ? '#262626' : '#F4F2FD',
                borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={18} color={primaryCoral} />
          </View>
          <View style={styles.rushContent}>
            <Text style={[styles.rushTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              Evening rush alert
            </Text>
            <Text style={[styles.rushDesc, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
              All standard dinner tables are heavily booked. Need a prime 7:30 PM slot?
            </Text>
            <TouchableOpacity
              onPress={handleTryTomorrow}
              activeOpacity={0.8}
              style={styles.rushLinkBtn}
            >
              <Text style={[styles.rushLinkText, { color: primaryCoral }]}>
                Try tomorrow
              </Text>
              <Ionicons name="arrow-forward" size={13} color={primaryCoral} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SEATING PREFERENCE MICRO-PILLS */}
        <View style={styles.seatingFilterSection}>
          <Text
            style={[
              styles.seatingFilterTitle,
              { color: isDark ? '#A8A8A8' : '#71717A' },
            ]}
          >
            Seating Preference
          </Text>
          <View style={styles.seatingFilterRow}>
            {SEATING_FILTERS.map((f) => {
              const isSelected = selectedZone === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedZone(f.id)}
                  activeOpacity={0.85}
                  style={[
                    styles.seatingFilterPill,
                    isSelected
                      ? {
                          backgroundColor: isDark ? 'rgba(255, 107, 74, 0.14)' : '#FFDAD2',
                          borderColor: primaryCoral,
                        }
                      : {
                          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                          borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
                        },
                  ]}
                >
                  <View
                    style={[
                      styles.filterRadioDot,
                      { borderColor: isSelected ? primaryCoral : isDark ? '#777777' : '#CCCCCC' },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.filterRadioInner,
                          { backgroundColor: primaryCoral },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.seatingFilterText,
                      { color: isSelected ? primaryCoral : isDark ? '#A8A8A8' : '#71717A' },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
          <Text style={styles.primaryCtaText}>
            Next: Your details ({displayTime})
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.ctaSubText, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
          No booking deposit required • Instant confirmation
        </Text>
      </View>
    </View>
  );
}
