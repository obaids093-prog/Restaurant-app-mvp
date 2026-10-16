import { StyleSheet, Platform, Alert } from 'react-native';

// ─── DINING SERVICE SLOTS ───────────────────────────────────────────────────
export const DINING_SLOT_GROUPS = [
  {
    title: 'Lunch & Afternoon Tea',
    timeRange: '12:00 – 16:00',
    sub: 'Fresh daylight dining & midday bites',
    icon: 'sunny-outline',
    slots: ['12:00', '13:00', '14:00', '15:00', '16:00'],
  },
  {
    title: 'Dinner Service',
    timeRange: '17:00 – 20:00',
    sub: 'Golden hour candlelit service',
    icon: 'restaurant-outline',
    slots: ['17:00', '18:00', '19:00', '20:00'],
  },
  {
    title: 'Late Night Dining',
    timeRange: '21:00 – 22:00',
    sub: 'Ambient music & late culinary creations',
    icon: 'moon-outline',
    slots: ['21:00', '22:00'],
  },
];

// ─── SANCTUARY ZONES ────────────────────────────────────────────────────────
export const SANCTUARY_ZONES = [
  {
    id: 'glasshouse',
    tag: 'A-01 • Glasshouse',
    name: 'Atrium Glasshouse Window',
    desc: 'High ceiling natural light, romantic & serene',
    capacity: '2–4 Guests',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'courtyard',
    tag: 'B-02 • Courtyard',
    name: 'Botanica Garden Terrace',
    desc: 'Open air courtyard botanical fountain breeze',
    capacity: '2–6 Guests',
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'counter',
    tag: 'C-03 • Front Row',
    name: "Chef's Counter Booth",
    desc: 'Interactive kitchen view, bespoke tasting craft',
    capacity: '1–2 Guests',
    image:
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format&fit=crop&q=80',
  },
];

// Cross-platform alert helper
export const showModalAlert = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Date Chip badge background helper
export const getDateChipBadgeBg = (isSelected, isDark, colors) => {
  if (isSelected) {
    return 'rgba(255, 255, 255, 0.25)';
  }
  return isDark ? colors.surface : colors.cardBorder;
};

// Slot chip styling helper
export const getSlotChipStyles = (isSelected, isDisabled, isDark, colors) => {
  if (isSelected) {
    return {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: colors.onPrimary,
    };
  }
  if (isDisabled) {
    return {
      backgroundColor: isDark ? '#1a1a1a' : '#ececec',
      borderColor: 'transparent',
      textColor: colors.mutedText,
    };
  }
  return {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    textColor: colors.textPrimary,
  };
};

export const getEmptyStateTitle = (activeFilter) => {
  if (activeFilter === 'upcoming') return 'No Upcoming Reservations';
  if (activeFilter === 'past') return 'No Past Reservations';
  if (activeFilter === 'cancelled') return 'No Cancelled Bookings';
  return 'No Reservations Found';
};

export const getZonePhoto = (tableName) => {
  const name = String(tableName || '').toLowerCase();
  if (name.includes('courtyard') || name.includes('terrace')) {
    return SANCTUARY_ZONES[1].image;
  }
  if (name.includes('counter')) {
    return SANCTUARY_ZONES[2].image;
  }
  return SANCTUARY_ZONES[0].image;
};

export const getBookingStatusStyles = (booking, isCompleted, isNoShow, isConfirmed, isCancelled, colors) => {
  if (isCompleted) {
    return { bg: '#10B981', label: 'Visited' };
  }
  if (isNoShow) {
    return { bg: '#F59E0B', label: 'No-Show' };
  }
  if (isConfirmed) {
    return { bg: colors.ready, label: booking.status || 'Confirmed' };
  }
  if (isCancelled) {
    return { bg: colors.cancelled, label: booking.status || 'Cancelled' };
  }
  return { bg: colors.pending, label: booking.status || 'Pending' };
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  segmentWrapper: {
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    padding: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLabel: {
    letterSpacing: 1,
    fontWeight: '700',
    fontSize: 11,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Date Ribbon
  dateScrollContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  dateChip: {
    width: 66,
    height: 82,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  dateChipDay: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  dateChipNum: {
    fontSize: 20,
    lineHeight: 24,
  },
  dateChipBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dateChipStatus: {
    fontSize: 8,
    fontWeight: '700',
  },

  // Party Size
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  guestPillsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  guestPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },

  // Sanctuary Zones
  zonesStack: {
    gap: 10,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1.5,
  },
  zoneImage: {
    width: 54,
    height: 54,
  },
  zoneContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  zoneTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  // Slots
  slotGroupCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  slotGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexBasis: '18%',
    flexGrow: 1,
    minWidth: 54,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  slotChipText: {
    fontSize: 12,
  },
  slotStatusSub: {
    fontSize: 8,
    marginTop: 1,
    fontWeight: '600',
  },

  // Common UI & States
  inlineError: {
    fontSize: 11,
    marginTop: 6,
    marginLeft: 2,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },

  // History Tab Cards
  bookingCard: {
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  bookingBanner: {
    width: '100%',
    height: 94,
    position: 'relative',
    overflow: 'hidden',
  },
  bookingBannerImage: {
    width: '100%',
    height: '100%',
  },
  bookingBannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  bookingBannerOverlay: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bookingDetails: {
    padding: 12,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  bookingNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
  },
  bookingActionsRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    paddingTop: 10,
  },
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
  },
  cancelledNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },

  // Confirm Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 12,
  },
  modalContent: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDetailsBox: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  modalPrimaryBtn: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  // Confirmed Modal
  confirmedHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bentoTile: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 10,
  },
  policyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderWidth: 1,
  },
});
