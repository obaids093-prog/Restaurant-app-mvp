import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../utils/SafeLinearGradient';
import { useTheme } from '../../context/ThemeContext';
import { FilterTabs, EmptyState } from '../../components/ui';
import {
  styles,
  getEmptyStateTitle,
  getZonePhoto,
  getBookingStatusStyles,
} from './reservationStyles';

function BookingCardAction({
  booking,
  canCancel,
  isCompleted,
  isPast,
  isNoShow,
  cancellingBookingId,
  onCancelPress,
  onRebookPress,
  colors,
  typography,
  radius,
}) {
  const isThisCancelling = cancellingBookingId === (booking.id || booking._id);

  if (canCancel) {
    return (
      <TouchableOpacity
        onPress={() => onCancelPress(booking)}
        disabled={isThisCancelling}
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
        {isThisCancelling ? (
          <ActivityIndicator size="small" color={colors.cancelled} style={{ marginRight: 6 }} />
        ) : (
          <Ionicons name="close-circle-outline" size={16} color={colors.cancelled} style={{ marginRight: 6 }} />
        )}
        <Text style={[typography.caption, { color: colors.cancelled, fontWeight: '700' }]}>
          {isThisCancelling ? 'Cancelling...' : 'Cancel Reservation'}
        </Text>
      </TouchableOpacity>
    );
  }

  if (isCompleted || (isPast && !isNoShow)) {
    return (
      <View style={styles.cancelledNoteRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
          <Text style={[typography.caption, { color: '#10B981', fontWeight: '700' }]}>
            Dining Completed • Visited
          </Text>
        </View>
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
            Reserve Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isNoShow) {
    return (
      <View style={styles.cancelledNoteRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="alert-circle" size={16} color="#F59E0B" />
          <Text style={[typography.caption, { color: '#F59E0B', fontWeight: '700' }]}>
            Missed Reservation (No-Show)
          </Text>
        </View>
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
            Reserve Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cancelLabel =
    booking.status === 'Declined'
      ? 'Declined by restaurant'
      : 'Cancelled by guest request';

  return (
    <View style={styles.cancelledNoteRow}>
      <Text style={[typography.caption, { color: colors.mutedText, fontStyle: 'italic' }]}>
        {cancelLabel}
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
  );
}

function HistoryBookingCard({
  booking,
  idx,
  cancellingBookingId,
  onCancelPress,
  onRebookPress,
  colors,
  typography,
  radius,
  shadows,
}) {
  const isNoShow = booking.status === 'No-Show';
  const isCancelled = booking.status === 'Cancelled' || booking.status === 'Declined';
  const isConfirmed = booking.status === 'Confirmed' || booking.status === 'Approved';
  const isCompleted = booking.status === 'Completed';
  const today = new Date().toISOString().split('T')[0];
  const bookingDate = booking.date || today;
  const bookingTime = booking.timeSlot || booking.time || '23:59';
  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
  const isPast =
    isCompleted ||
    bookingDate < today ||
    (bookingDate === today && !Number.isNaN(bookingDateTime.getTime()) && bookingDateTime.getTime() < Date.now());
  const canCancel = !isCancelled && !isPast && !isNoShow;

  const zonePhoto = getZonePhoto(booking.tableName);
  const statusStyles = getBookingStatusStyles(booking, isCompleted, isNoShow, isConfirmed, isCancelled, colors);
  const refNumber = booking.id ? `#BK-${String(booking.id).slice(-4).toUpperCase()}` : `#BK-${idx + 1000}`;

  return (
    <View
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
          <View style={[styles.statusPill, { backgroundColor: statusStyles.bg }]}>
            <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '700', fontSize: 11 }]}>
              {statusStyles.label}
            </Text>
          </View>
        </View>
      </View>

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

        <View style={styles.bookingActionsRow}>
          <BookingCardAction
            booking={booking}
            canCancel={canCancel}
            isCompleted={isCompleted}
            isPast={isPast}
            isNoShow={isNoShow}
            cancellingBookingId={cancellingBookingId}
            onCancelPress={onCancelPress}
            onRebookPress={onRebookPress}
            colors={colors}
            typography={typography}
            radius={radius}
          />
        </View>
      </View>
    </View>
  );
}

export default function MyBookingsList({
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
  const { colors, typography, radius, shadows } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');

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
      return true;
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
      <View style={{ marginBottom: 16 }}>
        <FilterTabs
          scrollable
          tabs={[
            { id: 'all', label: 'All', count: tabCounts.all },
            { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
            { id: 'past', label: 'Past', count: tabCounts.past },
            { id: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled },
          ]}
          activeTab={activeFilter}
          onSelectTab={setActiveFilter}
        />
      </View>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={getEmptyStateTitle(activeFilter)}
          subtitle="Experience artisan fine dining under our botanical glasshouse or open courtyard."
          actionTitle="Reserve an Artisan Table"
          onAction={onRebookPress}
        />
      ) : (
        filteredBookings.map((booking, idx) => (
          <HistoryBookingCard
            key={booking.id || booking._id || `booking-${idx}`}
            booking={booking}
            idx={idx}
            cancellingBookingId={cancellingBookingId}
            onCancelPress={onCancelPress}
            onRebookPress={onRebookPress}
            colors={colors}
            typography={typography}
            radius={radius}
            shadows={shadows}
          />
        ))
      )}
    </ScrollView>
  );
}
