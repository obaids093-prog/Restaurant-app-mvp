import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBranch } from '../../context/BranchContext';
import { brand } from '../../config/brand';
import { styles } from './myBookingsStyles';

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80';

export default function MyBookingsCard({
  booking,
  idx,
  cancellingBookingId,
  onCancelPress,
  onRebookPress,
  onModifyPress,
}) {
  const { isDark } = useTheme();
  const { activeBranch } = useBranch();

  const isNoShow = booking.status === 'No-Show';
  const isCancelled = booking.status === 'Cancelled' || booking.status === 'Declined';
  const isCompleted = booking.status === 'Completed';

  const todayStr = new Date().toISOString().split('T')[0];
  const bookingDate = booking.date || todayStr;
  const isPast =
    isCompleted ||
    bookingDate < todayStr ||
    (bookingDate === todayStr && booking.timeSlot && booking.timeSlot < '12:00' && isNoShow);

  const isUpcoming = !isCancelled && !isPast && !isNoShow;
  const isThisCancelling = cancellingBookingId === (booking.id || booking._id);

  const rawId = booking.id || booking._id || String(idx + 90124);
  const bookingRef = `#TBL-${String(rawId).slice(-5).toUpperCase()}`;

  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';
  const surfaceBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const raisedBg = isDark ? '#262626' : '#F4F2FD';
  const borderSubtle = isDark ? '#2E2E2E' : '#EBEAE5';
  const textPrimary = isDark ? '#F5F5F5' : '#1A1B22';
  const textSecondary = isDark ? '#A8A8A8' : '#71717A';

  // Date formatting
  const formattedDate = (() => {
    if (!booking.date) return 'Today';
    if (booking.date === todayStr) return 'Today';

    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwStr = tmrw.toISOString().split('T')[0];
    if (booking.date === tmrwStr) return 'Tomorrow';

    try {
      const parts = booking.date.split('-');
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
    return booking.date;
  })();

  const displayTime = booking.timeSlot || booking.time || '7:30 PM';
  const serviceLabel =
    displayTime.includes('AM') || parseInt(displayTime, 10) < 4
      ? 'Lunch Service'
      : 'Dinner Service';
  const partySize = booking.partySize || booking.guests || 2;
  const seatingName = booking.tableName || 'Main Dining';

  const venueName =
    booking.branchName || activeBranch?.fullName || brand.restaurantName || 'AURA Artisan Dining';
  const venueAddress =
    booking.branchAddress ||
    activeBranch?.address ||
    brand.address ||
    '14-C Gulberg III, MM Alam Road, Lahore';

  const handleDirections = () => {
    const query = encodeURIComponent(`${venueName}, ${venueAddress}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  // Status badge config
  const statusConfig = (() => {
    if (isCancelled) {
      return {
        label: 'Cancelled',
        textColor: '#EF4444',
        bgColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
        borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
        dotColor: '#EF4444',
      };
    }
    if (isCompleted) {
      return {
        label: 'Completed',
        textColor: isDark ? '#A8A8A8' : '#71717A',
        bgColor: isDark ? '#262626' : '#F4F2FD',
        borderColor: borderSubtle,
        dotColor: '#10B981',
      };
    }
    if (isNoShow) {
      return {
        label: 'No-Show',
        textColor: '#F59E0B',
        bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
        borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FCD34D',
        dotColor: '#F59E0B',
      };
    }
    return {
      label: 'Confirmed',
      textColor: isDark ? '#22C55E' : '#10B981',
      bgColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(16, 185, 129, 0.12)',
      borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(16, 185, 129, 0.25)',
      dotColor: '#22C55E',
    };
  })();

  return (
    <View style={{ gap: 12 }}>
      <View
        style={[
          styles.bookingCard,
          {
            backgroundColor: surfaceBg,
            borderColor: borderSubtle,
            opacity: isCancelled ? 0.75 : 1,
          },
        ]}
      >
        {/* Card Top Row: Booking ID & Status Badge */}
        <View style={styles.cardTopRow}>
          <Text style={[styles.bookingRefText, { color: textSecondary }]}>
            Booking ID {bookingRef}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Venue Title */}
        <Text style={[styles.venueTitle, { color: textPrimary }]} numberOfLines={1}>
          {venueName}
        </Text>

        {/* Thumbnail & Reservation Details Box */}
        <View
          style={[styles.cardDetailsBox, { backgroundColor: raisedBg, borderColor: borderSubtle }]}
        >
          <Image
            source={{ uri: FALLBACK_PHOTO }}
            style={styles.venueThumbnail}
            resizeMode="cover"
          />
          <View style={styles.detailsMeta}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={15} color={primaryCoral} />
              <Text style={[styles.dateText, { color: textPrimary }]}>{formattedDate}</Text>
            </View>
            <Text style={[styles.timeServiceText, { color: primaryCoral }]}>
              {displayTime}{' '}
              <Text style={[styles.serviceSubText, { color: textSecondary }]}>
                • {serviceLabel}
              </Text>
            </Text>
            <View style={styles.specsSubRow}>
              <Ionicons name="people" size={13} color={textSecondary} />
              <Text style={[styles.specsSubText, { color: textSecondary }]}>
                {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
              </Text>
              <Text style={[styles.specsSubText, { color: textSecondary }]}>•</Text>
              <Text style={[styles.specsSubText, { color: textSecondary }]} numberOfLines={1}>
                {seatingName}
              </Text>
            </View>
          </View>
        </View>

        {/* Special Requests Tag (if any) */}
        {booking.specialRequests ? (
          <View
            style={[
              styles.specialRequestsNote,
              { backgroundColor: raisedBg, borderColor: borderSubtle },
            ]}
          >
            <Ionicons name="sparkles" size={13} color={primaryCoral} />
            <Text
              style={[styles.specialRequestsNoteText, { color: textSecondary }]}
              numberOfLines={2}
            >
              "{booking.specialRequests}"
            </Text>
          </View>
        ) : null}

        {/* Venue Address & Get Directions Link */}
        <View style={styles.venueAddressRow}>
          <View style={styles.venueAddressLeft}>
            <Ionicons name="location" size={15} color={primaryCoral} />
            <Text style={[styles.venueAddressText, { color: textSecondary }]} numberOfLines={1}>
              {venueAddress}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDirections}
            activeOpacity={0.7}
            style={styles.directionsLink}
          >
            <Text style={[styles.directionsLinkText, { color: primaryCoral }]}>Get Directions</Text>
            <Ionicons name="arrow-forward" size={13} color={primaryCoral} />
          </TouchableOpacity>
        </View>

        {/* Card Action Buttons */}
        <View style={styles.cardActionsGrid}>
          {isUpcoming ? (
            <>
              <TouchableOpacity
                onPress={onModifyPress}
                activeOpacity={0.8}
                style={[styles.modifyBtn, { backgroundColor: raisedBg, borderColor: borderSubtle }]}
              >
                <Ionicons name="calendar-outline" size={15} color={textPrimary} />
                <Text style={[styles.modifyBtnText, { color: textPrimary }]}>Modify</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onCancelPress(booking)}
                disabled={isThisCancelling}
                activeOpacity={0.8}
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                  },
                ]}
              >
                {isThisCancelling ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
                    <Text style={[styles.cancelBtnText, { color: '#EF4444' }]}>Cancel Table</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={onRebookPress}
              activeOpacity={0.85}
              style={[
                styles.rebookBtn,
                {
                  backgroundColor: primaryCoral,
                  shadowColor: primaryCoral,
                },
              ]}
            >
              <Ionicons name="refresh" size={15} color="#FFFFFF" />
              <Text style={styles.rebookBtnText}>Rebook Table</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Hospitality Perk Card for Upcoming Bookings */}
      {isUpcoming && (
        <View
          style={[
            styles.perkCard,
            {
              backgroundColor: surfaceBg,
              borderColor: borderSubtle,
            },
          ]}
        >
          <View
            style={[
              styles.perkIconCircle,
              {
                backgroundColor: isDark ? 'rgba(255, 107, 74, 0.15)' : 'rgba(252, 88, 52, 0.12)',
                borderColor: isDark ? 'rgba(255, 107, 74, 0.3)' : 'rgba(252, 88, 52, 0.25)',
              },
            ]}
          >
            <Ionicons name="wine-outline" size={18} color={primaryCoral} />
          </View>
          <View style={styles.perkMeta}>
            <Text style={[styles.perkTitle, { color: textPrimary }]}>
              Complimentary Welcome Sip
            </Text>
            <Text style={[styles.perkDesc, { color: textSecondary }]}>
              Your table booking includes a signature house aperitivo upon arrival. Free
              cancellation is open until 1 hour before dining.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
