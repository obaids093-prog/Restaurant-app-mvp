import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, TouchableOpacity, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './riderTrackingStyles';

export default function LiveMapCanvas({
  tracking,
  colors,
  isDark,
  shadows,
  typography,
  fonts,
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const riderPosAnim = useRef(new Animated.Value(0)).current;

  const progress = tracking?.route?.progressPercent || 0.45;
  const speed = tracking?.route?.speedKmh || 32;
  const cityName = tracking?.restaurant?.city || 'Lahore';

  // Radar ping animation loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Smooth position interpolation
  useEffect(() => {
    Animated.timing(riderPosAnim, {
      toValue: progress,
      duration: 1800,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress, riderPosAnim]);

  // Coordinate interpolations across the 320px map canvas
  // Restaurant: Top-Left (x: 48, y: 52)
  // Destination: Bottom-Right (x: 270, y: 248)
  const riderLeft = riderPosAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 260],
  });

  const riderTop = riderPosAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [56, 240],
  });

  // Background map theme tokens
  const mapBg = isDark ? '#1C2127' : '#F1F4F8';
  const roadColor = isDark ? '#2D343E' : '#FFFFFF';
  const majorRoadColor = isDark ? '#3D4654' : '#E2E8F0';
  const parkColor = isDark ? '#1E2C24' : '#E8F5E9';
  const waterColor = isDark ? '#1B2B38' : '#E1F5FE';

  return (
    <View
      style={[
        styles.mapContainer,
        { backgroundColor: mapBg, borderColor: colors.cardBorder },
        shadows.medium3D,
      ]}
    >
      {/* City Street Grid Representation */}
      <View style={styles.mapGridPattern}>
        {/* Park & Green Belts */}
        <View
          style={[
            styles.parkZone,
            {
              top: 18,
              right: 28,
              width: 90,
              height: 70,
              backgroundColor: parkColor,
            },
          ]}
        />
        <View
          style={[
            styles.parkZone,
            {
              bottom: 30,
              left: 20,
              width: 80,
              height: 60,
              backgroundColor: parkColor,
            },
          ]}
        />

        {/* Water Canal / Lake */}
        <View
          style={[
            styles.waterBody,
            {
              top: 140,
              left: -20,
              width: 380,
              height: 18,
              backgroundColor: waterColor,
              transform: [{ rotate: '-12deg' }],
            },
          ]}
        />

        {/* Major Expressways / Avenues */}
        <View
          style={[
            styles.roadLine,
            {
              top: 50,
              left: 0,
              right: 0,
              height: 12,
              backgroundColor: majorRoadColor,
            },
          ]}
        />
        <View
          style={[
            styles.roadLine,
            {
              top: 236,
              left: 0,
              right: 0,
              height: 12,
              backgroundColor: majorRoadColor,
            },
          ]}
        />
        <View
          style={[
            styles.roadLine,
            {
              top: 0,
              bottom: 0,
              left: 64,
              width: 14,
              backgroundColor: roadColor,
            },
          ]}
        />
        <View
          style={[
            styles.roadLine,
            {
              top: 0,
              bottom: 0,
              right: 80,
              width: 14,
              backgroundColor: roadColor,
            },
          ]}
        />

        {/* Diagonal Transit Corridor */}
        <View
          style={[
            styles.roadLine,
            {
              top: 30,
              left: 40,
              width: 280,
              height: 14,
              backgroundColor: roadColor,
              transform: [{ rotate: '36deg' }],
            },
          ]}
        />

        {/* Street Landmark Names */}
        <Text
          style={{
            position: 'absolute',
            top: 26,
            left: 70,
            fontSize: 9,
            color: colors.mutedText,
            fontWeight: '600',
            fontFamily: fonts?.medium,
          }}
        >
          {cityName === 'Islamabad' ? 'Fazl-e-Haq Rd' : 'Main Blvd Gulberg'}
        </Text>
        <Text
          style={{
            position: 'absolute',
            bottom: 60,
            right: 40,
            fontSize: 9,
            color: colors.mutedText,
            fontWeight: '600',
            fontFamily: fonts?.medium,
          }}
        >
          {cityName === 'Islamabad' ? 'Jinnah Ave' : 'MM Alam Road'}
        </Text>
      </View>

      {/* Restaurant Origin Pin */}
      <View style={[styles.mapOverlayPin, { top: 40, left: 40 }]}>
        <View
          style={[
            styles.pinCircle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            },
            shadows.soft,
          ]}
        >
          <Ionicons name="restaurant" size={16} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.pinLabel,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              color: colors.textPrimary,
              fontFamily: fonts?.semiBold,
            },
          ]}
        >
          AURA Kitchen
        </Text>
      </View>

      {/* Customer Destination Pin */}
      <View style={[styles.mapOverlayPin, { bottom: 35, right: 35 }]}>
        <View
          style={[
            styles.pinCircle,
            {
              backgroundColor: colors.ready,
              borderColor: colors.surface,
            },
            shadows.soft,
          ]}
        >
          <Ionicons name="home" size={16} color={colors.onPrimary} />
        </View>
        <Text
          style={[
            styles.pinLabel,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              color: colors.textPrimary,
              fontFamily: fonts?.semiBold,
            },
          ]}
        >
          Your Gate
        </Text>
      </View>

      {/* Animated Delivery Rider Pin */}
      <Animated.View
        style={[
          styles.mapOverlayPin,
          {
            top: riderTop,
            left: riderLeft,
          },
        ]}
      >
        {/* Pulsing Radar Ring */}
        <Animated.View
          style={[
            styles.riderRadarRing,
            {
              borderColor: colors.primary,
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.6],
                outputRange: [0.6, 0],
              }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Motorcycle Rider Icon Circle */}
        <View
          style={[
            styles.riderPinCircle,
            {
              backgroundColor: colors.primary,
              borderColor: colors.onPrimary,
            },
            shadows.float,
          ]}
        >
          <Ionicons name="bicycle" size={22} color={colors.onPrimary} />
        </View>
      </Animated.View>

      {/* Floating Speedometer Badge */}
      <View
        style={[
          styles.mapSpeedBadge,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
          shadows.soft,
        ]}
      >
        <Ionicons name="speedometer-outline" size={14} color={colors.primary} style={{ marginRight: 5 }} />
        <Text
          style={[
            typography.caption,
            {
              color: colors.textPrimary,
              fontWeight: '700',
              fontFamily: fonts?.semiBold,
            },
          ]}
        >
          {speed > 0 ? `${speed} km/h • En Route` : 'At Restaurant Bay'}
        </Text>
      </View>

      {/* Recenter Button */}
      <TouchableOpacity
        onPress={() => setIsZoomed(!isZoomed)}
        activeOpacity={0.8}
        style={[
          styles.mapRecenterBtn,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
          shadows.soft,
        ]}
      >
        <Ionicons
          name={isZoomed ? 'contract-outline' : 'locate-outline'}
          size={18}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* OpenStreetMap Community Tag */}
      <Text style={[styles.mapOsmTag, { color: colors.mutedText }]}>
        Map vector layer © OpenStreetMap contributors
      </Text>
    </View>
  );
}
