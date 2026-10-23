import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { BranchChip } from '../../components/ui';
import { styles } from './step3Styles';
import PrimaryContactCard from './PrimaryContactCard';
import SpecialRequestsCard from './SpecialRequestsCard';

const ROOM_THUMBNAIL =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80';

/** Detect auto-generated placeholder emails from Phone OTP signup */
const isPlaceholderEmail = (e) => {
  if (!e || typeof e !== 'string') return true;
  const lower = e.toLowerCase().trim();
  return (
    lower.includes('@customer.aura.pk') ||
    lower.includes('@aurabistro.pk') ||
    lower.includes('@aurakitchen.pk') ||
    lower.includes('aurahospitality') ||
    lower.includes('aura.internal') ||
    /^\+?\d{9,15}@/.test(lower)
  );
};

export default function Step3YourDetails({
  selectedDate,
  upcomingDates = [],
  partySize = 2,
  selectedZone = 'indoor',
  selectedTimeSlot = '19:00',
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  specialRequests,
  setSpecialRequests,
  validationErrors = {},
  isSubmitting = false,
  onBack,
  onSubmit,
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { activeBranch } = useBranch();
  const { user } = useAuth();

  // Pre-fill email from user profile, but show empty if it's a placeholder
  const userRealEmail = user?.email && !isPlaceholderEmail(user.email) ? user.email : '';
  const [email, setEmail] = useState(userRealEmail);

  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';

  // Format date display
  const formattedDate = useMemo(() => {
    if (!selectedDate) return 'Today';
    const found = upcomingDates.find((d) => d.iso === selectedDate);
    if (found) {
      return `${found.dayName}, ${found.dayNum}`;
    }
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      // fallback
    }
    return selectedDate;
  }, [selectedDate, upcomingDates]);

  // Format time display
  const displayTime = useMemo(() => {
    if (!selectedTimeSlot) return '7:30 PM';
    if (selectedTimeSlot.includes('PM') || selectedTimeSlot.includes('AM')) {
      return selectedTimeSlot;
    }
    const [h, m] = selectedTimeSlot.split(':').map(Number);
    if (isNaN(h)) return selectedTimeSlot;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
  }, [selectedTimeSlot]);

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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FBFBF9' }]}>
      {/* TOP NAVIGATION HEADER */}
      <View style={[styles.topBarHeader, { paddingTop: insets.top > 0 ? insets.top + 6 : 10 }]}>
        <View style={styles.topBarRow}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.8}
              style={[styles.backBtn, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? '#F5F5F5' : '#1A1B22'} />
            </TouchableOpacity>
            <Text style={[styles.topBarTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              Guest Details & Review
            </Text>
          </View>
          <View style={styles.topBarRight}>
            <BranchChip />
          </View>
        </View>

        {/* 3-SEGMENT PROGRESS BAR (ALL 3 ACTIVE) */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressSegment, { backgroundColor: primaryCoral }]} />
          <View style={[styles.progressSegment, { backgroundColor: primaryCoral }]} />
          <View style={[styles.progressSegment, { backgroundColor: primaryCoral }]} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, 12) + 80 },
        ]}
      >
        {/* HERO TITLE & STEP 3 OF 3 BADGE */}
        <View style={styles.heroSection}>
          <View style={styles.stepTagRow}>
            <Text style={[styles.stepTagText, { color: primaryCoral }]}>Step 3 of 3</Text>
            <View style={[styles.stepTagDot, { backgroundColor: primaryCoral }]} />
            <Text style={[styles.stepTagSub, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
              Final confirmation
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
            Your details
          </Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
            Almost done! Confirm your contact info
          </Text>
        </View>

        {/* PRIMARY CONTACT CARD */}
        <PrimaryContactCard
          contactName={contactName}
          setContactName={setContactName}
          contactPhone={contactPhone}
          setContactPhone={setContactPhone}
          email={email}
          setEmail={setEmail}
          validationErrors={validationErrors}
        />

        {/* SPECIAL REQUESTS CARD */}
        <SpecialRequestsCard
          specialRequests={specialRequests}
          setSpecialRequests={setSpecialRequests}
        />

        {/* RESERVATION SUMMARY REVIEW CARD */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
            },
          ]}
        >
          <View style={styles.summaryTopRow}>
            <View
              style={[
                styles.summaryIconBox,
                {
                  backgroundColor: isDark ? '#262626' : '#FFDAD2',
                  borderColor: isDark ? '#2E2E2E' : '#FFDAD2',
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={20} color={primaryCoral} />
            </View>
            <View style={styles.summaryMainInfo}>
              <Text style={[styles.summaryMainTime, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
                {formattedDate} at {displayTime}
              </Text>
              <Text style={[styles.summaryMainParty, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
                {partySize} Guests • {zoneDisplayName} Dining
              </Text>
            </View>
            <View
              style={[
                styles.holdBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 107, 74, 0.16)' : '#FFDAD2',
                  borderColor: primaryCoral,
                },
              ]}
            >
              <Text style={[styles.holdBadgeText, { color: primaryCoral }]}>Hold</Text>
            </View>
          </View>

          <View
            style={[
              styles.summaryPolicySection,
              { borderTopColor: isDark ? '#2E2E2E' : '#F4F2FD' },
            ]}
          >
            <View style={styles.policyRow}>
              <Ionicons name="moon-outline" size={14} color={isDark ? '#A8A8A8' : '#71717A'} />
              <Text style={[styles.policyText, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
                Table reserved for 90 minutes
              </Text>
            </View>
            <View style={styles.policyRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
              <Text style={[styles.policyText, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
                Free cancellation up to 1 hour before
              </Text>
            </View>
          </View>
        </View>

        {/* ROOM / AMBIENCE PREVIEW CARD */}
        <View
          style={[
            styles.roomCard,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
            },
          ]}
        >
          <View style={styles.roomThumb}>
            <Image
              source={{ uri: ROOM_THUMBNAIL }}
              style={styles.roomThumbImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.roomContent}>
            <Text style={[styles.roomTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              {activeBranch?.fullName || 'The Conservatory Dining Room'}
            </Text>
            <Text style={[styles.roomDesc, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
              Warm acoustic ambiance & garden views in {activeBranch?.city || 'Pakistan'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* STICKY BOTTOM PRIMARY CTA */}
      <View
        style={[
          styles.stickyBottomContainer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(251, 251, 249, 0.94)',
            borderTopColor: isDark ? '#2E2E2E' : '#EBEAE5',
          },
        ]}
      >
        <TouchableOpacity
          onPress={onSubmit}
          disabled={isSubmitting}
          activeOpacity={0.88}
          style={[
            styles.primaryCtaBtn,
            {
              backgroundColor: primaryCoral,
              opacity: isSubmitting ? 0.7 : 1,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.primaryCtaText}>Confirm booking</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.ctaSubText, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
          Instant confirmation • No booking deposit required
        </Text>
      </View>
    </View>
  );
}
