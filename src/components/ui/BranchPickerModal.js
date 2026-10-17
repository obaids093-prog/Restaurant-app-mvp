import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBranch } from '../../context/BranchContext';

export default function BranchPickerModal() {
  const { colors, isDark, shadows, radius, typography } = useTheme();
  const {
    branches,
    activeBranch,
    isMultiBranch,
    isModalOpen,
    closeBranchModal,
    selectBranch,
  } = useBranch();

  if (!isMultiBranch) return null;

  return (
    <Modal
      visible={isModalOpen}
      transparent
      animationType="fade"
      onRequestClose={closeBranchModal}
    >
      <TouchableWithoutFeedback onPress={closeBranchModal}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderRadius: radius.card * 1.4,
                },
                shadows.deep3D,
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                    Select Dining Sanctuary
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}>
                    Choose your nearest city branch for reservations & orders
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeBranchModal}
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close branch selector"
                >
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Branch List */}
              <ScrollView
                style={styles.branchesList}
                showsVerticalScrollIndicator={false}
              >
                {branches.map((branch) => {
                  const isSelected = branch.id === activeBranch?.id;
                  return (
                    <TouchableOpacity
                      key={branch.id}
                      onPress={() => selectBranch(branch.id)}
                      activeOpacity={0.8}
                      style={[
                        styles.branchItem,
                        {
                          backgroundColor: isSelected ? colors.primaryTint : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                          borderRadius: radius.card,
                        },
                      ]}
                    >
                      <View style={styles.branchItemLeft}>
                        <View
                          style={[
                            styles.branchIconCircle,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surface,
                              borderColor: isSelected ? colors.primary : colors.cardBorder,
                            },
                          ]}
                        >
                          <Ionicons
                            name="location-sharp"
                            size={18}
                            color={isSelected ? colors.onPrimary : colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={styles.branchTitleRow}>
                            <Text
                              style={[
                                typography.body,
                                {
                                  color: colors.textPrimary,
                                  fontWeight: '700',
                                  fontSize: 15,
                                },
                              ]}
                            >
                              {branch.city} • {branch.area}
                            </Text>
                            {isSelected && (
                              <View
                                style={[
                                  styles.activeBadge,
                                  { backgroundColor: colors.primary },
                                ]}
                              >
                                <Text style={[styles.activeBadgeText, { color: colors.onPrimary }]}>
                                  Active
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
                            ]}
                            numberOfLines={1}
                          >
                            {branch.address}
                          </Text>
                          <View style={styles.branchMetaRow}>
                            <Ionicons name="time-outline" size={12} color={colors.mutedText} />
                            <Text style={[styles.metaText, { color: colors.mutedText }]}>
                              {branch.openingHours}
                            </Text>
                            <Text style={[styles.metaDot, { color: colors.mutedText }]}>•</Text>
                            <Ionicons name="call-outline" size={12} color={colors.mutedText} />
                            <Text style={[styles.metaText, { color: colors.mutedText }]}>
                              {branch.phone}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Radio indicator */}
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Footer Note */}
              <View style={[styles.modalFooter, { borderTopColor: colors.surfaceBorder }]}>
                <Ionicons name="information-circle-outline" size={14} color={colors.mutedText} />
                <Text style={[typography.caption, { color: colors.mutedText, marginLeft: 6, flex: 1, fontSize: 11 }]}>
                  Table bookings and kitchen prep will route to your chosen branch.
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchesList: {
    maxHeight: 340,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  branchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  branchIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  branchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  branchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  metaDot: {
    fontSize: 10,
    marginHorizontal: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
});
