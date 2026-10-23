import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../utils/SafeLinearGradient';
import { getOptimizedImageUrl } from '../../utils/imageUrl';

export default function ChefsPickBanner({
  featuredDish,
  searchQuery = '',
  selectedCategory = 'All',
  onExploreItem,
  onOrderNow,
  colors,
  fonts,
  shadows,
  radius,
}) {
  if (!featuredDish || searchQuery || selectedCategory !== 'All') {
    return null;
  }

  const imageUrl = getOptimizedImageUrl(featuredDish.image);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onExploreItem && onExploreItem(featuredDish)}
        style={[
          styles.bannerCard,
          {
            backgroundColor: '#1E1E1E',
            borderColor: colors.subtleBorder || '#2C2C2C',
            borderRadius: radius?.lg || 16,
          },
          shadows?.cardLight,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Chef's pick today: ${featuredDish.name}`}
      >
        {/* Left Content Column */}
        <View style={styles.leftColumn}>
          <Text style={[styles.eyebrow, { color: colors.primary, fontFamily: fonts.bold }]}>
            SPECIAL TASTING
          </Text>
          <Text style={[styles.title, { fontFamily: fonts.bold }]} numberOfLines={1}>
            Chef's pick today
          </Text>
          <TouchableOpacity
            style={[styles.orderNowBtn, { backgroundColor: colors.primary }]}
            onPress={() => (onOrderNow ? onOrderNow(featuredDish) : onExploreItem(featuredDish))}
            activeOpacity={0.85}
          >
            <Text style={[styles.orderNowText, { fontFamily: fonts.bold }]}>
              Order now
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Image Column with Gradient Blend */}
        <View style={styles.imageColumn}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.dishImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackIconBox}>
              <Ionicons name="restaurant-outline" size={36} color="rgba(255,255,255,0.2)" />
            </View>
          )}
          <LinearGradient
            colors={['#1E1E1E', 'rgba(30,30,30,0.6)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.55, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bannerCard: {
    height: 120,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  leftColumn: {
    flex: 1.25,
    paddingLeft: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 2,
    marginBottom: 6,
  },
  orderNowBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  orderNowText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  imageColumn: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  fallbackIconBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
