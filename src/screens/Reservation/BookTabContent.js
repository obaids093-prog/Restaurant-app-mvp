import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import DateRow from './DateRow';
import PartyStepper from './PartyStepper';
import ZonePicker from './ZonePicker';
import SlotGrid from './SlotGrid';
import BookingForm from './BookingForm';
import { styles } from './reservationStyles';

export default function BookTabContent({
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
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  handleOpenReview,
  scrollContentStyle,
  onBack,
}) {
  const { colors, typography, radius } = useTheme();

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

  return (
    <ScrollView
      contentContainerStyle={scrollContentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 6 }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[typography.button, { color: colors.primary }]}>Back to Step 1 (When & Guests)</Text>
        </TouchableOpacity>
      )}

      <DateRow
        upcomingDates={upcomingDates}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        validationError={validationErrors.date}
      />

      <PartyStepper
        partySize={partySize}
        setPartySize={setPartySize}
        validationError={validationErrors.partySize}
      />

      <ZonePicker
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
      />

      <SlotGrid
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        setSelectedTimeSlot={setSelectedTimeSlot}
        isSlotAvailable={isSlotAvailable}
        validationError={validationErrors.timeSlot}
      />

      <BookingForm
        contactName={contactName}
        setContactName={setContactName}
        contactPhone={contactPhone}
        setContactPhone={setContactPhone}
        specialRequests={specialRequests}
        setSpecialRequests={setSpecialRequests}
        validationErrors={validationErrors}
        handleOpenReview={handleOpenReview}
      />
    </ScrollView>
  );
}
