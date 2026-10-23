import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tabHeadingTitle: {
    fontSize: 16,
  },
  tabHeadingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshPill: {
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingLabel: {
    fontSize: 13,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
  },
  errorMessage: {
    fontSize: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: 13,
  },
  emptyContainer: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  emptyHeading: {
    fontSize: 15,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  reviewCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userCol: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
  },
  dishTag: {
    fontSize: 12,
    marginTop: 2,
  },
  starBadge: {
    flexDirection: 'row',
  },
  commentBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 11,
  },
  existingReplyBox: {
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  replyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  replyBadgeTitle: {
    fontSize: 11,
  },
  existingReplyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 38,
  },
  replyBtnText: {
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  replyModalCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  replyErrorBox: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  replyErrorText: {
    fontSize: 12,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
  },
  charCounter: {
    fontSize: 11,
  },
  replyInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 90,
    fontSize: 13,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
  },
  sendBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: 13,
  },
});
