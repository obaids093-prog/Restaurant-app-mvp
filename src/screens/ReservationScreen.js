import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useReservation, TIME_SLOTS } from '../hooks/useReservation';

/**
 * Task 7: ReservationScreen
 * Contains NO business logic — purely presentation UI interacting through useReservation hook.
 */
export default function ReservationScreen() {
  const { user } = useAuth();
  const { colors, isDark, shadows } = useTheme();

  // Use the reservation hook
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
    availableTablesCount,
    isSlotAvailable,
    validateReservation,
    createReservation,
    cancelReservation,
  } = useReservation(user);

  // Local UI-only state: Confirmation Modal visibility & active tab
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'history'
  const [selectedZone, setSelectedZone] = useState('glasshouse');

  // Upcoming 7 Days Ribbon
  const upcomingDates = useMemo(() => {
    const dates = [];
    const baseDate = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const statuses = ['Prime', '3 tables', 'Limited', '5 tables', 'Prime', 'Dark', 'Prime'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      dates.push({
        iso,
        dayName: days[d.getDay()],
        dayNum: d.getDate(),
        status: statuses[i % statuses.length],
      });
    }
    return dates;
  }, []);

  const SANCTUARY_ZONES = [
    {
      id: 'glasshouse',
      name: 'Botanical Glasshouse',
      desc: 'Surrounded by cascading rare orchids, humid misting intervals, and gentle glass canopy acoustics.',
      badge: 'Best Seller',
      capacity: '2-4 Guests',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
    },
    {
      id: 'courtyard',
      name: 'Olive Tree Courtyard',
      desc: 'Open-air sheltered garden under ancient olive trees, ambient bronze fire lanterns and twilight breeze.',
      badge: 'Al Fresco',
      capacity: '2-6 Guests',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
    },
    {
      id: 'counter',
      name: 'Sommelier Hearth Counter',
      desc: 'Front-row vantage point facing our Bincho-tan oak hearth grill with bespoke sommelier pairings.',
      badge: 'Chef Experience',
      capacity: '1-2 Guests',
      image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=500&auto=format&fit=crop&q=80',
    },
  ];

  // Platform-safe alert helper (Alert.alert button callbacks don't work on react-native-web)
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // User presses "Review Booking"
  const handleOpenReview = () => {
    if (validateReservation()) {
      setShowConfirmModal(true);
    } else {
      showAlert('Validation Error', 'Please check the highlighted fields below.');
    }
  };

  // Final confirm in modal
  const handleConfirmBooking = async () => {
    try {
      const res = await createReservation();
      setShowConfirmModal(false);
      showAlert(
        'Reservation Confirmed!',
        `Your table has been reserved under booking ID: ${res.id || res._id}. A confirmation notification has been dispatched to ${res.phone || contactPhone}.`
      );
      setActiveTab('history');
    } catch (err) {
      showAlert('Booking Error', err.message || 'Could not complete reservation.');
    }
  };

  // Cancel reservation — Platform-safe confirmation
  const handleCancelPress = async (booking) => {
    const bookingId = booking.id || booking._id;
    const msg = `Are you sure you wish to cancel reservation ${bookingId} for ${booking.partySize} guests at ${booking.timeSlot}?`;

    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      // Wrap Alert.alert in a promise so we can await it on native
      const confirmed = await new Promise((resolve) => {
        Alert.alert('Cancel Table Reservation', msg, [
          { text: 'Keep Booking', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Yes, Cancel', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) return;
    }

    try {
      await cancelReservation(bookingId);
      showAlert('Cancelled', 'Your reservation has been cancelled.');
    } catch (err) {
      showAlert('Cancel Error', err.message || 'Could not cancel reservation.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Mode Switcher: Book a Table vs My Reservations */}
      <View
        style={[
          styles.tabSwitcher,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('book')}
          style={[
            styles.tabItem,
            activeTab === 'book' && [
              styles.activeTabItem,
              { backgroundColor: colors.surface },
              shadows.soft,
            ],
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={activeTab === 'book' ? colors.primary : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'book' ? colors.primary : colors.textMuted },
            ]}
          >
            Reserve Table
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          style={[
            styles.tabItem,
            activeTab === 'history' && [
              styles.activeTabItem,
              { backgroundColor: colors.surface },
              shadows.soft,
            ],
          ]}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={activeTab === 'history' ? colors.primary : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'history' ? colors.primary : colors.textMuted },
            ]}
          >
            My Bookings ({reservationsList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'book' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sanctuary Booking Intro Header (from Stitch AI) */}
          <View style={styles.sanctuaryHeader}>
            <View style={styles.sanctuaryTagRow}>
              <Ionicons name="sparkles" size={14} color="#ffc174" />
              <Text style={styles.sanctuaryTagText}>SANCTUARY BOOKING</Text>
            </View>
            <Text style={styles.sanctuaryTitle}>Reserve Your Experience</Text>
            <Text style={styles.sanctuarySubtitle}>
              Intimate dining under the botanical glasshouse and starlit courtyard.
            </Text>
          </View>

          {/* DATE SELECTION CAROUSEL RIBBON (from Stitch AI) */}
          <View style={styles.dateRibbonSection}>
            <View style={styles.dateRibbonHeader}>
              <View style={styles.dateMonthRow}>
                <Text style={styles.dateMonthText}>SELECT DINING DATE</Text>
                <View style={styles.greenPulseDot} />
              </View>
              <Text style={styles.calendarHintText}>Next 7 Days Available</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateRibbonScroll}
            >
              {upcomingDates.map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <TouchableOpacity
                    key={d.iso}
                    onPress={() => setSelectedDate(d.iso)}
                    style={[
                      styles.dateChip,
                      isSelected && styles.dateChipActive,
                      isSelected && (shadows.goldGlow || shadows.button3D),
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dateChipDay,
                        isSelected && styles.dateChipDayActive,
                      ]}
                    >
                      {d.dayName}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipNum,
                        isSelected && styles.dateChipNumActive,
                      ]}
                    >
                      {d.dayNum}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipStatus,
                        isSelected && styles.dateChipStatusActive,
                      ]}
                    >
                      {d.status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {validationErrors.date && (
              <Text style={[styles.errorMsg, { color: colors.error }]}>
                {validationErrors.date}
              </Text>
            )}
          </View>

          {/* PARTY SIZE STEPPER (from Stitch AI) */}
          <View style={[styles.partyStepperCard, shadows.soft]}>
            <View style={styles.partyStepperLeft}>
              <View style={styles.partyIconCircle}>
                <Ionicons name="people" size={20} color="#ffc174" />
              </View>
              <View>
                <Text style={styles.partyStepperLabel}>PARTY SIZE</Text>
                <Text style={styles.partyStepperCount}>
                  {partySize} {partySize === 1 ? 'Discerning Guest' : 'Discerning Guests'}
                </Text>
              </View>
            </View>

            <View style={styles.partyStepperControls}>
              <TouchableOpacity
                onPress={() => setPartySize((p) => Math.max(1, p - 1))}
                style={styles.partyStepBtn}
                disabled={partySize <= 1}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={partySize <= 1 ? '#a08e7a' : '#dfe2ee'}
                />
              </TouchableOpacity>
              <Text style={styles.partyStepNum}>{partySize}</Text>
              <TouchableOpacity
                onPress={() => setPartySize((p) => Math.min(12, p + 1))}
                style={styles.partyStepBtn}
                disabled={partySize >= 12}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={partySize >= 12 ? '#a08e7a' : '#dfe2ee'}
                />
              </TouchableOpacity>
            </View>
          </View>
          {validationErrors.partySize && (
            <Text style={[styles.errorMsg, { color: colors.error, marginLeft: 4 }]}>
              {validationErrors.partySize}
            </Text>
          )}

          {/* DINING TIME SLOTS (Twilight Dinner vs Late Botanica) */}
          <View style={styles.timeSlotsSection}>
            <View style={styles.timeSlotsHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={16} color="#ffc174" />
                <Text style={styles.timeSlotsTitle}>SELECT SEATING SLOT</Text>
              </View>
              <Text style={styles.timeSlotActiveBadge}>
                {selectedTimeSlot} Service
              </Text>
            </View>

            {/* Group 1: Twilight Dinner */}
            <View style={styles.slotGroupWrapper}>
              <View style={styles.slotGroupHeader}>
                <Text style={styles.slotGroupName}>Twilight Dinner</Text>
                <Text style={styles.slotGroupSub}>• Golden hour candlelit cycle</Text>
              </View>
              <View style={styles.slotsGrid}>
                {['17:00', '18:00', '19:00', '20:00'].map((slot) => {
                  const isAvailable = isSlotAvailable(slot);
                  const isSelected = selectedTimeSlot === slot;
                  const tags = {
                    '17:00': 'Sunset',
                    '18:00': 'Aura',
                    '19:00': 'Prime',
                    '20:00': 'Bloom',
                  };

                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setSelectedTimeSlot(slot)}
                      disabled={!isAvailable}
                      style={[
                        styles.slotCard,
                        isSelected && styles.slotCardActive,
                        !isAvailable && styles.slotCardDisabled,
                        isSelected && (shadows.goldGlow || shadows.button3D),
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.slotTimeText,
                          isSelected && styles.slotTimeTextActive,
                          !isAvailable && styles.slotTimeTextDisabled,
                        ]}
                      >
                        {slot}
                      </Text>
                      <Text
                        style={[
                          styles.slotTagText,
                          isSelected && styles.slotTagTextActive,
                        ]}
                      >
                        {isAvailable ? tags[slot] : 'Full'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Group 2: Late Botanica */}
            <View style={[styles.slotGroupWrapper, { marginTop: 12 }]}>
              <View style={styles.slotGroupHeader}>
                <Text style={styles.slotGroupName}>Late Botanica</Text>
                <Text style={styles.slotGroupSub}>• Dim lights & acoustic jazz</Text>
              </View>
              <View style={styles.slotsGrid}>
                {['21:00', '22:00'].map((slot) => {
                  const isAvailable = isSlotAvailable(slot);
                  const isSelected = selectedTimeSlot === slot;
                  const tags = {
                    '21:00': 'Sommelier',
                    '22:00': 'Digestif',
                  };

                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setSelectedTimeSlot(slot)}
                      disabled={!isAvailable}
                      style={[
                        styles.slotCard,
                        isSelected && styles.slotCardActive,
                        !isAvailable && styles.slotCardDisabled,
                        isSelected && (shadows.goldGlow || shadows.button3D),
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.slotTimeText,
                          isSelected && styles.slotTimeTextActive,
                          !isAvailable && styles.slotTimeTextDisabled,
                        ]}
                      >
                        {slot}
                      </Text>
                      <Text
                        style={[
                          styles.slotTagText,
                          isSelected && styles.slotTagTextActive,
                        ]}
                      >
                        {isAvailable ? tags[slot] : 'Closed'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {validationErrors.timeSlot && (
              <Text style={[styles.errorMsg, { color: colors.error }]}>
                {validationErrors.timeSlot}
              </Text>
            )}
          </View>

          {/* INTERACTIVE SANCTUARY ZONES (from Stitch AI) */}
          <View style={styles.zonesSection}>
            <View style={styles.zonesHeader}>
              <View>
                <Text style={styles.zonesTitle}>SANCTUARY ZONE</Text>
                <Text style={styles.zonesSub}>Atmospheric seating arrangement</Text>
              </View>
              <View style={styles.zonesCountBadge}>
                <Text style={styles.zonesCountBadgeText}>3 SPACES</Text>
              </View>
            </View>

            <View style={styles.zonesList}>
              {SANCTUARY_ZONES.map((zone) => {
                const isSelected = selectedZone === zone.id;
                return (
                  <TouchableOpacity
                    key={zone.id}
                    onPress={() => {
                      setSelectedZone(zone.id);
                      if (!specialRequests.includes(zone.name)) {
                        setSpecialRequests(`Seating preference: ${zone.name}`);
                      }
                    }}
                    style={[
                      styles.zoneCard,
                      isSelected && styles.zoneCardActive,
                      shadows.soft,
                    ]}
                    activeOpacity={0.88}
                  >
                    <View style={styles.zoneThumbWrapper}>
                      <Image
                        source={{ uri: zone.image }}
                        style={styles.zoneThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.zoneBadgeTop}>
                        <Text style={styles.zoneBadgeTopText}>{zone.badge}</Text>
                      </View>
                    </View>

                    <View style={styles.zoneInfo}>
                      <View style={styles.zoneTitleRow}>
                        <Text
                          style={[
                            styles.zoneTitle,
                            isSelected && { color: '#ffc174' },
                          ]}
                          numberOfLines={1}
                        >
                          {zone.name}
                        </Text>
                        <View
                          style={[
                            styles.zoneRadio,
                            isSelected && styles.zoneRadioActive,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={13} color="#472a00" />
                          )}
                        </View>
                      </View>
                      <Text style={styles.zoneDesc} numberOfLines={2}>
                        {zone.desc}
                      </Text>
                      <View style={styles.zoneCapacityRow}>
                        <Ionicons name="people-outline" size={12} color="#4edea3" />
                        <Text style={styles.zoneCapacityText}>{zone.capacity}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ASSIGNED TABLE STATUS PREVIEW */}
          <View
            style={[
              styles.tableAssignCard,
              {
                backgroundColor: selectedTable
                  ? 'rgba(78, 222, 163, 0.08)'
                  : 'rgba(255, 180, 171, 0.12)',
                borderColor: selectedTable ? '#4edea3' : '#ffb4ab',
              },
            ]}
          >
            <Ionicons
              name={selectedTable ? 'restaurant' : 'alert-circle'}
              size={22}
              color={selectedTable ? '#4edea3' : '#ffb4ab'}
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={[
                  styles.tableAssignTitle,
                  { color: selectedTable ? '#4edea3' : '#ffb4ab' },
                ]}
              >
                {selectedTable
                  ? `Assigned: ${selectedTable.tableNumber} • Capacity: ${selectedTable.seats} Seats`
                  : 'No Table Available'}
              </Text>
              <Text style={styles.tableAssignSub}>
                {selectedTable
                  ? `Location: ${selectedTable.location} (${availableTablesCount} table(s) free)`
                  : 'Please choose a different hour or adjust party size.'}
              </Text>
            </View>
          </View>
          {validationErrors.table && (
            <Text style={[styles.errorMsg, { color: colors.error }]}>
              {validationErrors.table}
            </Text>
          )}

          {/* GUEST CONTACT CARD */}
          <View
            style={[
              styles.card,
              { backgroundColor: '#1c2028', borderColor: 'rgba(255, 193, 116, 0.1)' },
              shadows.soft,
            ]}
          >
            <Text style={styles.sectionHeading}>GUEST VERIFICATION CONTACT</Text>

            {/* FULL NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View
                style={[
                  styles.inputWrapper,
                  validationErrors.name && styles.inputWrapperError,
                ]}
              >
                <Ionicons name="person-outline" size={18} color="#ffc174" />
                <TextInput
                  style={styles.textInput}
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="e.g. Zainab Malik"
                  placeholderTextColor="#a08e7a"
                />
              </View>
              {validationErrors.name && (
                <Text style={[styles.errorMsg, { color: colors.error }]}>
                  {validationErrors.name}
                </Text>
              )}
            </View>

            {/* PAKISTANI PHONE */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>MOBILE NUMBER (03XX-XXXXXXX)</Text>
              <View
                style={[
                  styles.inputWrapper,
                  validationErrors.phone && styles.inputWrapperError,
                ]}
              >
                <Ionicons name="call-outline" size={18} color="#ffc174" />
                <TextInput
                  style={styles.textInput}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="0302-8877665"
                  placeholderTextColor="#a08e7a"
                  keyboardType="phone-pad"
                />
              </View>
              {validationErrors.phone && (
                <Text style={[styles.errorMsg, { color: colors.error }]}>
                  {validationErrors.phone}
                </Text>
              )}
            </View>

            {/* SPECIAL REQUESTS */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>SPECIAL OCCASION / DIETARY NOTES (OPTIONAL)</Text>
              <View style={styles.textAreaWrapper}>
                <TextInput
                  style={styles.textArea}
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  placeholder="e.g. Anniversary celebration, botanical pairing, gluten free..."
                  placeholderTextColor="#a08e7a"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* REVIEW RESERVATION BUTTON */}
            <TouchableOpacity
              onPress={handleOpenReview}
              style={[styles.reviewBtn, shadows.goldGlow || shadows.button3D]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#f59e0b', '#ffc174']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.reviewGradient}
              >
                <Text style={styles.reviewBtnText}>Review Sanctuary Booking</Text>
                <Ionicons name="arrow-forward" size={18} color="#472a00" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* MY RESERVATIONS HISTORY TAB */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {reservationsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Reservations Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                You have no active or previous dining table bookings.
              </Text>
            </View>
          ) : (
            reservationsList.map((booking) => {
              const isCancelled = booking.status === 'Cancelled' || booking.status === 'Declined';

              return (
                <View
                  key={booking.id}
                  style={[
                    styles.bookingCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      opacity: isCancelled ? 0.6 : 1,
                    },
                    shadows.soft,
                  ]}
                >
                  <View style={styles.bookingHeader}>
                    <View>
                      <Text style={[styles.bookingId, { color: colors.primary }]}>
                        {booking.id}
                      </Text>
                      <Text style={[styles.bookingGuest, { color: colors.textPrimary }]}>
                        {booking.customerName}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isCancelled
                            ? colors.errorBackground
                            : colors.successBackground,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: isCancelled ? colors.error : colors.success },
                        ]}
                      >
                        {booking.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={14} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {booking.date}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={14} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {booking.timeSlot}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="people" size={14} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {booking.partySize} Guests
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingTableRow}>
                    <Ionicons name="location" size={14} color={colors.primary} />
                    <Text style={[styles.bookingTableText, { color: colors.textPrimary }]}>
                      {booking.tableName}
                    </Text>
                  </View>

                  {booking.specialRequests ? (
                    <Text style={[styles.specialNoteText, { color: colors.textMuted }]}>
                      Request: "{booking.specialRequests}"
                    </Text>
                  ) : null}

                  {!isCancelled && (
                    <TouchableOpacity
                      onPress={() => handleCancelPress(booking)}
                      style={[
                        styles.cancelBtn,
                        { backgroundColor: colors.surfaceSubtle, borderColor: colors.error + '40' },
                      ]}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                      <Text style={[styles.cancelBtnText, { color: colors.error }]}>
                        Cancel Reservation
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* CONFIRMATION MODAL (Task 7 Specs) */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              shadows.deep3D,
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={[styles.modalIconCircle, { backgroundColor: colors.primary + '18' }]}
              >
                <Ionicons name="calendar-sharp" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Confirm Reservation
              </Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Please verify your dining itinerary before finalizing.
              </Text>
            </View>

            <View style={[styles.modalDetailsBox, { backgroundColor: colors.surfaceSubtle }]}>
              <View style={styles.modalRow}>
                <Text style={[styles.modalRowLabel, { color: colors.textMuted }]}>Date & Time:</Text>
                <Text style={[styles.modalRowVal, { color: colors.textPrimary }]}>
                  {selectedDate} at {selectedTimeSlot}
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={[styles.modalRowLabel, { color: colors.textMuted }]}>Party Size:</Text>
                <Text style={[styles.modalRowVal, { color: colors.textPrimary }]}>
                  {partySize} Guests
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={[styles.modalRowLabel, { color: colors.textMuted }]}>Seating:</Text>
                <Text style={[styles.modalRowVal, { color: colors.textPrimary }]}>
                  {selectedTable?.tableNumber} ({selectedTable?.location})
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={[styles.modalRowLabel, { color: colors.textMuted }]}>Guest Name:</Text>
                <Text style={[styles.modalRowVal, { color: colors.textPrimary }]}>
                  {contactName}
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={[styles.modalRowLabel, { color: colors.textMuted }]}>SMS Confirmation:</Text>
                <Text style={[styles.modalRowVal, { color: colors.textPrimary }]}>
                  {contactPhone}
                </Text>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                  Edit Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmBooking}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalSubmitText}>Confirm & Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  tabSwitcher: {
    flexDirection: 'row',
    maxWidth: 580,
    width: '92%',
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginVertical: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTabItem: {},
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Sanctuary Header
  sanctuaryHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sanctuaryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sanctuaryTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffc174',
    letterSpacing: 1.5,
  },
  sanctuaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dfe2ee',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sanctuarySubtitle: {
    fontSize: 12,
    color: '#d8c3ad',
    marginTop: 4,
    lineHeight: 16,
  },

  // Date Ribbon Section
  dateRibbonSection: {
    marginBottom: 16,
  },
  dateRibbonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  dateMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateMonthText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d8c3ad',
    letterSpacing: 1,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4edea3',
  },
  calendarHintText: {
    fontSize: 11,
    color: '#ffc174',
    fontWeight: '600',
  },
  dateRibbonScroll: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dateChip: {
    width: 62,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1c2028',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262a33',
  },
  dateChipActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#ffc174',
  },
  dateChipDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d8c3ad',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dateChipDayActive: {
    color: '#472a00',
  },
  dateChipNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#dfe2ee',
    marginVertical: 2,
  },
  dateChipNumActive: {
    color: '#472a00',
  },
  dateChipStatus: {
    fontSize: 9,
    color: '#4edea3',
    fontWeight: '700',
  },
  dateChipStatusActive: {
    color: '#472a00',
  },

  // Party Size Stepper
  partyStepperCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181c24',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.08)',
  },
  partyStepperLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#262a33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyStepperLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a08e7a',
    letterSpacing: 1,
  },
  partyStepperCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dfe2ee',
    marginTop: 2,
  },
  partyStepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262a33',
    borderRadius: 999,
    padding: 4,
    gap: 8,
  },
  partyStepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1c2028',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyStepNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffc174',
    minWidth: 20,
    textAlign: 'center',
  },

  // Time Slots Section
  timeSlotsSection: {
    marginBottom: 18,
  },
  timeSlotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  timeSlotsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d8c3ad',
    letterSpacing: 1,
  },
  timeSlotActiveBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4edea3',
  },
  slotGroupWrapper: {
    backgroundColor: '#1c2028',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262a33',
  },
  slotGroupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  slotGroupName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dfe2ee',
    letterSpacing: 0.5,
  },
  slotGroupSub: {
    fontSize: 10,
    color: '#a08e7a',
  },
  slotCard: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#181c24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262a33',
  },
  slotCardActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#ffc174',
  },
  slotCardDisabled: {
    opacity: 0.35,
  },
  slotTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dfe2ee',
  },
  slotTimeTextActive: {
    color: '#472a00',
  },
  slotTimeTextDisabled: {
    color: '#a08e7a',
  },
  slotTagText: {
    fontSize: 9,
    color: '#d8c3ad',
    marginTop: 2,
    fontWeight: '600',
  },
  slotTagTextActive: {
    color: '#472a00',
    fontWeight: '800',
  },

  // Interactive Sanctuary Zones
  zonesSection: {
    marginBottom: 18,
  },
  zonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  zonesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d8c3ad',
    letterSpacing: 1,
  },
  zonesSub: {
    fontSize: 11,
    color: '#a08e7a',
    marginTop: 1,
  },
  zonesCountBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  zonesCountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffc174',
    letterSpacing: 1,
  },
  zonesList: {
    gap: 10,
  },
  zoneCard: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#1c2028',
    padding: 12,
    borderWidth: 1,
    borderColor: '#262a33',
    gap: 12,
  },
  zoneCardActive: {
    borderColor: '#ffc174',
    backgroundColor: '#262a33',
  },
  zoneThumbWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a0e16',
  },
  zoneThumb: {
    width: '100%',
    height: '100%',
  },
  zoneBadgeTop: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 19, 28, 0.85)',
  },
  zoneBadgeTopText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffc174',
    textTransform: 'uppercase',
  },
  zoneInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  zoneTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dfe2ee',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
  },
  zoneRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#a08e7a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  zoneRadioActive: {
    backgroundColor: '#ffc174',
    borderColor: '#ffc174',
  },
  zoneDesc: {
    fontSize: 11,
    color: '#d8c3ad',
    lineHeight: 15,
    marginVertical: 4,
  },
  zoneCapacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneCapacityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4edea3',
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d8c3ad',
    letterSpacing: 1,
    marginBottom: 14,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d8c3ad',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31353e',
    backgroundColor: '#0a0e16',
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperError: {
    borderColor: '#ffb4ab',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#dfe2ee',
    marginLeft: 8,
  },
  textAreaWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31353e',
    backgroundColor: '#0a0e16',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textArea: {
    fontSize: 13,
    color: '#dfe2ee',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorMsg: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 4,
  },
  labelWithCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  counterNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 8,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisplay: {
    fontSize: 18,
    fontWeight: '800',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableAssignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  tableAssignTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  tableAssignSub: {
    fontSize: 11,
    color: '#d8c3ad',
    marginTop: 2,
  },
  reviewBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  reviewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  reviewBtnText: {
    color: '#472a00',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingId: {
    fontSize: 12,
    fontWeight: '800',
  },
  bookingGuest: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bookingMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  bookingTableText: {
    fontSize: 13,
    fontWeight: '700',
  },
  specialNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  modalDetailsBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    gap: 8,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalRowLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalRowVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
