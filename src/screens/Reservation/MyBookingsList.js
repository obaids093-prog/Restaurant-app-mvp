import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/ui';
import MyBookingsCard from './MyBookingsCard';
import { styles } from './myBookingsStyles';

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
  const { isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [showErrorBanner, setShowErrorBanner] = useState(true);

  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';
  const surfaceBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const raisedBg = isDark ? '#262626' : '#F4F2FD';
  const borderSubtle = isDark ? '#2E2E2E' : '#EBEAE5';
  const textPrimary = isDark ? '#F5F5F5' : '#1A1B22';
  const textSecondary = isDark ? '#A8A8A8' : '#71717A';

  // Count tab badges
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

  // Filter bookings according to active tab
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

  if (isLoading && reservationsList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryCoral} />
        <Text style={[styles.loadingTitle, { color: textPrimary }]}>Loading Your Bookings...</Text>
        <Text style={[styles.loadingSubtitle, { color: textSecondary }]}>
          Fetching live table reservations
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.cardsScrollContent, scrollContentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {/* ERROR NOTICE BANNER (DISMISSIBLE / RETRY) */}
      {error && showErrorBanner ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: isDark ? '#2A1B1B' : '#FEF2F2',
              borderColor: isDark ? 'rgba(255, 107, 74, 0.3)' : '#FCA5A5',
            },
          ]}
        >
          <View style={styles.errorBannerLeft}>
            <Ionicons name="refresh-circle" size={20} color={primaryCoral} />
            <Text
              style={[styles.errorBannerText, { color: isDark ? '#FF8A65' : '#B91C1C' }]}
              numberOfLines={1}
            >
              Could not refresh live bookings.
            </Text>
          </View>
          <View style={styles.errorBannerActions}>
            <TouchableOpacity
              onPress={refetchReservations}
              activeOpacity={0.8}
              style={[styles.retrySmallBtn, { backgroundColor: isDark ? '#262626' : '#FFFFFF' }]}
            >
              <Text style={[styles.retrySmallText, { color: primaryCoral }]}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowErrorBanner(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* HEADER SECTION: TITLE & TOTAL BADGE */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>My Bookings</Text>
          <View
            style={[
              styles.totalCountBadge,
              {
                backgroundColor: raisedBg,
                borderColor: borderSubtle,
              },
            ]}
          >
            <Text style={[styles.totalCountText, { color: textSecondary }]}>
              {tabCounts.all} total
            </Text>
          </View>
        </View>
      </View>

      {/* SEGMENTED FILTER TABS */}
      <View
        style={[
          styles.filterTabsContainer,
          {
            backgroundColor: surfaceBg,
            borderColor: borderSubtle,
          },
        ]}
      >
        {/* UPCOMING */}
        <TouchableOpacity
          onPress={() => setActiveFilter('upcoming')}
          activeOpacity={0.8}
          style={[
            styles.filterTabBtn,
            activeFilter === 'upcoming' && [
              styles.filterTabActiveBtn,
              {
                backgroundColor: raisedBg,
                borderColor: borderSubtle,
              },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'upcoming' ? primaryCoral : textSecondary,
                fontWeight: activeFilter === 'upcoming' ? '700' : '500',
              },
            ]}
          >
            Upcoming ({tabCounts.upcoming})
          </Text>
        </TouchableOpacity>

        {/* PAST / DONE */}
        <TouchableOpacity
          onPress={() => setActiveFilter('past')}
          activeOpacity={0.8}
          style={[
            styles.filterTabBtn,
            activeFilter === 'past' && [
              styles.filterTabActiveBtn,
              {
                backgroundColor: raisedBg,
                borderColor: borderSubtle,
              },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'past' ? primaryCoral : textSecondary,
                fontWeight: activeFilter === 'past' ? '700' : '500',
              },
            ]}
          >
            Past / Done ({tabCounts.past})
          </Text>
        </TouchableOpacity>

        {/* CANCELLED */}
        <TouchableOpacity
          onPress={() => setActiveFilter('cancelled')}
          activeOpacity={0.8}
          style={[
            styles.filterTabBtn,
            activeFilter === 'cancelled' && [
              styles.filterTabActiveBtn,
              {
                backgroundColor: raisedBg,
                borderColor: borderSubtle,
              },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'cancelled' ? primaryCoral : textSecondary,
                fontWeight: activeFilter === 'cancelled' ? '700' : '500',
              },
            ]}
          >
            Cancelled ({tabCounts.cancelled})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CARDS LIST OR EMPTY STATE */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={
            activeFilter === 'upcoming'
              ? 'No upcoming reservations'
              : activeFilter === 'past'
                ? 'No past dining history'
                : 'No cancelled bookings'
          }
          subtitle="Experience artisan fine dining under our botanical glasshouse or open courtyard."
          actionTitle="Reserve an Artisan Table"
          onAction={onRebookPress}
        />
      ) : (
        filteredBookings.map((booking, idx) => (
          <MyBookingsCard
            key={booking.id || booking._id || `booking-${idx}`}
            booking={booking}
            idx={idx}
            cancellingBookingId={cancellingBookingId}
            onCancelPress={onCancelPress}
            onRebookPress={onRebookPress}
            onModifyPress={onRebookPress}
          />
        ))
      )}
    </ScrollView>
  );
}
