import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { getOptimizedImageUrl, getCategoryIcon } from '../utils/imageUrl';

/**
 * Question 8: MenuItemCard wrapped in React.memo
 * Optimization verification: Only re-renders when its own props (item, isFavourite, handlers) change.
 */
const MenuItemCard = React.memo(function MenuItemCard({
  item,
  isFavourite,
  onAddToCart,
  onToggleFavourite,
  onExplore,
  colors,
  shadows,
  fonts,
  typography,
  radius,
}) {
  const isAvailable = item.isAvailable;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const [imgError, setImgError] = useState(false);
  const optimizedUri = getOptimizedImageUrl(item.image);

  // Add-to-tray bounce animation (200ms)
  const handleAddPress = () => {
    if (!isAvailable) return;

    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.88,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  // Heart toggle bounce animation (100ms)
  const handleHeartPress = () => {
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 0.82,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(heartAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    if (onToggleFavourite) {
      onToggleFavourite(item.id);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onExplore && onExplore(item)}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: isAvailable ? colors.cardBorder : colors.subtleBorder,
          borderRadius: radius ? radius.card : 20,
        },
        shadows && shadows.cardLight,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, Rs. ${item.price}`}
    >
      {/* Food Imagery & Floating Badges */}
      <View
        style={[
          styles.imageContainer,
          {
            backgroundColor: colors.surfaceSubtle,
            borderTopLeftRadius: radius ? radius.card : 20,
            borderTopRightRadius: radius ? radius.card : 20,
          },
        ]}
      >
        {imgError || !optimizedUri ? (
          <View style={[styles.fallbackContainer, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons
              name={getCategoryIcon(item.category)}
              size={32}
              color={colors.primary}
              style={{ opacity: 0.85 }}
            />
            <Text style={[styles.fallbackText, { color: colors.mutedText, fontFamily: fonts ? fonts.medium : undefined }]}>
              {item.category || 'Gourmet'}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: optimizedUri }}
            style={styles.foodImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        )}

        {/* Daily Special / Chef Tasting Badge */}
        {item.isSpecial && (
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.specialBadge}
          >
            <Ionicons name="sparkles" size={10} color={colors.onPrimary} />
            <Text
              style={[
                styles.specialBadgeText,
                { color: colors.onPrimary, fontFamily: fonts ? fonts.semiBold : undefined },
              ]}
            >
              Special
            </Text>
          </LinearGradient>
        )}

        {/* Sold Out / Unavailable Overlay */}
        {!isAvailable && (
          <View
            style={[
              styles.unavailableOverlay,
              { backgroundColor: 'rgba(0,0,0,0.45)' },
            ]}
          >
            <View
              style={[
                styles.soldOutBadge,
                { backgroundColor: colors.surface, borderColor: colors.subtleBorder },
              ]}
            >
              <Text
                style={[
                  styles.soldOutText,
                  { color: colors.cancelled, fontFamily: fonts ? fonts.semiBold : undefined },
                ]}
              >
                Sold Out
              </Text>
            </View>
          </View>
        )}

        {/* Heart / Favourite Toggle Button */}
        <Animated.View
          style={[
            styles.favouriteBtnWrapper,
            { transform: [{ scale: heartAnim }] },
          ]}
        >
          <TouchableOpacity
            onPress={handleHeartPress}
            style={[
              styles.favouriteBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.subtleBorder,
              },
            ]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Ionicons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={16}
              color={isFavourite ? colors.cancelled : colors.mutedText}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Rating Floating Pill: Real average or New badge */}
        {Number(item.ratingCount) > 0 && Number(item.ratingAverage) > 0 ? (
          <View
            style={[
              styles.ratingPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.subtleBorder,
              },
            ]}
          >
            <Ionicons name="star" size={11} color={colors.secondary} />
            <Text
              style={[
                styles.ratingText,
                { color: colors.textPrimary, fontFamily: fonts ? fonts.bold : undefined },
              ]}
            >
              {Number(item.ratingAverage).toFixed(1)}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.ratingPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.subtleBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.ratingText,
                { color: colors.primary, fontFamily: fonts ? fonts.bold : undefined, fontSize: 10 },
              ]}
            >
              New
            </Text>
          </View>
        )}
      </View>

      {/* Card Content Details */}
      <View style={styles.cardContent}>
        <Text
          style={[
            styles.foodTitle,
            {
              color: isAvailable ? colors.textPrimary : colors.mutedText,
              fontFamily: fonts ? fonts.semiBold : undefined,
            },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <View style={styles.cardFooter}>
          <Text
            style={[
              styles.priceText,
              {
                color: colors.primary,
                fontFamily: fonts ? fonts.bold : undefined,
              },
            ]}
          >
            Rs. {item.price.toLocaleString()}
          </Text>

          {/* Add to Tray Button with Bounce */}
          <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
            <TouchableOpacity
              onPress={handleAddPress}
              disabled={!isAvailable}
              style={[
                styles.addBtn,
                {
                  backgroundColor: isAvailable ? colors.primary : colors.disabled,
                },
                shadows && isAvailable && shadows.buttonPrimary,
              ]}
              activeOpacity={0.85}
              accessibilityLabel={`Add ${item.name} to tray`}
            >
              <Ionicons
                name={isAvailable ? 'add' : 'ban'}
                size={18}
                color={colors.onPrimary}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default MenuItemCard;

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 6,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 150,
  },
  imageContainer: {
    height: 125,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fallbackText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  specialBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    gap: 4,
    zIndex: 2,
  },
  specialBadgeText: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  soldOutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  soldOutText: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  favouriteBtnWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 4,
  },
  favouriteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ratingPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    zIndex: 2,
  },
  ratingText: {
    fontSize: 11,
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  foodTitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    minHeight: 36,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    minHeight: 34,
  },
});
