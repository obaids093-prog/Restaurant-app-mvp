import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';

/**
 * Question 8: MenuItemCard wrapped in React.memo
 * Optimization verification: Only re-renders when its own props (item, isFavourite, handlers) change.
 */
const MenuItemCard = React.memo(function MenuItemCard({
  item,
  isFavourite,
  onAddToCart,
  onToggleFavourite,
  colors,
  shadows,
}) {
  // Demonstration console.log as required by Question 8:
  console.log(`[PERF - React.memo] Rendered MenuItemCard ID: ${item.id} - ${item.name}`);

  const isAvailable = item.isAvailable;

  return (
    <View
      style={[
        styles.cardWrapper,
        {
          backgroundColor: colors.card,
          borderColor: isAvailable ? colors.cardBorder : colors.surfaceBorder,
          opacity: isAvailable ? 1 : 0.65,
        },
        shadows.medium3D,
      ]}
    >
      {/* Food Imagery & Floating Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.foodImage} resizeMode="cover" />

        {/* Daily Special / Chef Badge */}
        {item.isSpecial && (
          <LinearGradient
            colors={['#D97706', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.specialBadge, shadows.soft]}
          >
            <Ionicons name="sparkles" size={12} color="#FFFFFF" />
            <Text style={styles.specialBadgeText}>Daily Special</Text>
          </LinearGradient>
        )}

        {/* Unavailable Overlay */}
        {!isAvailable && (
          <View style={styles.unavailableOverlay}>
            <View style={styles.soldOutBadge}>
              <Ionicons name="close-circle" size={14} color="#FFFFFF" />
              <Text style={styles.soldOutText}>Sold Out Today</Text>
            </View>
          </View>
        )}

        {/* Heart / Favourite Toggle Button */}
        <TouchableOpacity
          onPress={() => onToggleFavourite(item.id)}
          style={[
            styles.favouriteBtn,
            { backgroundColor: isFavourite ? '#E11D48' : 'rgba(15, 23, 42, 0.65)' },
            shadows.soft,
          ]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFavourite ? 'heart' : 'heart-outline'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Category & Rating Floating Badges */}
        <View style={styles.imageFloatingMeta}>
          <View style={[styles.categoryTag, { backgroundColor: 'rgba(11, 17, 23, 0.85)' }]}>
            <Text style={styles.categoryTagText}>{item.category}</Text>
          </View>
          <View style={[styles.ratingTag, { backgroundColor: 'rgba(11, 17, 23, 0.85)' }]}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>

      {/* Card Content Details */}
      <View style={styles.cardContent}>
        {item.tag && (
          <View style={styles.tagRow}>
            <View style={[styles.tagPill, { backgroundColor: colors.badge }]}>
              <Text style={[styles.tagPillText, { color: colors.badgeText }]}>{item.tag}</Text>
            </View>
          </View>
        )}

        <Text
          style={[styles.foodTitle, { color: isAvailable ? colors.textPrimary : colors.textMuted }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <Text style={[styles.foodDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={[styles.priceCurrency, { color: colors.primary }]}>
              Rs. <Text style={styles.priceAmount}>{item.price.toLocaleString()}</Text>
            </Text>
            <View style={styles.prepTimeRow}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.prepTimeText, { color: colors.textMuted }]}>
                {item.prepTime}
              </Text>
            </View>
          </View>

          {/* Add to Order Button */}
          <TouchableOpacity
            onPress={() => onAddToCart(item)}
            disabled={!isAvailable}
            style={[
              styles.addButtonOuter,
              isAvailable && shadows.button3D,
            ]}
            activeOpacity={0.85}
          >
            {isAvailable ? (
              <LinearGradient
                colors={['#f59e0b', '#ffc174']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={17} color="#472a00" />
                <Text style={[styles.addButtonText, { color: '#472a00' }]}>Add</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.soldOutButton, { backgroundColor: colors.inputBorder }]}>
                <Ionicons name="ban" size={15} color={colors.textMuted} />
                <Text style={[styles.soldOutButtonText, { color: colors.textMuted }]}>Sold Out</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default MenuItemCard;

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 190,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  specialBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 5,
  },
  specialBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  favouriteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  imageFloatingMeta: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryTagText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardContent: {
    padding: 16,
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tagPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  foodTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  foodDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '700',
  },
  priceAmount: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  prepTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  prepTimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addButtonOuter: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  soldOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
  },
  soldOutButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
