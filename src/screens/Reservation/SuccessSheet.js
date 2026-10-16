import React from 'react';
import { View, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBranch } from '../../context/BranchContext';
import { Button } from '../../components/ui';
import { styles } from './reservationStyles';

export default function ReservationConfirmedModal({
  visible,
  reservationData,
  onViewBookings,
  onDone,
}) {
  const { colors, typography, radius, shadows } = useTheme();
  const { activeBranch } = useBranch();
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
              Confirmed for {reservationData.customerName || 'Valued Guest'} at {activeBranch?.fullName || 'AURA'}
            </Text>
          </View>

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

          <View style={[styles.policyBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.button }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.secondary} />
            <Text style={[typography.caption, { color: colors.textSecondary, flex: 1, marginLeft: 8, fontSize: 12, lineHeight: 18 }]}>
              Your table will be held for <Text style={{ fontWeight: '700', color: colors.textPrimary }}>15 minutes</Text> past scheduled time. For dietary modifications, our Maître d' is ready to assist.
            </Text>
          </View>

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
