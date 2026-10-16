import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  styles,
  CATEGORIES,
  SORT_OPTIONS,
  PRICE_FILTERS,
} from './menuStyles';

export default function FilterSheet({
  visible = false,
  onClose,
  filterSheetAnim,
  categories = CATEGORIES,
  selectedCategory = 'All',
  onSelectCategory,
  sortOptions = SORT_OPTIONS,
  selectedSort = 'default',
  onSelectSort,
  priceFilters = PRICE_FILTERS,
  selectedPriceRange = 'all',
  onSelectPriceRange,
  availableOnly = false,
  onToggleAvailable,
  specialsOnly = false,
  onToggleSpecials,
  onResetFilters,
  totalCount = 0,
  colors,
  fonts,
  shadows,
  insets,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.filterModalOverlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.filterBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sliding Sheet */}
        <Animated.View
          style={[
            styles.filterSheetCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.subtleBorder,
              paddingBottom: insets.bottom + 20,
              transform: [
                {
                  translateY: filterSheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
            shadows.cardLight,
          ]}
        >
          <View style={styles.filterHandleBar}>
            <View
              style={[
                styles.filterHandle,
                { backgroundColor: colors.subtleBorder },
              ]}
            />
          </View>

          <View style={styles.filterHeaderRow}>
            <Text
              style={[
                styles.filterSheetTitle,
                { color: colors.textPrimary, fontFamily: fonts.bold },
              ]}
            >
              Filter & Sort Creations
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.filterScrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Category Pills */}
            <Text
              style={[
                styles.filterSectionHeading,
                { color: colors.mutedText, fontFamily: fonts.semiBold },
              ]}
            >
              CULINARY CATEGORY
            </Text>
            <View style={styles.filterOptionsGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={`fc-${cat}`}
                    onPress={() => onSelectCategory(cat)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceSubtle,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.subtleBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected
                            ? colors.onPrimary
                            : colors.textPrimary,
                          fontFamily: isSelected ? fonts.bold : fonts.regular,
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sorting Options */}
            <Text
              style={[
                styles.filterSectionHeading,
                {
                  color: colors.mutedText,
                  fontFamily: fonts.semiBold,
                  marginTop: 18,
                },
              ]}
            >
              SORT BY
            </Text>
            <View style={styles.filterOptionsGrid}>
              {sortOptions.map((opt) => {
                const isSelected = selectedSort === opt.id;
                return (
                  <TouchableOpacity
                    key={`fs-${opt.id}`}
                    onPress={() => onSelectSort(opt.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceSubtle,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.subtleBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected
                            ? colors.onPrimary
                            : colors.textPrimary,
                          fontFamily: isSelected ? fonts.bold : fonts.regular,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price Range Filter */}
            <Text
              style={[
                styles.filterSectionHeading,
                {
                  color: colors.mutedText,
                  fontFamily: fonts.semiBold,
                  marginTop: 18,
                },
              ]}
            >
              PRICE TIER
            </Text>
            <View style={styles.filterOptionsGrid}>
              {priceFilters.map((p) => {
                const isSelected = selectedPriceRange === p.id;
                return (
                  <TouchableOpacity
                    key={`fp-${p.id}`}
                    onPress={() => onSelectPriceRange(p.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceSubtle,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.subtleBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected
                            ? colors.onPrimary
                            : colors.textPrimary,
                          fontFamily: isSelected ? fonts.bold : fonts.regular,
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Toggles: Available Only & Specials Only */}
            <Text
              style={[
                styles.filterSectionHeading,
                {
                  color: colors.mutedText,
                  fontFamily: fonts.semiBold,
                  marginTop: 18,
                },
              ]}
            >
              PREFERENCES
            </Text>
            <View style={styles.filterToggleRow}>
              <TouchableOpacity
                onPress={onToggleAvailable}
                style={[
                  styles.filterToggleCard,
                  {
                    backgroundColor: availableOnly
                      ? colors.primaryTint
                      : colors.surfaceSubtle,
                    borderColor: availableOnly
                      ? colors.primary
                      : colors.subtleBorder,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={availableOnly ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={availableOnly ? colors.primary : colors.mutedText}
                />
                <Text
                  style={[
                    styles.filterToggleText,
                    {
                      color: availableOnly ? colors.primary : colors.textPrimary,
                      fontFamily: fonts.medium,
                    },
                  ]}
                >
                  Available Dishes Only
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onToggleSpecials}
                style={[
                  styles.filterToggleCard,
                  {
                    backgroundColor: specialsOnly
                      ? colors.primaryTint
                      : colors.surfaceSubtle,
                    borderColor: specialsOnly
                      ? colors.primary
                      : colors.subtleBorder,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={specialsOnly ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={specialsOnly ? colors.primary : colors.mutedText}
                />
                <Text
                  style={[
                    styles.filterToggleText,
                    {
                      color: specialsOnly ? colors.primary : colors.textPrimary,
                      fontFamily: fonts.medium,
                    },
                  ]}
                >
                  Chef Specials Only
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Filter Actions */}
          <View
            style={[
              styles.filterActionFooter,
              { borderTopColor: colors.subtleBorder },
            ]}
          >
            <TouchableOpacity
              onPress={onResetFilters}
              style={[
                styles.filterResetBtn,
                { borderColor: colors.subtleBorder },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterResetBtnText,
                  { color: colors.mutedText, fontFamily: fonts.semiBold },
                ]}
              >
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.filterApplyBtn,
                { backgroundColor: colors.primary },
                shadows.buttonPrimary,
              ]}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterApplyBtnText,
                  { color: colors.onPrimary, fontFamily: fonts.semiBold },
                ]}
              >
                Apply Filters ({totalCount})
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
