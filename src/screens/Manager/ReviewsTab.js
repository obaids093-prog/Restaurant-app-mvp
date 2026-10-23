import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useManagerReviews } from '../../hooks/useManagerReviews';
import ReviewReplyModal from './ReviewReplyModal';
import { styles } from './reviewsTabStyles';

export default function ReviewsTab({ colors, fonts, radius, shadows, insets }) {
  const {
    reviews,
    isLoading,
    isRefreshing,
    error,
    page,
    totalPages,
    fetchReviews,
    refreshReviews,
    replyToReview,
    isSubmittingReply,
    replyError,
    setReplyError,
  } = useManagerReviews();

  // Reply Modal State
  const [activeReviewForReply, setActiveReviewForReply] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleOpenReplyModal = (rev) => {
    setActiveReviewForReply(rev);
    setReplyText(rev.managerReply || '');
    if (setReplyError) setReplyError(null);
  };

  const handleSendReply = async () => {
    if (!activeReviewForReply || !replyText.trim()) return;

    const res = await replyToReview(activeReviewForReply._id, replyText);
    if (res.success) {
      setActiveReviewForReply(null);
      setReplyText('');
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderReviewItem = ({ item: rev }) => (
    <View
      style={[
        styles.reviewCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderRadius: radius.card || 16,
        },
        shadows.cardLight,
      ]}
    >
      {/* Top Row: User & Dish Info */}
      <View style={styles.cardHeader}>
        <View style={styles.userCol}>
          <Text style={[styles.userName, { color: colors.textPrimary, fontFamily: fonts.bold }]}>
            {rev.user?.name || 'Customer'}
          </Text>
          <Text style={[styles.dishTag, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            Dish: {rev.menuItem?.name || 'Artisan Dish'}
          </Text>
        </View>

        {/* Stars Badge */}
        <View style={styles.starBadge}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
              key={s}
              name={s <= rev.rating ? 'star' : 'star-outline'}
              size={13}
              color={s <= rev.rating ? colors.secondary : colors.mutedText}
              style={{ marginLeft: 1 }}
            />
          ))}
        </View>
      </View>

      {/* Comment */}
      {Boolean(rev.comment) && (
        <Text style={[styles.commentBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
          "{rev.comment}"
        </Text>
      )}

      {/* Date & Order Info */}
      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: colors.mutedText, fontFamily: fonts.regular }]}>
          {formatDate(rev.createdAt)}
        </Text>
        {rev.order?.totalAmount && (
          <Text style={[styles.metaText, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            • Folio Rs. {Number(rev.order.totalAmount).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Manager Reply Display */}
      {Boolean(rev.managerReply) && (
        <View
          style={[
            styles.existingReplyBox,
            { backgroundColor: colors.surfaceSubtle, borderLeftColor: colors.primary },
          ]}
        >
          <View style={styles.replyBadgeRow}>
            <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
            <Text style={[styles.replyBadgeTitle, { color: colors.primary, fontFamily: fonts.semiBold }]}>
              Your Reply
            </Text>
          </View>
          <Text style={[styles.existingReplyText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
            {rev.managerReply}
          </Text>
        </View>
      )}

      {/* Action: Reply button */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => handleOpenReplyModal(rev)}
          style={[
            styles.replyBtn,
            {
              backgroundColor: rev.managerReply ? colors.surfaceSubtle : colors.primaryTint,
              borderColor: colors.primary + '40',
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={rev.managerReply ? 'pencil-outline' : 'chatbubble-ellipses-outline'}
            size={14}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.replyBtnText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            {rev.managerReply ? 'Edit Reply' : 'Reply to Customer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Heading */}
      <View style={styles.tabHeadingRow}>
        <View>
          <Text style={[styles.tabHeadingTitle, { color: colors.textPrimary, fontFamily: fonts.bold }]}>
            Customer Reviews & Feedback
          </Text>
          <Text style={[styles.tabHeadingSub, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            Verified guest reviews across Lahore & Islamabad menus
          </Text>
        </View>

        <TouchableOpacity
          onPress={refreshReviews}
          style={[styles.refreshPill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder }]}
          activeOpacity={0.7}
        >
          <Ionicons name="sync" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Skeleton Loading State */}
      {isLoading && reviews.length === 0 && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            Loading recent dining reviews...
          </Text>
        </View>
      )}

      {/* Error State with Retry */}
      {error && !isLoading && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: colors.card, borderColor: colors.subtleBorder },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={24} color={colors.cancelled || '#EF4444'} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary, fontFamily: fonts.semiBold }]}>
            Failed to Load Reviews
          </Text>
          <Text style={[styles.errorMessage, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => fetchReviews(1, false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryBtnText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !error && reviews.length === 0 && (
        <View
          style={[
            styles.emptyContainer,
            { backgroundColor: colors.card, borderColor: colors.subtleBorder },
          ]}
        >
          <Ionicons name="chatbubbles-outline" size={36} color={colors.mutedText} />
          <Text style={[styles.emptyHeading, { color: colors.textPrimary, fontFamily: fonts.bold }]}>
            No Reviews Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            When customers complete and rate their dining orders, their feedback will appear here for management response.
          </Text>
        </View>
      )}

      {/* List */}
      {!isLoading && !error && reviews.length > 0 && (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={renderReviewItem}
          refreshing={isRefreshing}
          onRefresh={refreshReviews}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => {
            if (page < totalPages && !isLoading) {
              fetchReviews(page + 1, false);
            }
          }}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* Reply Modal */}
      <ReviewReplyModal
        visible={Boolean(activeReviewForReply)}
        review={activeReviewForReply}
        replyText={replyText}
        onChangeReplyText={setReplyText}
        onSubmitReply={handleSendReply}
        onClose={() => setActiveReviewForReply(null)}
        isSubmitting={isSubmittingReply}
        replyError={replyError}
        colors={colors}
        fonts={fonts}
        shadows={shadows}
      />
    </View>
  );
}
