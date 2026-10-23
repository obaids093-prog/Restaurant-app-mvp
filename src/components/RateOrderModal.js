import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSubmitReview } from '../hooks/useSubmitReview';
import { styles } from './rateOrderModalStyles';

export default function RateOrderModal({ visible, order, onClose, onReviewSubmitted }) {
  const { colors, fonts, radius, shadows } = useTheme();
  const { submitReview, isSubmitting, errorMessage, successMessage, resetStatus, setErrorMessage } =
    useSubmitReview();

  // Selected dish from the order (defaults to first item)
  const items = order?.items || [];
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const currentDish = items[selectedItemIndex] || null;

  // Rating & Comment state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Track which dishes have been reviewed in this session
  const [reviewedDishIds, setReviewedDishIds] = useState([]);

  const handleSelectDish = (index) => {
    setSelectedItemIndex(index);
    setRating(5);
    setComment('');
    resetStatus();
  };

  const handleSubmitReview = async () => {
    if (!order || !currentDish) return;

    const dishId = currentDish.menuItem || currentDish._id || currentDish.id;
    const orderId = order._id || order.id;

    const result = await submitReview({
      orderId,
      menuItemId: dishId,
      rating,
      comment,
    });

    if (result.success) {
      setReviewedDishIds((prev) => [...prev, String(dishId)]);

      if (onReviewSubmitted) {
        onReviewSubmitted({ orderId, menuItemId: dishId, rating });
      }

      // Auto close after 1.8 seconds if all dishes reviewed
      setTimeout(() => {
        if (items.length <= 1 || reviewedDishIds.length + 1 >= items.length) {
          onClose();
        }
      }, 1800);
    }
  };

  if (!order || items.length === 0) return null;

  const currentDishId = currentDish
    ? String(currentDish.menuItem || currentDish._id || currentDish.id)
    : '';
  const isCurrentDishReviewed = reviewedDishIds.includes(currentDishId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderRadius: radius.sheet || 24,
            },
            shadows.cardLight,
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.subtleBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary, fontFamily: fonts.bold }]}>
                Rate Your Dining Experience
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.mutedText, fontFamily: fonts.regular }]}>
                Order #{String(order.id || order._id).slice(-4).toUpperCase()} • Served
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close rate order sheet"
            >
              <Ionicons name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Dish selection tabs if order has multiple items */}
            {items.length > 1 && (
              <View style={styles.dishSelectorWrapper}>
                <Text style={[styles.selectorLabel, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
                  Select dish to review:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dishPillRow}>
                  {items.map((it, idx) => {
                    const itId = String(it.menuItem || it._id || it.id);
                    const isReviewed = reviewedDishIds.includes(itId);
                    const isSelected = idx === selectedItemIndex;

                    return (
                      <TouchableOpacity
                        key={`dish-pill-${itId}-${idx}`}
                        onPress={() => handleSelectDish(idx)}
                        style={[
                          styles.dishPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.primary : colors.subtleBorder,
                          },
                        ]}
                      >
                        {isReviewed && (
                          <Ionicons
                            name="checkmark-circle"
                            size={12}
                            color={isSelected ? colors.onPrimary : colors.primary}
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.dishPillText,
                            {
                              color: isSelected ? colors.onPrimary : colors.textPrimary,
                              fontFamily: isSelected ? fonts.semiBold : fonts.regular,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {it.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Current dish banner */}
            <View
              style={[
                styles.currentDishBanner,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
              ]}
            >
              <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
              <Text
                style={[
                  styles.currentDishName,
                  { color: colors.textPrimary, fontFamily: fonts.semiBold },
                ]}
                numberOfLines={1}
              >
                {currentDish?.name}
              </Text>
            </View>

            {/* Success message banner */}
            {successMessage && (
              <View style={[styles.statusBanner, { backgroundColor: '#10B98118', borderColor: '#10B98150' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.statusBannerText, { color: '#10B981', fontFamily: fonts.medium }]}>
                  {successMessage}
                </Text>
              </View>
            )}

            {/* Error message banner */}
            {errorMessage && (
              <View style={[styles.statusBanner, { backgroundColor: '#EF444418', borderColor: '#EF444450' }]}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={[styles.statusBannerText, { color: '#EF4444', fontFamily: fonts.medium }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {isCurrentDishReviewed ? (
              <View style={[styles.alreadyReviewedBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="star" size={24} color={colors.secondary} />
                <Text style={[styles.alreadyReviewedTitle, { color: colors.textPrimary, fontFamily: fonts.semiBold }]}>
                  Dish Reviewed
                </Text>
                <Text style={[styles.alreadyReviewedSub, { color: colors.mutedText, fontFamily: fonts.regular }]}>
                  You have already shared your review for this creation.
                </Text>
              </View>
            ) : (
              <>
                {/* One Tap 1 to 5 Star Rating */}
                <View style={styles.starPickerSection}>
                  <Text style={[styles.starPickerLabel, { color: colors.textPrimary, fontFamily: fonts.medium }]}>
                    Your Rating
                  </Text>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity
                        key={`star-${s}`}
                        onPress={() => setRating(s)}
                        style={styles.starTouchTarget}
                        activeOpacity={0.7}
                        accessibilityLabel={`Rate ${s} out of 5 stars`}
                      >
                        <Ionicons
                          name={s <= rating ? 'star' : 'star-outline'}
                          size={32}
                          color={s <= rating ? colors.secondary : colors.mutedText}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.ratingWord, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                    {rating === 5 && 'Outstanding • Culinary Excellence'}
                    {rating === 4 && 'Very Good • Exceeded Expectations'}
                    {rating === 3 && 'Average • Good Flavor'}
                    {rating === 2 && 'Fair • Room for Refinement'}
                    {rating === 1 && 'Poor • Disappointing'}
                  </Text>
                </View>

                {/* Optional Comment Input with 300 max char counter */}
                <View style={styles.commentSection}>
                  <View style={styles.commentHeaderRow}>
                    <Text style={[styles.commentLabel, { color: colors.textPrimary, fontFamily: fonts.medium }]}>
                      Patron Note (Optional)
                    </Text>
                    <Text style={[styles.charCount, { color: colors.mutedText, fontFamily: fonts.regular }]}>
                      {comment.length}/300
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.commentInput,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.subtleBorder,
                        color: colors.textPrimary,
                        fontFamily: fonts.regular,
                      },
                    ]}
                    placeholder="Share tasting notes, texture, presentation, or pairing feedback..."
                    placeholderTextColor={colors.mutedText}
                    multiline
                    numberOfLines={4}
                    maxLength={300}
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                  />
                </View>

                {/* Submit Review Button */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: isSubmitting ? colors.surfaceSubtle : colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={handleSubmitReview}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="paper-plane-outline" size={16} color={colors.onPrimary} style={{ marginRight: 6 }} />
                      <Text style={[styles.submitBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
                        Submit Verified Review
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
