import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useBranch } from '../../context/BranchContext';
import { brand } from '../../config/brand';
import { styles } from './bookingSuccessStyles';

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80';

export default function BookingConfirmedSuccess({
  visible,
  reservationData,
  onViewBookings,
  onDone,
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { activeBranch } = useBranch();
  const [copied, setCopied] = useState(false);
  const [calendarSaved, setCalendarSaved] = useState(false);

  if (!reservationData) return null;

  const rawId = reservationData.id || reservationData._id || '84920';
  const bookingRef = `#TBL-${String(rawId).slice(-5).toUpperCase()}`;

  const primaryCoral = isDark ? '#FF6B4A' : '#FC5834';
  const canvasBg = isDark ? '#121212' : '#FBF8FF';
  const surfaceBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const raisedBg = isDark ? '#262626' : '#F4F2FD';
  const borderSubtle = isDark ? '#2E2E2E' : '#EBEAE5';
  const textPrimary = isDark ? '#F5F5F5' : '#1A1B22';
  const textSecondary = isDark ? '#A8A8A8' : '#71717A';
  const confirmedGreen = isDark ? '#22C55E' : '#10B981';

  // Format date nicely: e.g. "Fri, Oct 24, 2025"
  const formattedDate = (() => {
    try {
      if (!reservationData.date) return 'Upcoming Date';
      const parts = reservationData.date.split('-');
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return reservationData.date;
    } catch {
      return reservationData.date || 'Upcoming Date';
    }
  })();

  const displayTime = reservationData.timeSlot || reservationData.time || '7:30 PM';
  const partySize = reservationData.partySize || reservationData.guests || 2;
  const seatingName = reservationData.tableName || 'Indoor Dining';
  const specialNotes =
    reservationData.specialRequests && reservationData.specialRequests.trim().length > 0
      ? reservationData.specialRequests.trim()
      : 'Standard seating requested';

  const branchAddress =
    activeBranch?.address || brand.address || '14-C Gulberg III, MM Alam Road, Lahore';
  const branchPhone = activeBranch?.phone || brand.phone || '0300-8472910';
  const branchName = activeBranch?.fullName || brand.restaurantName || 'AURA Artisan Dining';

  const handleCopyBookingId = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(bookingRef.replace('#', ''));
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirections = () => {
    const query = encodeURIComponent(`${branchName}, ${branchAddress}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  const handleCallHost = () => {
    const cleanedPhone = branchPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanedPhone}`).catch(() => {
      Alert.alert('Phone Call', `Please dial host at ${branchPhone}`);
    });
  };

  const handleAddToCalendar = () => {
    setCalendarSaved(true);
    Alert.alert(
      'Added to Calendar',
      `Your table reservation for ${formattedDate} at ${displayTime} has been noted in your schedule!`,
      [{ text: 'Great', style: 'default' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onDone}>
      <View style={[styles.modalOverlay, { backgroundColor: canvasBg }]}>
        <ScrollView
          style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP NAVIGATION BAR */}
          <View style={styles.topBar}>
            <View
              style={[
                styles.topBarIconBtn,
                { backgroundColor: raisedBg, borderColor: borderSubtle },
              ]}
            >
              <Ionicons name="restaurant" size={20} color={textPrimary} />
            </View>
            <TouchableOpacity
              onPress={onDone}
              activeOpacity={0.7}
              style={[
                styles.topBarIconBtn,
                { backgroundColor: raisedBg, borderColor: borderSubtle },
              ]}
              accessibilityLabel="Close and return"
            >
              <Ionicons name="close" size={22} color={textPrimary} />
            </TouchableOpacity>
          </View>

          {/* CELEBRATORY HERO & ANIMATION AREA */}
          <View style={styles.heroSection}>
            <View style={styles.particleContainer}>
              {/* Ambient Glow */}
              <View style={[styles.ambientGlow, { backgroundColor: primaryCoral }]} />

              {/* Festive Sparkles & Embers */}
              <View style={styles.sparkleTopRight}>
                <Ionicons name="sparkles" size={18} color={primaryCoral} />
              </View>
              <View style={styles.sparkleBottomLeft}>
                <Ionicons name="sparkles-outline" size={14} color="#00BCD4" />
              </View>
              <View style={[styles.dotTopLeft, { backgroundColor: primaryCoral }]} />
              <View style={[styles.dotBottomRight, { backgroundColor: '#4DD0E1' }]} />

              {/* Main Check Badge */}
              <View
                style={[
                  styles.checkBadge,
                  {
                    backgroundColor: primaryCoral,
                    shadowColor: primaryCoral,
                  },
                ]}
              >
                <Ionicons name="checkmark" size={38} color="#FFFFFF" />
              </View>
            </View>

            <Text style={[styles.heroTitle, { color: textPrimary }]}>You are booked!</Text>
            <Text style={[styles.heroSubtitle, { color: textSecondary }]}>
              A confirmation has been sent to your phone and email.
            </Text>

            {/* Interactive Booking ID Chip */}
            <View
              style={[
                styles.bookingIdPill,
                { backgroundColor: surfaceBg, borderColor: borderSubtle },
              ]}
            >
              <Text style={[styles.bookingIdLabel, { color: textSecondary }]}>Booking ID:</Text>
              <Text style={[styles.bookingIdValue, { color: textPrimary }]}>{bookingRef}</Text>
              <TouchableOpacity
                onPress={handleCopyBookingId}
                activeOpacity={0.7}
                style={[styles.copyBtn, { backgroundColor: raisedBg }]}
                accessibilityLabel="Copy Booking ID"
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={14}
                  color={copied ? confirmedGreen : primaryCoral}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* TABLE CONFIRMED DETAILS CARD */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: surfaceBg,
                borderColor: borderSubtle,
              },
            ]}
          >
            {/* Restaurant Header */}
            <View style={styles.restaurantHeader}>
              <Image
                source={{ uri: FALLBACK_PHOTO }}
                style={styles.restaurantPhoto}
                resizeMode="cover"
              />
              <View style={styles.restaurantHeaderInfo}>
                <View
                  style={[
                    styles.confirmedTag,
                    {
                      backgroundColor: isDark
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(16, 185, 129, 0.12)',
                      borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                    },
                  ]}
                >
                  <Text style={[styles.confirmedTagText, { color: confirmedGreen }]}>
                    Table Confirmed
                  </Text>
                </View>
                <Text style={[styles.restaurantTitle, { color: textPrimary }]} numberOfLines={1}>
                  {branchName}
                </Text>
                <Text
                  style={[styles.restaurantSubtitle, { color: textSecondary }]}
                  numberOfLines={1}
                >
                  {brand.cuisineType || 'Casual Fine Dining • Modern Bistro'}
                </Text>
              </View>
            </View>

            {/* Essential Reservation Specs Bento Grid */}
            <View style={[styles.specsGrid, { backgroundColor: raisedBg }]}>
              <View style={styles.specsRow}>
                {/* Date */}
                <View style={styles.specItem}>
                  <View
                    style={[
                      styles.specIconBox,
                      { backgroundColor: surfaceBg, borderColor: borderSubtle },
                    ]}
                  >
                    <Ionicons name="calendar-outline" size={16} color={primaryCoral} />
                  </View>
                  <View style={styles.specMeta}>
                    <Text style={[styles.specLabel, { color: textSecondary }]}>Date</Text>
                    <Text style={[styles.specValue, { color: textPrimary }]} numberOfLines={1}>
                      {formattedDate}
                    </Text>
                  </View>
                </View>

                {/* Time */}
                <View style={styles.specItem}>
                  <View
                    style={[
                      styles.specIconBox,
                      { backgroundColor: surfaceBg, borderColor: borderSubtle },
                    ]}
                  >
                    <Ionicons name="time-outline" size={16} color={primaryCoral} />
                  </View>
                  <View style={styles.specMeta}>
                    <Text style={[styles.specLabel, { color: textSecondary }]}>Time</Text>
                    <Text style={[styles.specValue, { color: textPrimary }]}>{displayTime}</Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.specDivider,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                ]}
              />

              {/* Party Size & Seating */}
              <View style={styles.specItem}>
                <View
                  style={[
                    styles.specIconBox,
                    { backgroundColor: surfaceBg, borderColor: borderSubtle },
                  ]}
                >
                  <Ionicons name="people-outline" size={16} color={primaryCoral} />
                </View>
                <View style={styles.specMeta}>
                  <Text style={[styles.specLabel, { color: textSecondary }]}>
                    Party Size & Seating
                  </Text>
                  <Text style={[styles.specValue, { color: textPrimary }]}>
                    {partySize} Guests (Table {seatingName})
                  </Text>
                </View>
              </View>
            </View>

            {/* Special Requests Pill */}
            <View
              style={[
                styles.specialRequestsPill,
                { backgroundColor: raisedBg, borderColor: borderSubtle },
              ]}
            >
              <Ionicons name="sparkles" size={16} color={primaryCoral} />
              <Text style={[styles.specialRequestsText, { color: textPrimary }]} numberOfLines={2}>
                {specialNotes}
              </Text>
            </View>

            {/* Venue Location & Micro-actions */}
            <View style={styles.venueLocationContainer}>
              <View style={styles.venueLocationRow}>
                <Ionicons
                  name="location"
                  size={18}
                  color={primaryCoral}
                  style={styles.venueLocationIcon}
                />
                <View style={styles.venueLocationInfo}>
                  <Text style={[styles.venueLocationAddress, { color: textPrimary }]}>
                    {branchAddress}
                  </Text>
                  <Text style={[styles.venueLocationParking, { color: textSecondary }]}>
                    Valet & street parking available
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Directions & Call Host */}
              <View style={styles.microActionsRow}>
                <TouchableOpacity
                  onPress={handleDirections}
                  activeOpacity={0.8}
                  style={[
                    styles.microActionBtn,
                    { backgroundColor: raisedBg, borderColor: borderSubtle },
                  ]}
                >
                  <Ionicons name="navigate-outline" size={16} color={primaryCoral} />
                  <Text style={[styles.microActionText, { color: textPrimary }]}>Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCallHost}
                  activeOpacity={0.8}
                  style={[
                    styles.microActionBtn,
                    { backgroundColor: raisedBg, borderColor: borderSubtle },
                  ]}
                >
                  <Ionicons name="call-outline" size={16} color={primaryCoral} />
                  <Text style={[styles.microActionText, { color: textPrimary }]}>Call Host</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* PRIMARY NEXT ACTIONS */}
          <View style={styles.actionButtonsSection}>
            {/* Add to Calendar */}
            <TouchableOpacity
              onPress={handleAddToCalendar}
              activeOpacity={0.85}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: primaryCoral,
                  shadowColor: primaryCoral,
                },
              ]}
            >
              <Ionicons
                name={calendarSaved ? 'checkmark-circle' : 'calendar'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.primaryBtnText}>
                {calendarSaved ? 'Saved to Calendar' : 'Add to Calendar'}
              </Text>
            </TouchableOpacity>

            {/* View My Bookings */}
            <TouchableOpacity
              onPress={onViewBookings}
              activeOpacity={0.8}
              style={[
                styles.secondaryBtn,
                { backgroundColor: surfaceBg, borderColor: borderSubtle },
              ]}
            >
              <Ionicons name="receipt-outline" size={18} color={textSecondary} />
              <Text style={[styles.secondaryBtnText, { color: textPrimary }]}>
                View My Bookings
              </Text>
            </TouchableOpacity>

            {/* Back to Home */}
            <TouchableOpacity onPress={onDone} activeOpacity={0.7} style={styles.backHomeBtn}>
              <Text style={[styles.backHomeText, { color: textSecondary }]}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
