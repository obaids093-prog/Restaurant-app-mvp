import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Input, PhoneInput, Button } from '../../components/ui';
import { styles } from './reservationStyles';

export default function BookingForm({
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  specialRequests,
  setSpecialRequests,
  validationErrors,
  handleOpenReview,
}) {
  const { colors, typography } = useTheme();

  return (
    <>
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

      <View style={styles.section}>
        <Button
          title="Review & Confirm Booking"
          onPress={handleOpenReview}
          variant="primary"
          size="large"
          icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        />
      </View>
    </>
  );
}
