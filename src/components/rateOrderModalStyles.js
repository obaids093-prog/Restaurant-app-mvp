import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 17,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    marginTop: 12,
  },
  dishSelectorWrapper: {
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  dishPillRow: {
    flexDirection: 'row',
  },
  dishPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 36,
  },
  dishPillText: {
    fontSize: 12,
  },
  currentDishBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  currentDishName: {
    fontSize: 14,
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  statusBannerText: {
    fontSize: 13,
    flex: 1,
  },
  alreadyReviewedBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  alreadyReviewedTitle: {
    fontSize: 15,
  },
  alreadyReviewedSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  starPickerSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  starPickerLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  starTouchTarget: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingWord: {
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  commentSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentLabel: {
    fontSize: 13,
  },
  charCount: {
    fontSize: 11,
  },
  commentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 90,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  submitBtnText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
