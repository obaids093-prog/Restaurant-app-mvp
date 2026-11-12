import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function DeliveryTracker({ order }) {
  const { colors, typography, shadows } = useTheme();
  const bikeTranslateX = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const roadDashOffset = useRef(new Animated.Value(0)).current;

  const isDelivery = String(order?.orderType || '').toLowerCase().includes('delivery');
  const status = order?.status || 'Pending';

  // Calculate delivery stage index (0 to 3)
  const getStageIndex = () => {
    switch (status) {
      case 'Pending':
        return 0; // Order Placed
      case 'Preparing':
        return 1; // Kitchen Preparing
      case 'On The Way':
      case 'Ready':
        return 2; // Rider En Route
      case 'Served':
      case 'Delivered':
        return 3; // Delivered
      default:
        return 0;
    }
  };

  const currentStage = getStageIndex();

  useEffect(() => {
    // Pulse animation for live status badge
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.18,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Road dash moving animation
    const roadLoop = Animated.loop(
      Animated.timing(roadDashOffset, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    roadLoop.start();

    // Smooth bike movement along the delivery progress track
    let targetPercent = 0.08;
    if (currentStage === 1) targetPercent = 0.38;
    if (currentStage === 2) targetPercent = 0.72;
    if (currentStage === 3) targetPercent = 0.95;

    Animated.spring(bikeTranslateX, {
      toValue: targetPercent,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();

    return () => {
      pulseLoop.stop();
      roadLoop.stop();
    };
  }, [currentStage, bikeTranslateX, pulseScale, roadDashOffset]);

  if (!isDelivery && status !== 'On The Way') {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
            <Ionicons name="bicycle" size={20} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={[typography.caption, { color: colors.mutedText, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
              AURA Express Dispatch
            </Text>
            <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
              {currentStage === 2 ? 'Out For Delivery' : currentStage === 3 ? 'Order Delivered' : 'Preparing for Dispatch'}
            </Text>
          </View>
        </View>

        {/* Live Pulse Pill */}
        <Animated.View
          style={[
            styles.livePill,
            { backgroundColor: currentStage === 3 ? '#10B98120' : colors.primaryTint, transform: [{ scale: pulseScale }] },
          ]}
        >
          <View
            style={[
              styles.liveDot,
              { backgroundColor: currentStage === 3 ? '#10B981' : colors.primary },
            ]}
          />
          <Text
            style={[
              styles.liveText,
              { color: currentStage === 3 ? '#10B981' : colors.primary },
            ]}
          >
            {currentStage === 3 ? 'Completed' : 'Live Sync'}
          </Text>
        </Animated.View>
      </View>

      {/* Animated Delivery Road Track */}
      <View style={styles.trackContainer}>
        {/* Road Track Line */}
        <View style={[styles.roadLine, { backgroundColor: colors.surfaceBorder }]}>
          <View
            style={[
              styles.activeRoadLine,
              {
                backgroundColor: colors.primary,
                width: `${currentStage === 0 ? 15 : currentStage === 1 ? 45 : currentStage === 2 ? 80 : 100}%`,
              },
            ]}
          />
        </View>

        {/* Origin Restaurant Pin */}
        <View style={[styles.endpointIcon, styles.leftEndpoint, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons name="restaurant" size={14} color={colors.textSecondary} />
        </View>

        {/* Destination Home Pin */}
        <View style={[styles.endpointIcon, styles.rightEndpoint, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons name="home" size={14} color={currentStage === 3 ? '#10B981' : colors.textSecondary} />
        </View>

        {/* Animated Rider Glide */}
        <Animated.View
          style={[
            styles.riderAvatar,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              transform: [
                {
                  translateX: bikeTranslateX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 250],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="bicycle" size={18} color={colors.onPrimary || '#FFFFFF'} />
        </Animated.View>
      </View>

      {/* Milestone Checkpoints */}
      <View style={styles.milestonesRow}>
        <View style={styles.milestoneItem}>
          <Text style={[styles.milestoneLabel, { color: currentStage >= 0 ? colors.textPrimary : colors.mutedText }]}>
            Confirmed
          </Text>
        </View>
        <View style={styles.milestoneItem}>
          <Text style={[styles.milestoneLabel, { color: currentStage >= 1 ? colors.textPrimary : colors.mutedText }]}>
            Cooking
          </Text>
        </View>
        <View style={styles.milestoneItem}>
          <Text style={[styles.milestoneLabel, { color: currentStage >= 2 ? colors.primary : colors.mutedText, fontWeight: currentStage === 2 ? '700' : '500' }]}>
            On The Way
          </Text>
        </View>
        <View style={styles.milestoneItem}>
          <Text style={[styles.milestoneLabel, { color: currentStage >= 3 ? '#10B981' : colors.mutedText, fontWeight: currentStage === 3 ? '700' : '500' }]}>
            Delivered
          </Text>
        </View>
      </View>

      {/* Address & Telemetry Footnote */}
      {order?.deliveryAddress ? (
        <View style={[styles.addressBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
          <Ionicons name="location-sharp" size={16} color={colors.primary} style={{ marginTop: 2, marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.caption, { color: colors.mutedText }]}>Delivering to:</Text>
            <Text style={[typography.bodySm, { color: colors.textPrimary, fontWeight: '600' }]} numberOfLines={2}>
              {order.deliveryAddress}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackContainer: {
    height: 50,
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  roadLine: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  activeRoadLine: {
    height: '100%',
    borderRadius: 3,
  },
  endpointIcon: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    top: 12,
    zIndex: 1,
  },
  leftEndpoint: {
    left: 4,
  },
  rightEndpoint: {
    right: 4,
  },
  riderAvatar: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    top: 9,
    zIndex: 5,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  milestonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  milestoneItem: {
    alignItems: 'center',
  },
  milestoneLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
});

