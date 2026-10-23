import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useReservation } from '../../hooks/useReservation';
import { useBranch } from '../../context/BranchContext';
import { SegmentedControl, BranchChip } from '../../components/ui';

import { styles, showModalAlert } from './reservationStyles';
import MyBookingsList from './MyBookingsList';
import ConfirmBookingModal from './ConfirmSheet';
import ReservationConfirmedModal from './SuccessSheet';
import Step1WhenGuests from './Step1WhenGuests';
import Step2PickTime from './Step2PickTime';
import Step3YourDetails from './Step3YourDetails';

export default function ReservationScreen() {
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const { colors, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Reservation Hook
  const {
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    partySize,
    setPartySize,
    selectedTable,
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    specialRequests,
    setSpecialRequests,
    reservationsList,
    validationErrors,
    isSlotAvailable,
    validateReservation,
    createReservation,
    cancelReservation,
    isLoading,
    error,
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
  const [bookingStep, setBookingStep] = useState(1); // 1 = When & Guests, 2 = Pick Time, 3 = Details
  const [selectedZone, setSelectedZone] = useState('indoor');
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

  // Handle Confirm Submission
  const handleConfirmBooking = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateReservation()) {
      showModalAlert('Please Check Required Fields', 'Review the highlighted contact details to complete your table reservation.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createReservation({
        branchId: activeBranch?.id,
        branchName: activeBranch?.fullName,
        branchCity: activeBranch?.city,
      });
      setShowConfirmModal(false);
      setConfirmedReservation(res);
    } catch (err) {
      showModalAlert('Reservation Error', err.message || 'Could not complete reservation.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, createReservation, activeBranch, validateReservation]);

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

  const renderBookingStepContent = () => {
    switch (bookingStep) {
      case 1:
        return (
          <Step1WhenGuests
            upcomingDates={upcomingDates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            partySize={partySize}
            setPartySize={setPartySize}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            onNext={() => setBookingStep(2)}
            onViewBookings={() => setActiveTab(1)}
            bookingsCount={displayedBookings.length}
          />
        );
      case 2:
        return (
          <Step2PickTime
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            upcomingDates={upcomingDates}
            partySize={partySize}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            selectedTimeSlot={selectedTimeSlot}
            setSelectedTimeSlot={setSelectedTimeSlot}
            isSlotAvailable={isSlotAvailable}
            onBack={() => setBookingStep(1)}
            onNext={() => setBookingStep(3)}
          />
        );
      case 3:
      default:
        return (
          <Step3YourDetails
            selectedDate={selectedDate}
            upcomingDates={upcomingDates}
            partySize={partySize}
            selectedZone={selectedZone}
            selectedTimeSlot={selectedTimeSlot}
            contactName={contactName}
            setContactName={setContactName}
            contactPhone={contactPhone}
            setContactPhone={setContactPhone}
            specialRequests={specialRequests}
            setSpecialRequests={setSpecialRequests}
            validationErrors={validationErrors}
            isSubmitting={isSubmitting}
            onBack={() => setBookingStep(2)}
            onSubmit={handleConfirmBooking}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ACTIVE TAB CONTENT */}
      {activeTab === 0 ? (
        renderBookingStepContent()
      ) : (
        <>
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
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[typography.headingLg, { color: colors.textPrimary, fontWeight: '800' }]}>
                  Your Table Reservations
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Manage upcoming & past dining experiences
                </Text>
              </View>
              <BranchChip />
            </View>

            <View style={styles.segmentWrapper}>
              <SegmentedControl
                segments={[
                  'New Reservation',
                  `My Bookings (${displayedBookings.length})`,
                ]}
                selectedIndex={activeTab}
                onChange={(idx) => {
                  setActiveTab(idx);
                  if (idx === 0) setBookingStep(1);
                }}
              />
            </View>
          </View>
          <MyBookingsList
            isLoading={isLoading}
            error={error}
            reservationsList={reservationsList}
            displayedBookings={displayedBookings}
            refetchReservations={refetchReservations}
            cancellingBookingId={cancellingBookingId}
            onCancelPress={handleCancelPress}
            onRebookPress={() => {
              setActiveTab(0);
              setBookingStep(1);
            }}
            scrollContentStyle={scrollContentStyle}
          />
        </>
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
          setActiveTab(1);
        }}
        onDone={() => setConfirmedReservation(null)}
      />
    </View>
  );
}
