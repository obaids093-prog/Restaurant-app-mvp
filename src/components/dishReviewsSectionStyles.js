import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleGroup: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  reviewCountText: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  ratingScore: {
    fontSize: 14,
  },
  ratingScale: {
    fontSize: 11,
  },
  newBadgeText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  errorBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 13,
  },
  emptyCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 8,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  reviewCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
  },
  userNameBlock: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 13,
  },
  reviewDate: {
    fontSize: 11,
    marginTop: 1,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  replyBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  replyAuthor: {
    fontSize: 12,
  },
  replyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    minHeight: 44,
  },
  loadMoreText: {
    fontSize: 13,
  },
});
