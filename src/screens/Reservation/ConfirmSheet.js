import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { normalizePkPhone } from '../../utils/phone';
import { styles } from './reservationStyles';

export default function ConfirmBookingModal({
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
