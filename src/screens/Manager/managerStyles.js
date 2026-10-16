import { StyleSheet, Platform, Alert } from 'react-native';

// Cross-platform alert helper
export const showConsoleAlert = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Helper for Order Status styles
export const getOrderStatusStyles = (status, colors) => {
  switch (status) {
    case 'Served':
    case 'Delivered':
      return { bg: colors.readyTint, color: colors.ready };
    case 'Ready':
      return { bg: colors.preparingTint, color: colors.preparing };
    case 'Preparing':
      return { bg: colors.pendingTint, color: colors.pending };
    case 'Cancelled':
      return { bg: colors.cancelledTint, color: colors.cancelled };
    default:
      return { bg: colors.surface, color: colors.primary };
  }
};

// Helper for Reservation Status styles
export const getReservationStatusStyles = (status, colors) => {
  switch (status) {
    case 'Completed':
      return { bg: '#10B98120', color: '#10B981', label: 'Visited' };
    case 'No-Show':
      return { bg: '#F59E0B20', color: '#F59E0B', label: 'No-Show' };
    case 'Confirmed':
    case 'Approved':
      return { bg: colors.readyTint, color: colors.ready, label: 'Confirmed' };
    case 'Cancelled':
    case 'Declined':
      return { bg: colors.cancelledTint, color: colors.cancelled, label: status };
    default:
      return { bg: colors.pendingTint, color: colors.pending, label: 'Pending' };
  }
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  executiveHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  managerPill: {
    backgroundColor: 'rgba(252, 88, 52, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  managerPillText: {
    color: '#FC5834',
    fontSize: 9,
    fontWeight: '800',
  },
  brandSubText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  switchViewText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  tabsScroller: {
    gap: 8,
    paddingVertical: 4,
  },
  managerTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scrollBody: {
    padding: 16,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  tabContentBlock: {
    width: '100%',
  },

  // Greeting Header
  greetingHeader: {
    marginBottom: 16,
  },
  pulseLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  pulseLiveText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCardHalf: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderWidth: 1,
  },
  kpiCardFull: {
    width: '100%',
    padding: 16,
  },
  kpiCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTagBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveTagText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },

  // Shortcuts
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  shortcutBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },

  // Section Headers
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  // Card Item
  cardItem: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  itemsListContainer: {
    padding: 10,
    borderWidth: 1,
    gap: 4,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  progressionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  progressionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 4,
  },

  // Booking details
  bookingSlotBadge: {
    alignItems: 'flex-end',
  },
  bookingMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderWidth: 1,
  },

  // Menu cards
  availToggleBox: {
    alignItems: 'flex-end',
  },
  menuPriceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  priceDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  priceEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  savePriceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelPriceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  addDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  // Team
  selfBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staffActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    padding: 20,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  catSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  modalSaveBtn: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  stateHeading: {
    fontSize: 18,
    marginTop: 16,
    letterSpacing: -0.2,
  },
  stateSubheading: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 12,
    marginTop: 18,
  },
  retryBtnText: {
    fontSize: 14,
  },
});
