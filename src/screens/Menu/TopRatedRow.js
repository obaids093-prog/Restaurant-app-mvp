import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOptimizedImageUrl } from '../../utils/imageUrl';
import { styles } from './menuStyles';

export default function TopRatedRow({
  topRatedItems = [],
  selectedCategory = 'All',
  searchQuery = '',
  onExploreItem,
  onAddToCart,
  colors,
  fonts,
  shadows,
}) {
  if (topRatedItems.length === 0 || selectedCategory !== 'All' || searchQuery) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithBadge}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textPrimary, fontFamily: fonts.bold },
            ]}
          >
            Top Rated
          </Text>
          <View
            style={[
              styles.sectionCounterBadge,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Ionicons name="star" size={11} color={colors.secondary} />
            <Text
              style={[
                styles.sectionCounterText,
                { color: colors.textSecondary, fontFamily: fonts.semiBold },
              ]}
            >
              Curated
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {topRatedItems.map((dish) => (
          <TouchableOpacity
            key={`top-${dish.id || dish._id}`}
            activeOpacity={0.92}
            onPress={() => onExploreItem(dish)}
            style={[
              styles.topRatedCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.subtleBorder,
              },
              shadows.cardLight,
            ]}
          >
            <View style={[styles.topRatedImageContainer, { backgroundColor: '#1C1A19' }]}>
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <Ionicons
                  name="flame-outline"
                  size={32}
                  color="rgba(255,255,255,0.18)"
                />
              </View>
              <Image
                source={{ uri: getOptimizedImageUrl(dish.image) }}
                style={styles.topRatedImage}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.topRatedScorePill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.subtleBorder,
                  },
                ]}
              >
                <Ionicons name="star" size={10} color={colors.secondary} />
                <Text
                  style={[
                    styles.topRatedScoreText,
                    { color: colors.textPrimary, fontFamily: fonts.bold },
                  ]}
                >
                  {dish.rating}
                </Text>
              </View>
            </View>

            <View style={styles.topRatedDetails}>
              <Text
                style={[
                  styles.topRatedDishName,
                  { color: colors.textPrimary, fontFamily: fonts.semiBold },
                ]}
                numberOfLines={1}
              >
                {dish.name}
              </Text>
              <Text
                style={[
                  styles.topRatedDishDesc,
                  { color: colors.mutedText, fontFamily: fonts.regular },
                ]}
                numberOfLines={1}
              >
                {dish.description}
              </Text>

              <View style={styles.topRatedFooter}>
                <Text
                  style={[
                    styles.topRatedPrice,
                    { color: colors.primary, fontFamily: fonts.bold },
                  ]}
                >
                  Rs. {dish.price.toLocaleString()}
                </Text>
                <TouchableOpacity
                  onPress={() => onAddToCart(dish)}
                  style={[
                    styles.topRatedAddBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  activeOpacity={0.85}
                  accessibilityLabel={`Add ${dish.name} to tray`}
                >
                  <Ionicons name="add" size={16} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
