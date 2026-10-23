import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotificationContext } from '../context/NotificationContext';
import { navigationRef } from '../navigation/navigationRef';

export function NotificationBannerToast() {
  const insets = useSafeAreaInsets();
  const { colors, typography, fonts, isDark } = useTheme();
  const { activeBannerNotification, dismissBannerNotification } = useNotificationContext();

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const dismissBanner = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissBannerNotification();
    });
  }, [dismissBannerNotification, opacity, translateY]);

  useEffect(() => {
    if (activeBannerNotification) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top + 8,
          useNativeDriver: true,
          damping: 15,
          stiffness: 120,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismissBanner();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-120);
      opacity.setValue(0);
    }
  }, [activeBannerNotification, insets.top, dismissBanner, opacity, translateY]);

  const handlePress = () => {
    dismissBanner();
    if (!navigationRef.isReady()) return;

    const data = activeBannerNotification?.data || {};
    if (data.type === 'order_status' || data.orderId) {
      navigationRef.navigate('TrackTab');
    } else {
      navigationRef.navigate('Notifications');
    }
  };

  if (!activeBannerNotification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: isDark ? colors.surface : colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <TouchableOpacity style={styles.innerContent} activeOpacity={0.85} onPress={handlePress}>
        <View
          style={[styles.iconBadge, { backgroundColor: colors.primaryLight || colors.goldSubtle }]}
        >
          <Ionicons name="notifications" size={18} color={colors.primary} />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, fontFamily: fonts?.semiBold || undefined },
            ]}
            numberOfLines={1}
          >
            {activeBannerNotification.title || 'Notification'}
          </Text>
          <Text
            style={[
              styles.body,
              { color: colors.textSecondary, fontFamily: fonts?.regular || undefined },
            ]}
            numberOfLines={2}
          >
            {activeBannerNotification.body || ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={dismissBanner}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});
