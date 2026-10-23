import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOptimizedImageUrl } from '../../utils/imageUrl';

export default function OrderAgainRow({
  pastOrders = [],
  selectedCategory = 'All',
  searchQuery = '',
  onReorder,
  navigation,
  colors,
  fonts,
  shadows,
  radius,
}) {
  if (!pastOrders || pastOrders.length === 0 || selectedCategory !== 'All' || searchQuery) {
    return null;
  }

  // Take at most 3 recent past orders
  const recentOrders = pastOrders.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: fonts.bold }]}>
          Order Again
        </Text>
        {navigation && (
          <TouchableOpacity
            onPress={() => navigation.navigate('TrackTab')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.seeAllText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
              See all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recentOrders.map((order) => {
          const firstItem = order.items && order.items[0];
          const dishName = firstItem?.name || `Order #${String(order.id || order._id).slice(-4)}`;
          const dishPrice = firstItem?.price || Math.round(order.totalAmount || 0);
          const dishImage = firstItem?.image || firstItem?.menuItem?.image;
          const imageUrl = dishImage ? getOptimizedImageUrl(dishImage) : null;

          return (
            <TouchableOpacity
              key={order.id || order._id}
              activeOpacity={0.88}
              onPress={() => onReorder(order)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.subtleBorder,
                  borderRadius: radius?.md || 16,
                },
                shadows?.cardLight,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Reorder ${dishName}`}
            >
              {/* Circular Photo */}
              <View
                style={[
                  styles.imageCircle,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
                ]}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.circleImg} resizeMode="cover" />
                ) : (
                  <Ionicons name="restaurant-outline" size={24} color={colors.mutedText} />
                )}
              </View>

              {/* Dish Name */}
              <Text
                style={[styles.dishTitle, { color: colors.textPrimary, fontFamily: fonts.bold }]}
                numberOfLines={1}
              >
                {dishName}
              </Text>

              {/* Price & Reorder Button Row */}
              <View style={styles.bottomRow}>
                <Text
                  style={[styles.priceText, { color: colors.textPrimary, fontFamily: fonts.semiBold }]}
                  numberOfLines={1}
                >
                  Rs. {dishPrice.toLocaleString()}
                </Text>

                <View
                  style={[
                    styles.reorderCircle,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
                  ]}
                >
                  <Ionicons name="refresh" size={14} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 136,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  imageCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleImg: {
    width: '100%',
    height: '100%',
  },
  dishTitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
    width: '100%',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  priceText: {
    fontSize: 12,
    flex: 1,
    marginRight: 4,
  },
  reorderCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
