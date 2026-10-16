import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '../../utils/SafeLinearGradient';
import { styles } from './loginStyles';

export default function BrandCanopy({
  insets,
  isDark,
  themeRotateAnim,
  toggleTheme,
  orbitSpin,
  emblemPulseAnim,
}) {
  return (
    <SafeLinearGradient
      colors={
        isDark
          ? ['#261510', '#1C0E0A', '#130805']
          : ['#FC5834', '#EB4F2B', '#D43C19']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.canopyContainer,
        {
          paddingTop: Math.max(insets.top, 16) + 10,
        },
      ]}
    >
      {/* Ambient Decorative Blurs & Concentric Arches */}
      <View
        style={[
          styles.ambientOrb1,
          {
            backgroundColor: isDark
              ? 'rgba(252, 88, 52, 0.16)'
              : 'rgba(255, 255, 255, 0.16)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrb2,
          {
            backgroundColor: isDark
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(255, 255, 255, 0.10)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientArchRing,
          {
            borderColor: isDark
              ? 'rgba(245, 158, 11, 0.14)'
              : 'rgba(255, 255, 255, 0.12)',
          },
        ]}
      />

      {/* Top Utility Bar with Glassmorphic Artisan Guild & Theme Toggle */}
      <View style={styles.topUtilityRow}>
        <View style={styles.glassBadge}>
          <Ionicons
            name="sparkles"
            size={11}
            color={isDark ? '#F59E0B' : '#FFF3B0'}
          />
          <Text style={styles.glassBadgeText}>ARTISAN KITCHEN</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            const nextVal = isDark ? 0 : 1;
            Animated.timing(themeRotateAnim, {
              toValue: nextVal,
              duration: 250,
              useNativeDriver: true,
            }).start();
            toggleTheme();
          }}
          style={styles.themeToggleGlassBtn}
          accessibilityLabel="Toggle Theme"
          activeOpacity={0.7}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: themeRotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={17}
              color={isDark ? '#F59E0B' : '#FFFFFF'}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Center Artisan Emblem with Orbit Compass Ring */}
      <View style={styles.emblemContainer}>
        <Animated.View
          style={[
            styles.orbitRing,
            {
              borderColor: isDark
                ? 'rgba(245, 158, 11, 0.32)'
                : 'rgba(255, 255, 255, 0.38)',
              transform: [{ rotate: orbitSpin }],
            },
          ]}
        >
          <Text
            style={[
              styles.orbitDiamond,
              { top: -7, color: isDark ? '#F59E0B' : '#FFFFFF' },
            ]}
          >
            ✦
          </Text>
          <Text
            style={[
              styles.orbitDiamond,
              { bottom: -7, color: isDark ? '#F59E0B' : '#FFFFFF' },
            ]}
          >
            ✦
          </Text>
          <Text
            style={[
              styles.orbitDiamond,
              { left: -7, color: isDark ? '#F59E0B' : '#FFFFFF' },
            ]}
          >
            ✦
          </Text>
          <Text
            style={[
              styles.orbitDiamond,
              { right: -7, color: isDark ? '#F59E0B' : '#FFFFFF' },
            ]}
          >
            ✦
          </Text>
        </Animated.View>

        {/* Glowing Squircle Center Emblem */}
        <Animated.View
          style={[
            styles.emblemSquircle,
            {
              backgroundColor: isDark ? '#23130F' : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(252, 88, 52, 0.35)'
                : 'rgba(255, 255, 255, 0.8)',
              transform: [{ scale: emblemPulseAnim }],
            },
          ]}
        >
          <Ionicons
            name="restaurant"
            size={26}
            color={isDark ? '#FF6B4A' : '#FC5834'}
          />
        </Animated.View>
      </View>

      {/* Brand Title & Refined Subtitle Lockup */}
      <View style={styles.brandTitleBlock}>
        <Text style={styles.brandTitleText}>A U R A</Text>
        <View style={styles.taglineDividerRow}>
          <View style={styles.taglineDividerLine} />
          <Text style={styles.brandSubtitleText}>
            ARTISAN KITCHEN & FINE DINING
          </Text>
          <View style={styles.taglineDividerLine} />
        </View>
      </View>
    </SafeLinearGradient>
  );
}
