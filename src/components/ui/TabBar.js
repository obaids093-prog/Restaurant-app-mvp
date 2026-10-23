import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../utils/SafeLinearGradient';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

export default function TabBar({ state, descriptors, navigation }) {
  const { colors, typography, isDark } = useTheme();
  const { totalItemCount } = useCart();
  const insets = useSafeAreaInsets();

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(totalItemCount);

  // 200ms bounce on badge and button when item added
  useEffect(() => {
    if (totalItemCount > prevCountRef.current) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.25,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCountRef.current = totalItemCount;
  }, [totalItemCount, bounceAnim]);

  const TAB_ICONS = {
    Menu: { active: 'restaurant', inactive: 'restaurant-outline' },
    Reservations: { active: 'calendar', inactive: 'calendar-outline' },
    Cart: { active: 'bag-handle', inactive: 'bag-handle-outline' },
    TrackTab: { active: 'receipt', inactive: 'receipt-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
  };

  const TAB_LABELS = {
    Menu: 'Menu',
    Reservations: 'Reserve',
    Cart: 'Tray',
    TrackTab: 'Track',
    Profile: 'Profile',
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom, 8),
        },
        !isDark && [styles.barShadow, { shadowColor: colors.shadowColor }],
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const routeName = route.name;
        const isCenterTray = routeName === 'Cart';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconConfig = TAB_ICONS[routeName] || {
          active: 'apps',
          inactive: 'apps-outline',
        };
        const label = TAB_LABELS[routeName] || routeName;

        if (isCenterTray) {
          return (
            <View key={route.key} style={styles.centerButtonSlot}>
              <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.88}
                style={styles.centerButtonTouchArea}
                accessibilityRole="button"
                accessibilityLabel="Cart, raised center action"
                accessibilityState={{ selected: isFocused }}
              >
                <Animated.View
                  style={[
                    styles.raisedButtonWrapper,
                    { transform: [{ scale: bounceAnim }] },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryPressed]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.raisedGradient}
                  >
                    <Ionicons
                      name={iconConfig.active}
                      size={24}
                      color={colors.onPrimary}
                    />

                    {totalItemCount > 0 ? (
                      <Animated.View
                        style={[
                          styles.raisedBadge,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.primary,
                            transform: [{ scale: bounceAnim }],
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: colors.primary },
                          ]}
                        >
                          {totalItemCount > 99 ? '99+' : totalItemCount}
                        </Text>
                      </Animated.View>
                    ) : null}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
              <Text
                style={[
                  typography.caption,
                  styles.centerLabel,
                  {
                    color: isFocused ? colors.primary : colors.mutedText,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.regularTab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={`${label} Tab`}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={isFocused ? iconConfig.active : iconConfig.inactive}
                size={22}
                color={isFocused ? colors.primary : colors.mutedText}
              />
            </View>
            <Text
              style={[
                typography.caption,
                styles.tabLabel,
                {
                  color: isFocused ? colors.primary : colors.mutedText,
                  fontWeight: isFocused ? '700' : '500',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    position: 'relative',
    zIndex: 100,
  },
  barShadow: {
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  regularTab: {
    flex: 1,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  iconWrapper: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  centerButtonSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerButtonTouchArea: {
    top: -16,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  raisedButtonWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  raisedGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(252, 88, 52, 0.45)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  raisedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  centerLabel: {
    position: 'absolute',
    bottom: 4,
    fontSize: 11,
    lineHeight: 14,
  },
});
