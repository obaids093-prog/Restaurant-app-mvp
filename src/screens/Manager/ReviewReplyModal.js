import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './reviewsTabStyles';

export default function ReviewReplyModal({
  visible,
  review,
  replyText,
  onChangeReplyText,
  onSubmitReply,
  onClose,
  isSubmitting,
  replyError,
  colors,
  fonts,
  shadows,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.replyModalCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.cardLight,
          ]}
        >
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: fonts.bold }]}>
                Reply as Manager
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedText, fontFamily: fonts.regular }]}>
                Responding to {review?.user?.name || 'Customer'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {replyError && (
            <View style={[styles.replyErrorBox, { backgroundColor: '#EF444415' }]}>
              <Text style={[styles.replyErrorText, { color: '#EF4444', fontFamily: fonts.medium }]}>
                {replyError}
              </Text>
            </View>
          )}

          <View style={styles.inputHeaderRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
              Manager Reply (max 300 chars):
            </Text>
            <Text style={[styles.charCounter, { color: colors.mutedText, fontFamily: fonts.regular }]}>
              {replyText.length}/300
            </Text>
          </View>

          <TextInput
            style={[
              styles.replyInput,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.subtleBorder,
                color: colors.textPrimary,
                fontFamily: fonts.regular,
              },
            ]}
            placeholder="e.g. Thank you for your review. We are delighted you enjoyed our dishes..."
            placeholderTextColor={colors.mutedText}
            multiline
            numberOfLines={4}
            maxLength={300}
            value={replyText}
            onChangeText={onChangeReplyText}
            textAlignVertical="top"
          />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.subtleBorder }]}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.mutedText, fontFamily: fonts.medium }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSubmitReply}
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
              disabled={isSubmitting || !replyText.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={[styles.sendBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
                  Post Reply
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
