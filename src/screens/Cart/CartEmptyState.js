import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import EmptyClocheIllustration from './EmptyClocheIllustration';
import { styles } from './cartStyles';

export default function CartEmptyState({
  navigation,
  colors,
  isDark,
  shadows,
  typography,
  recommendedDishes,
  onApplyPromo,
  onAddItem,
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.emptyScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Banner Row */}
      <View style={styles.emptyHeaderRow}>
        <View>
          <Text style={[typography.headingLg, { color: colors.textPrimary, fontWeight: '800' }]}>
            My Tray
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText }]}>
            (0 creations selected)
          </Text>
        </View>
        <View style={[styles.serviceTypeBadge, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons name="restaurant" size={14} color={colors.primary} />
          <Text style={[styles.serviceTypeBadgeText, { color: colors.textPrimary }]}>
            Dine-in / Takeaway
          </Text>
        </View>
      </View>

      {/* Privilege Voucher Banner */}
      <TouchableOpacity
        style={[
          styles.welcomeVoucherBanner,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
        onPress={() => onApplyPromo('WELCOME10')}
        activeOpacity={0.85}
      >
        <View style={[styles.voucherIconCircle, { backgroundColor: colors.primaryTint }]}>
          <Ionicons name="ticket" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[typography.caption, { color: colors.textPrimary }]}>
            Voucher <Text style={{ color: colors.primary, fontWeight: '700' }}>WELCOME10</Text> (10% off) ready for checkout.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
      </TouchableOpacity>

      {/* Cloche Graphic & Empty Copy */}
      <View style={styles.clocheCenterSection}>
        <EmptyClocheIllustration colors={colors} isDark={isDark} />

        <Text style={[typography.headingLg, styles.emptyTitle, { color: colors.textPrimary }]}>
          Your Tray is Empty
        </Text>
        <Text style={[typography.body, styles.emptySubtitle, { color: colors.textSecondary }]}>
          You haven't added any culinary creations yet. Explore Chef Farhan's handcrafted repertoire and reserve your courses.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Menu')}
          style={[
            styles.browseBtn,
            { backgroundColor: colors.primary },
            shadows.button3D,
          ]}
          activeOpacity={0.88}
        >
          <Text style={[styles.browseBtnText, { color: colors.onPrimary }]}>
            Explore Artisan Menu
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      {/* Recommended by Chef Row */}
      {recommendedDishes && recommendedDishes.length > 0 && (
        <View style={styles.recommendedSection}>
          <View style={styles.recommendedHeader}>
            <View>
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                Recommended by Chef
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText }]}>
                Seasonal pairings curated for you
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedScroll}
          >
            {recommendedDishes.map((dish) => (
              <View
                key={dish.id || dish._id}
                style={[
                  styles.recommendCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  shadows.soft,
                ]}
              >
                {dish.image ? (
                  <Image source={{ uri: dish.image }} style={styles.recommendImage} />
                ) : (
                  <View style={[styles.recommendImageFallback, { backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="restaurant-outline" size={28} color={colors.primary} />
                  </View>
                )}
                <View style={styles.recommendBody}>
                  <Text
                    style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}
                    numberOfLines={1}
                  >
                    {dish.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedText }]} numberOfLines={1}>
                    {dish.category || 'Chef Signature'}
                  </Text>
                  <View style={styles.recommendFooter}>
                    <Text style={[typography.price, { color: colors.primary, fontWeight: '800' }]}>
                      {brand.formatPrice(dish.price)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (dish.isAvailable === false) {
                          Alert.alert('Item Sold Out', `${dish.name} is currently unavailable.`);
                          return;
                        }
                        onAddItem(dish);
                      }}
                      style={[styles.quickAddBtn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.8}
                      accessibilityLabel={`Add ${dish.name} to tray`}
                    >
                      <Ionicons name="add" size={18} color={colors.onPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}
