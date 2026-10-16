import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, getReservationStatusStyles } from './managerStyles';

export default function ReservationCard({
  booking,
  colors,
  typography,
  radius,
  shadows,
  onAction,
}) {
  const bookingId = booking.id || booking._id;
  const isPending = booking.status === 'Pending';
  const isConfirmed = booking.status === 'Confirmed';
  const isCompleted = booking.status === 'Completed';
  const isNoShow = booking.status === 'No-Show';
  const isCancelled = booking.status === 'Cancelled' || booking.status === 'Declined';

  const { bg: statusBg, color: statusColor, label: statusLabel } = getReservationStatusStyles(booking.status, colors);

  return (
    <View
      style={[
        styles.cardItem,
        { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
        shadows.soft,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[typography.headingSm, { color: colors.primary, fontSize: 15, fontWeight: '800' }]}>
              {booking.id ? `#BK-${String(booking.id).slice(-4).toUpperCase()}` : '#BK-RES'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[typography.caption, { color: statusColor, fontWeight: '700', fontSize: 11 }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', marginTop: 2 }]}>
            Guest: {booking.customerName}
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
            Phone: {booking.phone || '03XX-XXXXXXX'}
          </Text>
        </View>

        <View style={styles.bookingSlotBadge}>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '800', fontSize: 13 }]}>
            {booking.timeSlot || booking.time}
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 10 }]}>
            {booking.date}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.bookingMetaBox,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="people-outline" size={14} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '600' }]}>
            {booking.partySize} {booking.partySize === 1 ? 'Guest' : 'Guests'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {booking.tableName || 'Atrium Glasshouse Window'}
          </Text>
        </View>
        {booking.branchCity ? (
          <>
            <Text style={[typography.caption, { color: colors.mutedText }]}>•</Text>
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              📍 {booking.branchCity}
            </Text>
          </>
        ) : null}
      </View>

      {booking.specialRequests ? (
        <Text style={[typography.caption, { color: colors.mutedText, fontStyle: 'italic', marginTop: 6, fontSize: 12 }]}>
          Special Note: "{booking.specialRequests}"
        </Text>
      ) : null}

      {/* Accept / Decline actions when Pending */}
      {isPending && (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            onPress={() => onAction(bookingId, 'Confirmed')}
            style={[styles.progressionBtn, { backgroundColor: colors.ready, borderRadius: radius.button }]}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            <Text style={[typography.caption, styles.progressionBtnText]}>Confirm Table</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onAction(bookingId, 'Declined')}
            style={[
              styles.cancelOrderBtn,
              { backgroundColor: colors.cancelledTint, borderColor: colors.cancelled + '40', borderRadius: radius.button },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={14} color={colors.cancelled} />
            <Text style={[typography.caption, { color: colors.cancelled, fontWeight: '700', fontSize: 12 }]}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* When Confirmed: Manager can mark guest as Visited or No-Show */}
      {isConfirmed && (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            onPress={() => onAction(bookingId, 'Completed')}
            style={[styles.progressionBtn, { backgroundColor: '#10B981', borderRadius: radius.button }]}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
            <Text style={[typography.caption, styles.progressionBtnText]}>Mark Visited (Seated)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onAction(bookingId, 'No-Show')}
            style={[
              styles.cancelOrderBtn,
              { backgroundColor: '#F59E0B15', borderColor: '#F59E0B40', borderRadius: radius.button },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
            <Text style={[typography.caption, { color: '#F59E0B', fontWeight: '700', fontSize: 12 }]}>
              Mark No-Show
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Final status notices */}
      {isCompleted && (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="checkmark-done-circle" size={15} color="#10B981" />
          <Text style={[typography.caption, { color: '#10B981', fontWeight: '700', fontSize: 12 }]}>
            Guest Arrived & Dining Completed
          </Text>
        </View>
      )}

      {isNoShow && (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="alert-circle" size={15} color="#F59E0B" />
          <Text style={[typography.caption, { color: '#F59E0B', fontWeight: '700', fontSize: 12 }]}>
            Guest Did Not Arrive (No-Show) • Table Released
          </Text>
        </View>
      )}

      {isCancelled && (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="close-circle" size={15} color={colors.cancelled} />
          <Text style={[typography.caption, { color: colors.cancelled, fontWeight: '700', fontSize: 12 }]}>
            {booking.status === 'Declined' ? 'Reservation Declined by Manager' : 'Cancelled by Guest • Table Released'}
          </Text>
        </View>
      )}
    </View>
  );
}
