import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { brand } from '../config/brand';
import { LinearGradient } from '../utils/SafeLinearGradient';

export default function OrderPlacedScreen({ route, navigation }) {
  const { colors, isDark, shadows, typography } = useTheme();
  const {
    order = {},
    orderType = 'Dine-in',
    tableNumber = 'Table A-01 (Atrium Window)',
    branch,
    grandTotal,
    items = [],
  } = route.params || {};

  // Entrance animations
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse loop for live sync badge
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [scaleAnim, opacityAnim, pulseAnim]);

  const rawOrderId = order.id || order._id || order.orderId || 'AK-4830';
  const displayTicket = String(rawOrderId).length > 8
    ? `#AK-${String(rawOrderId).slice(-4).toUpperCase()}`
    : `#${rawOrderId}`;

  const orderItems = (items.length > 0 ? items : order.items) || [];
  const totalAmount = grandTotal || order.totalPrice || order.total || 0;
  const isDineIn = String(orderType).toLowerCase().includes('dine');

  const now = new Date();
  const readyMin = new Date(now.getTime() + 25 * 60000);
  const readyTimeStr = readyMin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <Animated.View
          style={[
            styles.celebrationSection,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Decorative ambient glow circle */}
          <View
            style={[
              styles.ambientGlow,
              { backgroundColor: colors.primaryTint, opacity: isDark ? 0.3 : 0.6 },
            ]}
          />

          {/* Hero Checkmark Badge with Tactile Double-Ring */}
          <View style={styles.badgeWrapper}>
            <View
              style={[
                styles.outerCircle,
                { backgroundColor: colors.surfaceSubtle },
                shadows.soft,
              ]}
            >
              <View
                style={[
                  styles.innerCircle,
                  { backgroundColor: colors.primaryTint },
                ]}
              >
                <Ionicons name="checkmark-circle" size={44} color={colors.primary} />
              </View>
            </View>

            {/* Pulse beacon badge */}
            <Animated.View
              style={[
                styles.pulseBeacon,
                {
                  backgroundColor: colors.primary,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.pulseBeaconText}>✓</Text>
            </Animated.View>
          </View>

          {/* Celebration Titles */}
          <Text
            style={[
              typography.headingLg,
              styles.celebrationTitle,
              { color: colors.textPrimary },
            ]}
          >
            Order Placed Successfully
          </Text>
          <Text
            style={[
              typography.body,
              styles.celebrationSub,
              { color: colors.textSecondary },
            ]}
          >
            Your culinary request has been transmitted directly to Chef Farhan Siddiqui's kitchen brigade.
          </Text>
        </Animated.View>

        {/* Order Brief Bento Card */}
        <View
          style={[
            styles.bentoCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          {/* Card Top Row: Ticket ID & Kitchen Synced Badge */}
          <View style={styles.bentoTopRow}>
            <View>
              <Text style={[typography.caption, { color: colors.mutedText, textTransform: 'uppercase' }]}>
                Ticket Identifier
              </Text>
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                {displayTicket}
              </Text>
            </View>
            <View
              style={[
                styles.syncBadge,
                { backgroundColor: colors.primaryTint },
              ]}
            >
              <View style={[styles.syncDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.syncBadgeText, { color: colors.primary }]}>
                Kitchen Synced
              </Text>
            </View>
          </View>

          {/* Service & Seating Detail Tile */}
          <View
            style={[
              styles.serviceTile,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
            ]}
          >
            <View
              style={[
                styles.serviceIconBox,
                { backgroundColor: colors.primaryTint },
              ]}
            >
              <Ionicons
                name={isDineIn ? 'restaurant' : 'bag-handle'}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.caption, { color: colors.mutedText }]}>
                Service & Seating
              </Text>
              <Text
                style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}
                numberOfLines={1}
              >
                {isDineIn ? tableNumber : 'Takeaway • Curbside Pickup'}
              </Text>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '500' }]}>
                {branch?.fullName || (isDineIn ? 'Artisan Dine-in Experience' : 'Express Collection')}
              </Text>
            </View>
          </View>

          {/* Course Estimate & Prep Timeline Row */}
          <View style={styles.estimateGrid}>
            <View
              style={[
                styles.estimateBox,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.estimateBoxHeader}>
                <Ionicons name="hourglass-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                  First Course
                </Text>
              </View>
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                ~20 mins
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                Ready at ~{readyTimeStr}
              </Text>
            </View>

            <View
              style={[
                styles.estimateBox,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.estimateBoxHeader}>
                <Ionicons name="receipt-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                  Folio Settlement
                </Text>
              </View>
              <Text style={[typography.headingSm, { color: colors.primary, fontWeight: '800' }]}>
                {brand.formatPrice(totalAmount)}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                Pay at Table (Card/Cash)
              </Text>
            </View>
          </View>

          {/* Item Preview List */}
          {orderItems.length > 0 && (
            <View style={styles.itemPreviewSection}>
              <View style={styles.itemPreviewHeader}>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.mutedText, textTransform: 'uppercase', letterSpacing: 0.5 },
                  ]}
                >
                  Ordered Creations ({orderItems.length})
                </Text>
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                  Priority Expedited
                </Text>
              </View>

              {orderItems.slice(0, 4).map((item, idx) => {
                const qty = item.quantity || 1;
                return (
                  <View
                    key={item.id || item._id || idx}
                    style={[
                      styles.itemRow,
                      idx < Math.min(orderItems.length, 4) - 1 && {
                        borderBottomColor: colors.surfaceBorder,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImageFallback, { backgroundColor: colors.surfaceSubtle }]}>
                        <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {item.note ? (
                        <Text style={[typography.caption, { color: colors.mutedText, fontStyle: 'italic' }]}>
                          "{item.note}"
                        </Text>
                      ) : (
                        <Text style={[typography.caption, { color: colors.textSecondary }]}>
                          Chef's Presentation
                        </Text>
                      )}
                    </View>
                    <Text style={[typography.body, { color: colors.textSecondary, fontWeight: '700' }]}>
                      × {qty}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>


        {/* Interactive Action Buttons */}
        <View style={styles.actionStack}>
          {/* Primary CTA: Track Order */}
          <TouchableOpacity
            onPress={() =>
              navigation.replace('OrderTracking', {
                orderId: order.id || order._id || rawOrderId,
              })
            }
            style={[styles.primaryTrackBtn, { backgroundColor: colors.primary }, shadows.button3D]}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={colors.gradientPrimary || [colors.primary, colors.primaryPressed || '#E04A27']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtnContent}
            >
              <Ionicons name="timer-outline" size={20} color={colors.onPrimary} />
              <Text style={[styles.btnText, { color: colors.onPrimary }]}>
                Track Order in Real-Time
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary CTA: Return to Menu */}
          <TouchableOpacity
            onPress={() => navigation.navigate('CustomerApp', { screen: 'Menu' })}
            style={[
              styles.secondaryMenuBtn,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="restaurant-outline" size={18} color={colors.textPrimary} />
            <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
              Return to Artisan Menu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Concierge Reassurance Footer */}
        <View style={styles.footerNote}>
          <Ionicons name="notifications-outline" size={14} color={colors.mutedText} />
          <Text style={[typography.caption, { color: colors.mutedText, marginLeft: 6 }]}>
            Summon table attendant anytime from the dining dock
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    padding: 16,
    paddingTop: 36,
    paddingBottom: 48,
  },
  celebrationSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  badgeWrapper: {
    position: 'relative',
    marginBottom: 16,
    marginTop: 8,
  },
  outerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseBeacon: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pulseBeaconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  celebrationSub: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 21,
  },
  bentoCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  bentoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
    marginBottom: 14,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  syncBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  serviceTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  serviceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  estimateBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  estimateBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPreviewSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  itemPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  itemImageFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitchenSyncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  kitchenIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionStack: {
    gap: 10,
    marginBottom: 16,
  },
  primaryTrackBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
