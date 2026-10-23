import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDishReviews } from '../hooks/useDishReviews';

import { styles } from './dishReviewsSectionStyles';

export default function DishReviewsSection({ menuItemId }) {
  const { colors, fonts, radius } = useTheme();
  const {
    reviews,
    ratingAverage,
    ratingCount,
    isLoading,
    error,
    reload,
    fetchMore,
    hasMore,
  } = useDishReviews(menuItemId);

  // Format date helper
  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.subtleBorder }]}>
      {/* Header with Rating Summary */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: fonts.bold }]}>
            Patron Reviews
          </Text>
          <Text style={[styles.reviewCountText, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            {ratingCount > 0
              ? `${ratingCount} verified ${ratingCount === 1 ? 'review' : 'reviews'}`
              : 'No reviews yet'}
          </Text>
        </View>

        {ratingCount > 0 ? (
          <View
            style={[
              styles.ratingBadge,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
            ]}
          >
            <Ionicons name="star" size={14} color={colors.secondary} />
            <Text style={[styles.ratingScore, { color: colors.textPrimary, fontFamily: fonts.bold }]}>
              {ratingAverage.toFixed(1)}
            </Text>
            <Text style={[styles.ratingScale, { color: colors.mutedText, fontFamily: fonts.regular }]}>
              / 5
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.ratingBadge,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
            ]}
          >
            <Ionicons name="sparkles" size={13} color={colors.primary} />
            <Text style={[styles.newBadgeText, { color: colors.primary, fontFamily: fonts.bold }]}>
              NEW
            </Text>
          </View>
        )}
      </View>

      {/* Loading Skeleton */}
      {isLoading && reviews.length === 0 && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            Loading patron feedback...
          </Text>
        </View>
      )}

      {/* Error State with Retry Button */}
      {error && !isLoading && (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={20} color={colors.cancelled || '#E53935'} />
          <Text style={[styles.errorText, { color: colors.textPrimary, fontFamily: fonts.regular }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={reload}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryButtonText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !error && reviews.length === 0 && (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
          ]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.mutedText} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: fonts.semiBold }]}>
            Be the First to Review
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            Order this gourmet dish and rate your dining experience in Order Tracking once served.
          </Text>
        </View>
      )}

      {/* Reviews List */}
      {reviews.map((rev) => (
        <View
          key={rev._id}
          style={[
            styles.reviewCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.subtleBorder,
              borderRadius: radius.card || 14,
            },
          ]}
        >
          <View style={styles.reviewHeader}>
            <View style={styles.userAvatarRow}>
              {rev.user?.avatar ? (
                <Image source={{ uri: rev.user.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryTint }]}>
                  <Text style={[styles.avatarInitial, { color: colors.primary, fontFamily: fonts.bold }]}>
                    {(rev.user?.name || 'A')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.userNameBlock}>
                <Text style={[styles.reviewerName, { color: colors.textPrimary, fontFamily: fonts.semiBold }]}>
                  {rev.user?.name || 'AURA Patron'}
                </Text>
                <Text style={[styles.reviewDate, { color: colors.mutedText, fontFamily: fonts.regular }]}>
                  {formatDate(rev.createdAt)}
                </Text>
              </View>
            </View>

            {/* Stars row */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= rev.rating ? 'star' : 'star-outline'}
                  size={13}
                  color={star <= rev.rating ? colors.secondary : colors.mutedText}
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
          </View>

          {/* Comment text rendered as plain text */}
          {Boolean(rev.comment) && (
            <Text style={[styles.commentText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {rev.comment}
            </Text>
          )}

          {/* Manager Reply Block */}
          {Boolean(rev.managerReply) && (
            <View
              style={[
                styles.replyBox,
                { backgroundColor: colors.surfaceSubtle, borderLeftColor: colors.primary },
              ]}
            >
              <View style={styles.replyHeaderRow}>
                <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
                <Text style={[styles.replyAuthor, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                  Executive Chef / Manager
                </Text>
              </View>
              <Text style={[styles.replyText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {rev.managerReply}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Load More Button if hasMore */}
      {hasMore && !isLoading && (
        <TouchableOpacity
          style={[styles.loadMoreBtn, { borderColor: colors.subtleBorder }]}
          onPress={fetchMore}
          activeOpacity={0.7}
        >
          <Text style={[styles.loadMoreText, { color: colors.primary, fontFamily: fonts.medium }]}>
            Load More Reviews
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

