import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../utils/SafeLinearGradient';
import brand from '../../config/brand';
import { getOptimizedImageUrl } from '../../utils/imageUrl';
import { styles, width } from './menuStyles';

export default function HeroCarousel({
  chefPicks = [],
  searchQuery = '',
  heroIndex = 0,
  setHeroIndex,
  onExploreItem,
  colors,
  fonts,
  shadows,
}) {
  if (chefPicks.length === 0 || searchQuery) {
    return null;
  }

  return (
    <View style={styles.heroCarouselSection}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const slideWidth = width - 32;
          const nextIdx = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
          setHeroIndex(nextIdx);
        }}
        contentContainerStyle={styles.heroScrollContent}
      >
        {chefPicks.map((pick) => (
          <TouchableOpacity
            key={pick.id || pick._id}
            activeOpacity={0.94}
            onPress={() => onExploreItem(pick)}
            style={[
              styles.heroCardSlide,
              {
                width: width - 32,
                backgroundColor: '#1E1E22',
                borderColor: colors.subtleBorder,
              },
              shadows.cardLight,
            ]}
          >
            {/* Ambient culinary placeholder if network is slow/loading */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: '#1C1A19',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Ionicons
                name="restaurant-outline"
                size={68}
                color="rgba(255,255,255,0.12)"
              />
            </View>

            <Image
              source={{ uri: getOptimizedImageUrl(pick.image) }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.85)']}
              style={styles.heroImageGradient}
            />

            {/* Exclusive Reserve Tag */}
            <View style={styles.heroTagRow}>
              <View
                style={[
                  styles.heroTagBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="sparkles" size={11} color={colors.onPrimary} />
                <Text
                  style={[
                    styles.heroTagText,
                    { color: colors.onPrimary, fontFamily: fonts.bold },
                  ]}
                >
                  {brand.heroBanner.tag.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Hero Slide Details */}
            <View style={styles.heroOverlayContent}>
              <View style={styles.heroTextCol}>
                <Text
                  style={[
                    styles.heroSubtitleText,
                    { color: colors.secondary, fontFamily: fonts.medium },
                  ]}
                  numberOfLines={1}
                >
                  Chef's Curated Selection
                </Text>
                <Text
                  style={[
                    styles.heroTitleText,
                    { color: colors.onPrimary, fontFamily: fonts.bold },
                  ]}
                  numberOfLines={1}
                >
                  {pick.name}
                </Text>
              </View>

              <View style={styles.heroPriceCol}>
                <Text
                  style={[
                    styles.heroPriceAmount,
                    { color: colors.onPrimary, fontFamily: fonts.bold },
                  ]}
                >
                  Rs. {pick.price.toLocaleString()}
                </Text>
                <View
                  style={[
                    styles.heroExploreButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.heroExploreBtnText,
                      { color: colors.onPrimary, fontFamily: fonts.semiBold },
                    ]}
                  >
                    Explore
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color={colors.onPrimary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Hero Carousel Dots */}
      <View style={styles.heroDotsRow}>
        {chefPicks.map((pick, i) => (
          <View
            key={`hdot-${pick.id || pick._id || i}`}
            style={[
              styles.heroDot,
              {
                backgroundColor:
                  heroIndex === i ? colors.primary : colors.subtleBorder,
                width: heroIndex === i ? 20 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}
