import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
  Image,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useReservation } from '../hooks/useReservation';
import { brand } from '../config/brand';
import { normalizePkPhone } from '../utils/phone';
import {
  SegmentedControl,
  FilterTabs,
  Input,
  PhoneInput,
  Button,
  EmptyState,
} from '../components/ui';

// ─── DINING SERVICE SLOTS ───────────────────────────────────────────────────
const DINING_SLOT_GROUPS = [
  {
    title: 'Lunch & Afternoon Tea',
    timeRange: '12:00 – 16:00',
    sub: 'Fresh daylight dining & midday bites',
    icon: 'sunny-outline',
    slots: ['12:00', '13:00', '14:00', '15:00', '16:00'],
  },
  {
    title: 'Dinner Service',
    timeRange: '17:00 – 20:00',
    sub: 'Golden hour candlelit service',
    icon: 'restaurant-outline',
    slots: ['17:00', '18:00', '19:00', '20:00'],
  },
  {
    title: 'Late Night Dining',
    timeRange: '21:00 – 22:00',
    sub: 'Ambient music & late culinary creations',
    icon: 'moon-outline',
    slots: ['21:00', '22:00'],
  },
];

// ─── SANCTUARY ZONES ────────────────────────────────────────────────────────
const SANCTUARY_ZONES = [
  {
    id: 'glasshouse',
    tag: 'A-01 • Glasshouse',
    name: 'Atrium Glasshouse Window',
    desc: 'High ceiling natural light, romantic & serene',
    capacity: '2–4 Guests',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'courtyard',
    tag: 'B-02 • Courtyard',
    name: 'Botanica Garden Terrace',
    desc: 'Open air courtyard botanical fountain breeze',
    capacity: '2–6 Guests',
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'counter',
    tag: 'C-03 • Front Row',
    name: "Chef's Counter Booth",
    desc: 'Interactive kitchen view, bespoke tasting craft',
    capacity: '1–2 Guests',
    image:
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format&fit=crop&q=80',
  },
];

// Cross-platform alert helper
const showModalAlert = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// ─── SUB-COMPONENT: Book Tab Content ────────────────────────────────────────
function BookTabContent({
  isLoading,
  tablesList,
  error,
  loadTables,
  upcomingDates,
  selectedDate,
  setSelectedDate,
  validationErrors,
  partySize,
  setPartySize,
  selectedTimeSlot,
  setSelectedTimeSlot,
  isSlotAvailable,
  selectedZone,
  setSelectedZone,
  specialRequests,
  setSpecialRequests,
  selectedTable,
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  handleOpenReview,
  scrollContentStyle,
}) {
  const { colors, typography, radius, shadows, isDark } = useTheme();

  if (isLoading && tablesList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.headingSm, { color: colors.textPrimary, marginTop: 16 }]}>
          Loading Artisan Tables...
        </Text>
        <Text style={[typography.caption, { color: colors.mutedText, marginTop: 4 }]}>
          Connecting to live reservation system
        </Text>
      </View>
    );
  }

  if (!isLoading && error && tablesList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
        <Text style={[typography.headingSm, { color: colors.error, marginTop: 14 }]}>
          Unable to Load Tables
        </Text>
        <Text style={[typography.caption, { color: colors.mutedText, marginTop: 4, textAlign: 'center' }]}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadTables}
          style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: radius.button }]}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: colors.onPrimary }]}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if slot is in the past for today (under 1 hour ahead)
  const isSlotPastToday = (slot) => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate !== today) return false;
    const [slotHour] = slot.split(':').map(Number);
    const currentHour = new Date().getHours();
    return slotHour <= currentHour;
  };

  return (
    <ScrollView
      contentContainerStyle={scrollContentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* SECTION 1: SELECT DATE */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[typography.caption, styles.sectionHeaderLabel, { color: colors.mutedText }]}>
            SELECT DATE
          </Text>
          <View style={styles.sectionHeaderRight}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
              Next 7 Days Available
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContainer}
        >
          {upcomingDates.map((d) => {
            const isSelected = selectedDate === d.iso;
            return (
              <TouchableOpacity
                key={d.iso}
                onPress={() => setSelectedDate(d.iso)}
                activeOpacity={0.8}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                    borderRadius: radius.card,
                  },
                  isSelected && shadows.soft,
                ]}
              >
                <Text
                  style={[
                    styles.dateChipDay,
                    {
                      color: isSelected ? colors.onPrimary : colors.mutedText,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {d.dayName}
                </Text>
                <Text
                  style={[
                    styles.dateChipNum,
                    {
                      color: isSelected ? colors.onPrimary : colors.textPrimary,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {d.dayNum}
                </Text>
                <View
                  style={[
                    styles.dateChipBadge,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                        ? colors.surface
                        : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateChipStatus,
                      {
                        color: isSelected ? colors.onPrimary : colors.mutedText,
                      },
                    ]}
                  >
                    {d.status}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {validationErrors.date && (
          <Text style={[styles.inlineError, { color: colors.error }]}>
            {validationErrors.date}
          </Text>
        )}
      </View>

      {/* SECTION 2: PARTY SIZE */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[typography.caption, styles.sectionHeaderLabel, { color: colors.mutedText }]}>
            PARTY SIZE
          </Text>
          {/* Quick Stepper */}
          <View
            style={[
              styles.stepperContainer,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.pill },
            ]}
          >
            <TouchableOpacity
              onPress={() => setPartySize((p) => Math.max(1, p - 1))}
              disabled={partySize <= 1}
              style={[styles.stepperBtn, partySize <= 1 && { opacity: 0.4 }]}
              activeOpacity={0.7}
              accessibilityLabel="Decrease guest count"
            >
              <Ionicons name="remove" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[typography.headingSm, styles.stepperValue, { color: colors.textPrimary }]}>
              {partySize}
            </Text>
            <TouchableOpacity
              onPress={() => setPartySize((p) => Math.min(12, p + 1))}
              disabled={partySize >= 12}
              style={[styles.stepperBtn, partySize >= 12 && { opacity: 0.4 }]}
              activeOpacity={0.7}
              accessibilityLabel="Increase guest count"
            >
              <Ionicons name="add" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preset Guest Pills */}
        <View style={styles.guestPillsGrid}>
          {[
            { count: 2, icon: 'person-outline', label: '2 Guests' },
            { count: 4, icon: 'people-outline', label: '4 Guests' },
            { count: 6, icon: 'people-outline', label: '6 Guests' },
            { count: 8, icon: 'restaurant-outline', label: '8+ Guests' },
          ].map((item) => {
            const isSelected = partySize === item.count;
            return (
              <TouchableOpacity
                key={item.count}
                onPress={() => setPartySize(item.count)}
                style={[
                  styles.guestPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                    borderRadius: radius.card,
                  },
                  isSelected && shadows.soft,
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={isSelected ? colors.onPrimary : colors.mutedText}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? colors.onPrimary : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {validationErrors.partySize && (
          <Text style={[styles.inlineError, { color: colors.error }]}>
            {validationErrors.partySize}
          </Text>
        )}
      </View>

      {/* SECTION 3: TABLE AREA & AMBIENCE */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[typography.caption, styles.sectionHeaderLabel, { color: colors.mutedText }]}>
            TABLE AREA & AMBIENCE
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText }]}>
            3 Curated Areas
          </Text>
        </View>

        <View style={styles.zonesStack}>
          {SANCTUARY_ZONES.map((zone) => {
            const isSelected = selectedZone === zone.id;
            return (
              <TouchableOpacity
                key={zone.id}
                onPress={() => setSelectedZone(zone.id)}
                activeOpacity={0.88}
                style={[
                  styles.zoneCard,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                    borderRadius: radius.card,
                  },
                  isSelected && shadows.soft,
                ]}
              >
                <Image source={{ uri: zone.image }} style={[styles.zoneImage, { borderRadius: radius.button }]} />
                <View style={styles.zoneContent}>
                  <View style={styles.zoneTagRow}>
                    <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', fontSize: 11 }]}>
                      {zone.tag}
                    </Text>
                    <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                      • {zone.capacity}
                    </Text>
                  </View>
                  <Text
                    style={[
                      typography.headingSm,
                      { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
                    ]}
                    numberOfLines={1}
                  >
                    {zone.name}
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]}
                    numberOfLines={1}
                  >
                    {zone.desc}
                  </Text>
                </View>

                {/* Radio selection checkmark */}
                <View
                  style={[
                    styles.zoneRadioCircle,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SECTION 4: AVAILABLE TIME-SLOTS */}
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
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDisabled
                          ? (isDark ? '#1a1a1a' : '#ececec')
                          : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : isDisabled
                          ? 'transparent'
                          : colors.cardBorder,
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
                          color: isSelected
                            ? colors.onPrimary
                            : isDisabled
                            ? colors.mutedText
                            : colors.textPrimary,
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

        {validationErrors.timeSlot && (
          <Text style={[styles.inlineError, { color: colors.error }]}>
            {validationErrors.timeSlot}
          </Text>
        )}
      </View>

      {/* SECTION 5: GUEST CONTACT DETAILS */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[typography.caption, styles.sectionHeaderLabel, { color: colors.mutedText }]}>
            GUEST CONTACT DETAILS
          </Text>
        </View>

        <Input
          label="Guest Name"
          placeholder="e.g. Zainab Malik"
          value={contactName}
          onChangeText={setContactName}
          icon={<Ionicons name="person-outline" size={18} color={colors.mutedText} />}
          error={validationErrors.name}
        />

        <PhoneInput
          label="Mobile Phone (SMS Confirmation)"
          value={contactPhone}
          onChangePhone={setContactPhone}
          error={validationErrors.phone}
        />

        <Input
          label="Special Requests (Optional)"
          placeholder="e.g. Anniversary celebration, window table preference..."
          value={specialRequests}
          onChangeText={setSpecialRequests}
          multiline
          numberOfLines={3}
          icon={<Ionicons name="sparkles-outline" size={18} color={colors.mutedText} />}
        />

        {validationErrors.table && (
          <View style={[styles.alertBanner, { backgroundColor: colors.errorTint, borderColor: colors.error }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.error} />
            <Text style={[typography.caption, { color: colors.error, flex: 1, marginLeft: 8 }]}>
              {validationErrors.table}
            </Text>
          </View>
        )}
      </View>

      {/* SECTION 6: REVIEW & CONFIRM BUTTON */}
      <View style={styles.section}>
        <Button
          title="Review & Confirm Booking"
          onPress={handleOpenReview}
          variant="primary"
          size="large"
          icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        />
      </View>
    </ScrollView>
  );
}

// ─── SUB-COMPONENT: History Tab Content (My Bookings) ───────────────────────
function HistoryTabContent({
  isLoading,
  error,
  reservationsList,
  displayedBookings,
  refetchReservations,
  cancellingBookingId,
  onCancelPress,
  onRebookPress,
  scrollContentStyle,
}) {
  const { colors, typography, radius, shadows, isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled' | 'all'

  // Filter bookings according to activeFilter
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(displayedBookings)) return [];
    const today = new Date().toISOString().split('T')[0];

    return displayedBookings.filter((b) => {
      const isCancelled = b.status === 'Cancelled' || b.status === 'Declined';
      const isPast = (b.date && b.date < today) || b.status === 'Completed';

      if (activeFilter === 'upcoming') {
        return !isCancelled && !isPast;
      }
      if (activeFilter === 'past') {
        return !isCancelled && isPast;
      }
      if (activeFilter === 'cancelled') {
        return isCancelled;
      }
      return true; // 'all'
    });
  }, [displayedBookings, activeFilter]);

  // Count badges for tabs
  const tabCounts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let upcoming = 0;
    let past = 0;
    let cancelled = 0;

    (displayedBookings || []).forEach((b) => {
      const isCancelled = b.status === 'Cancelled' || b.status === 'Declined';
      const isPast = (b.date && b.date < today) || b.status === 'Completed';
      if (isCancelled) cancelled++;
      else if (isPast) past++;
      else upcoming++;
    });

    return { upcoming, past, cancelled, all: (displayedBookings || []).length };
  }, [displayedBookings]);

  if (isLoading && reservationsList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.headingSm, { color: colors.textPrimary, marginTop: 16 }]}>
          Loading Your Bookings...
        </Text>
        <Text style={[typography.caption, { color: colors.mutedText, marginTop: 4 }]}>
          Fetching live table reservations
        </Text>
      </View>
    );
  }

  if (!isLoading && error && reservationsList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
        <Text style={[typography.headingSm, { color: colors.error, marginTop: 14 }]}>
          Could Not Load Bookings
        </Text>
        <Text style={[typography.caption, { color: colors.mutedText, marginTop: 4, textAlign: 'center' }]}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={refetchReservations}
          style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: radius.button }]}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: colors.onPrimary }]}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={scrollContentStyle}
      showsVerticalScrollIndicator={false}
    >
      {/* FILTER TABS (Upcoming, Past, Cancelled) */}
      <View style={{ marginBottom: 16 }}>
        <FilterTabs
          tabs={[
            { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
            { id: 'past', label: 'Past', count: tabCounts.past },
            { id: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled },
            { id: 'all', label: 'All', count: tabCounts.all },
          ]}
          activeTab={activeFilter}
          onSelectTab={setActiveFilter}
        />
      </View>

      {/* EMPTY STATE */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={
            activeFilter === 'upcoming'
              ? 'No Upcoming Reservations'
              : activeFilter === 'past'
              ? 'No Past Reservations'
              : activeFilter === 'cancelled'
              ? 'No Cancelled Bookings'
              : 'No Reservations Found'
          }
          subtitle="Experience artisan fine dining under our botanical glasshouse or open courtyard."
          actionTitle="Reserve an Artisan Table"
          onAction={onRebookPress}
        />
      ) : (
        /* BOOKINGS LIST */
        filteredBookings.map((booking, idx) => {
          const isCancelled = booking.status === 'Cancelled' || booking.status === 'Declined';
          const isConfirmed = booking.status === 'Confirmed' || booking.status === 'Approved';
          const isPending = !isCancelled && !isConfirmed;
          const bookingKey = booking.id || booking._id || `booking-${idx}`;

          // Find zone photo or fallback
          const zonePhoto =
            String(booking.tableName || '').toLowerCase().includes('courtyard') ||
            String(booking.tableName || '').toLowerCase().includes('terrace')
              ? SANCTUARY_ZONES[1].image
              : String(booking.tableName || '').toLowerCase().includes('counter')
              ? SANCTUARY_ZONES[2].image
              : SANCTUARY_ZONES[0].image;

          const refNumber = booking.id ? `#BK-${String(booking.id).slice(-4).toUpperCase()}` : `#BK-${idx + 1000}`;

          return (
            <View
              key={bookingKey}
              style={[
                styles.bookingCard,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.cardBorder,
                  borderRadius: radius.card,
                  opacity: isCancelled ? 0.7 : 1,
                },
                shadows.soft,
              ]}
            >
              {/* Card Ambient Banner */}
              <View style={[styles.bookingBanner, { borderRadius: radius.button }]}>
                <Image source={{ uri: zonePhoto }} style={styles.bookingBannerImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.bookingBannerGradient}
                />
                <View style={styles.bookingBannerOverlay}>
                  <View style={styles.bookingRefBadge}>
                    <Ionicons name="qr-code-outline" size={14} color="#FFFFFF" />
                    <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '700', fontSize: 11 }]}>
                      {refNumber}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isConfirmed
                          ? colors.ready
                          : isCancelled
                          ? colors.cancelled
                          : colors.pending,
                      },
                    ]}
                  >
                    <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '700', fontSize: 11 }]}>
                      {booking.status || 'Confirmed'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card Details */}
              <View style={styles.bookingDetails}>
                <Text
                  style={[typography.headingSm, { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }]}
                  numberOfLines={1}
                >
                  {booking.tableName || 'Artisan Table Reserved'}
                </Text>

                <View style={styles.bookingMetaRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                    <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '600' }]}>
                      {booking.date || 'Today'}
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.mutedText }]}>•</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time-outline" size={14} color={colors.mutedText} />
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {booking.timeSlot || '19:00'}
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.mutedText }]}>•</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="people-outline" size={14} color={colors.mutedText} />
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {booking.partySize} {booking.partySize === 1 ? 'Guest' : 'Guests'}
                    </Text>
                  </View>
                </View>

                {booking.specialRequests ? (
                  <View style={[styles.bookingNoteBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <Ionicons name="sparkles-outline" size={13} color={colors.primary} />
                    <Text
                      style={[typography.caption, { color: colors.textSecondary, fontSize: 12, flex: 1 }]}
                      numberOfLines={2}
                    >
                      "{booking.specialRequests}"
                    </Text>
                  </View>
                ) : null}

                {/* Card Actions */}
                <View style={styles.bookingActionsRow}>
                  {!isCancelled ? (
                    <TouchableOpacity
                      onPress={() => onCancelPress(booking)}
                      disabled={cancellingBookingId === (booking.id || booking._id)}
                      style={[
                        styles.cancelBookingBtn,
                        {
                          backgroundColor: colors.cancelledTint,
                          borderColor: colors.cancelled + '40',
                          borderRadius: radius.button,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      {cancellingBookingId === (booking.id || booking._id) ? (
                        <ActivityIndicator size="small" color={colors.cancelled} style={{ marginRight: 6 }} />
                      ) : (
                        <Ionicons name="close-circle-outline" size={16} color={colors.cancelled} style={{ marginRight: 6 }} />
                      )}
                      <Text style={[typography.caption, { color: colors.cancelled, fontWeight: '700' }]}>
                        {cancellingBookingId === (booking.id || booking._id)
                          ? 'Cancelling...'
                          : 'Cancel Reservation'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.cancelledNoteRow}>
                      <Text style={[typography.caption, { color: colors.mutedText, fontStyle: 'italic' }]}>
                        Cancelled by guest request
                      </Text>
                      <TouchableOpacity
                        onPress={onRebookPress}
                        style={[
                          styles.rebookBtn,
                          { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="refresh-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                          Re-book
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── SUB-COMPONENT: Confirm Booking Modal ───────────────────────────────────
function ConfirmBookingModal({
  visible,
  onClose,
  onConfirm,
  isSubmitting,
  selectedDate,
  selectedTimeSlot,
  partySize,
  selectedTable,
  contactName,
  contactPhone,
}) {
  const { colors, typography, radius, shadows } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.card * 1.5 },
            shadows.deep3D,
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconCircle, { backgroundColor: colors.primaryTint }]}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
            </View>
            <Text style={[typography.headingSm, { color: colors.textPrimary, marginTop: 10, fontWeight: '800' }]}>
              Confirm Reservation
            </Text>
            <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2, textAlign: 'center' }]}>
              Please verify your dining itinerary before finalizing
            </Text>
          </View>

          {/* Details Box */}
          <View
            style={[
              styles.modalDetailsBox,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
            ]}
          >
            <View style={styles.modalRow}>
              <Text style={[typography.caption, { color: colors.mutedText }]}>Date & Time:</Text>
              <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}>
                {selectedDate} • {selectedTimeSlot}
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[typography.caption, { color: colors.mutedText }]}>Party Size:</Text>
              <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}>
                {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[typography.caption, { color: colors.mutedText }]}>Seating Area:</Text>
              <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}>
                {selectedTable?.tableNumber
                  ? `Table ${selectedTable.tableNumber} (${selectedTable.location || 'Dining'})`
                  : 'Artisan Window / Terrace'}
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[typography.caption, { color: colors.mutedText }]}>Guest Name:</Text>
              <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}>
                {contactName}
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[typography.caption, { color: colors.mutedText }]}>SMS Confirmation:</Text>
              <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}>
                {normalizePkPhone(contactPhone).display || contactPhone}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={[
                styles.modalSecondaryBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.button },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[typography.button, { color: colors.textSecondary }]}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isSubmitting}
              style={[
                styles.modalPrimaryBtn,
                { backgroundColor: colors.primary, borderRadius: radius.button },
              ]}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[typography.button, { color: colors.onPrimary }]}>Confirm & Book</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── SUB-COMPONENT: Reservation Confirmed Sheet ─────────────────────────────
function ReservationConfirmedModal({
  visible,
  reservationData,
  onViewBookings,
  onDone,
}) {
  const { colors, typography, radius, shadows } = useTheme();
  if (!reservationData) return null;

  const refNumber = reservationData.id
    ? `#BK-${String(reservationData.id).slice(-4).toUpperCase()}`
    : '#BK-9182';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.card * 1.5 },
            shadows.deep3D,
          ]}
        >
          {/* Success Check Icon */}
          <View style={styles.confirmedHeader}>
            <View style={[styles.confirmedIconCircle, { backgroundColor: colors.readyTint }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.ready} />
            </View>
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', letterSpacing: 1, marginTop: 10 }]}>
              BOOKING {refNumber}
            </Text>
            <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '800', marginTop: 2 }]}>
              Artisan Table Reserved
            </Text>
            <Text style={[typography.caption, { color: colors.mutedText, textAlign: 'center', marginTop: 4 }]}>
              Confirmed for {reservationData.customerName || 'Valued Guest'} at AURA Gulberg III
            </Text>
          </View>

          {/* 2x2 Bento Grid */}
          <View style={styles.bentoGrid}>
            <View style={[styles.bentoTile, { backgroundColor: colors.surfaceSubtle, borderRadius: radius.button }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name="calendar-outline" size={14} color={colors.mutedText} />
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>DATE</Text>
              </View>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 13 }]}>
                {reservationData.date}
              </Text>
            </View>

            <View style={[styles.bentoTile, { backgroundColor: colors.surfaceSubtle, borderRadius: radius.button }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name="time-outline" size={14} color={colors.mutedText} />
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>TIME</Text>
              </View>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 13 }]}>
                {reservationData.timeSlot || reservationData.time}
              </Text>
            </View>

            <View style={[styles.bentoTile, { backgroundColor: colors.surfaceSubtle, borderRadius: radius.button }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name="people-outline" size={14} color={colors.mutedText} />
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>GUESTS</Text>
              </View>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 13 }]}>
                {reservationData.partySize} Reserved
              </Text>
            </View>

            <View style={[styles.bentoTile, { backgroundColor: colors.surfaceSubtle, borderRadius: radius.button }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name="location-outline" size={14} color={colors.mutedText} />
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>SEATING</Text>
              </View>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 13 }]} numberOfLines={1}>
                {reservationData.tableName || 'Atrium View'}
              </Text>
            </View>
          </View>

          {/* Hospitality Policy Note */}
          <View style={[styles.policyBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.button }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.secondary} />
            <Text style={[typography.caption, { color: colors.textSecondary, flex: 1, marginLeft: 8, fontSize: 12, lineHeight: 18 }]}>
              Your table will be held for <Text style={{ fontWeight: '700', color: colors.textPrimary }}>15 minutes</Text> past scheduled time. For dietary modifications, our Maître d' is ready to assist.
            </Text>
          </View>

          {/* Action CTAs */}
          <View style={{ gap: 8, marginTop: 16 }}>
            <Button
              title="View in My Bookings"
              onPress={onViewBookings}
              variant="primary"
              size="large"
            />
            <Button
              title="Done / Book Another"
              onPress={onDone}
              variant="ghost"
              size="medium"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN COMPONENT ──────────────────────────────────────────────────
export default function ReservationScreen() {
  const { user } = useAuth();
  const { colors, typography, shadows, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Reservation Hook
  const {
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    partySize,
    setPartySize,
    selectedTable,
    setSelectedTable,
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    specialRequests,
    setSpecialRequests,
    reservationsList,
    tablesList,
    validationErrors,
    isSlotAvailable,
    validateReservation,
    createReservation,
    cancelReservation,
    isLoading,
    error,
    loadTables,
    refetchReservations,
  } = useReservation(user);

  // Dynamic bottom padding for safe area & TabBar
  const scrollContentStyle = useMemo(
    () => [
      styles.scrollContent,
      { paddingBottom: Math.max(insets.bottom, 16) + 90 },
    ],
    [insets.bottom]
  );

  // Screen UI State
  const [activeTab, setActiveTab] = useState(0); // 0 = 'book', 1 = 'history'
  const [selectedZone, setSelectedZone] = useState('glasshouse');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  // Normalize displayed bookings (newest first)
  const displayedBookings = useMemo(() => {
    if (!Array.isArray(reservationsList)) return [];
    return [...reservationsList].sort((a, b) => {
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();
      if (createdA && createdB && createdA !== createdB) return createdB - createdA;
      const dateA = new Date(`${a.date || ''}T${a.timeSlot || a.time || '00:00'}`).getTime() || 0;
      const dateB = new Date(`${b.date || ''}T${b.time || b.timeSlot || '00:00'}`).getTime() || 0;
      if (dateA !== dateB) return dateB - dateA;
      return String(b._id || b.id || '').localeCompare(String(a._id || a.id || ''));
    });
  }, [reservationsList]);

  // Next 7 Days Ribbon Generator
  const upcomingDates = useMemo(() => {
    const dates = [];
    const baseDate = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const statuses = ['Available', 'Filling Fast', 'Available', 'Filling Fast', 'Available', 'Available', 'Available'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      dates.push({
        iso,
        dayName: i === 0 ? 'Today' : days[d.getDay()],
        dayNum: d.getDate(),
        status: statuses[i % statuses.length],
      });
    }
    return dates;
  }, []);

  // Handle Review action
  const handleOpenReview = useCallback(() => {
    if (validateReservation()) {
      setShowConfirmModal(true);
    } else {
      showModalAlert('Please Check Required Fields', 'Review the highlighted options to complete your table reservation.');
    }
  }, [validateReservation]);

  // Handle Confirm Submission
  const handleConfirmBooking = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await createReservation();
      setShowConfirmModal(false);
      setConfirmedReservation(res);
    } catch (err) {
      showModalAlert('Reservation Error', err.message || 'Could not complete reservation.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, createReservation]);

  // Handle Cancel action with platform-safe confirmation
  const handleCancelPress = useCallback(
    async (booking) => {
      const bookingId = booking.id || booking._id;
      const msg = `Are you sure you wish to cancel reservation ${bookingId} for ${booking.partySize} guests at ${booking.timeSlot || booking.time}?`;

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm && !window.confirm(msg)) return;
      } else {
        const confirmed = await new Promise((resolve) => {
          Alert.alert('Cancel Table Reservation', msg, [
            { text: 'Keep Booking', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Yes, Cancel', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
        if (!confirmed) return;
      }

      setCancellingBookingId(bookingId);
      try {
        await cancelReservation(bookingId);
        showModalAlert('Reservation Cancelled', 'Your dining table reservation has been cancelled.');
      } catch (err) {
        showModalAlert('Cancellation Error', err.message || 'Could not cancel reservation.');
      } finally {
        setCancellingBookingId(null);
      }
    },
    [cancelReservation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* HEADER & CONTEXT BAR */}
      <View
        style={[
          styles.headerContainer,
          {
            borderBottomColor: colors.cardBorder,
            paddingTop: insets.top > 0 ? insets.top + 8 : 12,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.headingLg, { color: colors.textPrimary, fontWeight: '800' }]}>
              Reserve an Artisan Table
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Fine dining dine-in experience in Lahore & Islamabad
            </Text>
          </View>

          {/* Location Chip */}
          <View style={[styles.locationChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
            <Ionicons name="location-sharp" size={14} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700', fontSize: 12 }]}>
              Gulberg III
            </Text>
          </View>
        </View>

        {/* SEGMENTED CONTROL TABS (New Reservation vs My Bookings) */}
        <View style={styles.segmentWrapper}>
          <SegmentedControl
            segments={[
              'New Reservation',
              `My Bookings (${displayedBookings.length})`,
            ]}
            selectedIndex={activeTab}
            onChange={(idx) => setActiveTab(idx)}
          />
        </View>
      </View>

      {/* ACTIVE TAB CONTENT */}
      {activeTab === 0 ? (
        <BookTabContent
          isLoading={isLoading}
          tablesList={tablesList}
          error={error}
          loadTables={loadTables}
          upcomingDates={upcomingDates}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          validationErrors={validationErrors}
          partySize={partySize}
          setPartySize={setPartySize}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
          isSlotAvailable={isSlotAvailable}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          specialRequests={specialRequests}
          setSpecialRequests={setSpecialRequests}
          selectedTable={selectedTable}
          contactName={contactName}
          setContactName={setContactName}
          contactPhone={contactPhone}
          setContactPhone={setContactPhone}
          handleOpenReview={handleOpenReview}
          scrollContentStyle={scrollContentStyle}
        />
      ) : (
        <HistoryTabContent
          isLoading={isLoading}
          error={error}
          reservationsList={reservationsList}
          displayedBookings={displayedBookings}
          refetchReservations={refetchReservations}
          cancellingBookingId={cancellingBookingId}
          onCancelPress={handleCancelPress}
          onRebookPress={() => setActiveTab(0)}
          scrollContentStyle={scrollContentStyle}
        />
      )}

      {/* REVIEW & CONFIRM MODAL */}
      <ConfirmBookingModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        isSubmitting={isSubmitting}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        partySize={partySize}
        selectedTable={selectedTable}
        contactName={contactName}
        contactPhone={contactPhone}
      />

      {/* RESERVATION CONFIRMED SUCCESS SHEET */}
      <ReservationConfirmedModal
        visible={!!confirmedReservation}
        reservationData={confirmedReservation}
        onViewBookings={() => {
          setConfirmedReservation(null);
          setActiveTab(1); // switch to My Bookings
        }}
        onDone={() => setConfirmedReservation(null)}
      />
    </View>
  );
}

// ─── STYLESHEET ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  segmentWrapper: {
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    padding: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Date Ribbon
  dateScrollContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  dateChip: {
    width: 74,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  dateChipDay: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateChipNum: {
    fontSize: 18,
    marginVertical: 2,
  },
  dateChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  dateChipStatus: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Party Size
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 10,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  guestPillsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  guestPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },

  // Sanctuary Zones
  zonesStack: {
    gap: 10,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1.5,
  },
  zoneImage: {
    width: 64,
    height: 64,
  },
  zoneContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  zoneTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Time Slots
  slotGroupCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  slotGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexBasis: '22%',
    flexGrow: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  slotChipText: {
    fontSize: 13,
  },
  slotStatusSub: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600',
  },

  // Banners & Notes
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  inlineError: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 2,
  },

  // Loading & Retry
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },

  // My Bookings Cards
  bookingCard: {
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  bookingBanner: {
    position: 'relative',
    height: 110,
    overflow: 'hidden',
    margin: 8,
  },
  bookingBannerImage: {
    width: '100%',
    height: '110%',
  },
  bookingBannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  bookingBannerOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bookingDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  bookingNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  bookingActionsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderWidth: 1,
  },
  cancelledNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDetailsBox: {
    padding: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 18,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  modalPrimaryBtn: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  // Confirmed Modal
  confirmedHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bentoTile: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 10,
  },
  policyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderWidth: 1,
  },
});
