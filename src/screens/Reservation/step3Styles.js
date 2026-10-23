import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBarHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: 8,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroSection: {
    marginBottom: 16,
  },
  stepTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stepTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepTagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  stepTagSub: {
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  flagPrefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
  },
  flagEmoji: {
    fontSize: 16,
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldHelperText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
  clearBtn: {
    padding: 4,
  },
  textareaInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  requestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  requestChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  summaryMainInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  summaryMainTime: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryMainParty: {
    fontSize: 12,
    marginTop: 2,
  },
  holdBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  holdBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryPolicySection: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  policyText: {
    fontSize: 11,
  },
  roomCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  roomThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
  },
  roomThumbImage: {
    width: '100%',
    height: '100%',
  },
  roomContent: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  roomDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  stickyBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  primaryCtaBtn: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FC5834',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ctaSubText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 6,
  },
});
