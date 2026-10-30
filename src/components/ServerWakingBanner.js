import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeServerWaking } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export function ServerWakingBanner() {
  const insets = useSafeAreaInsets();
  const { colors, fonts } = useTheme();
  const [isWaking, setIsWaking] = useState(false);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribeServerWaking((waking) => {
      setIsWaking(waking);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isWaking) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top + 6,
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
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isWaking, insets.top, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents={isWaking ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.surfaceSubtle || colors.surface,
          borderColor: colors.borderSubtle || colors.subtleBorder,
        },
      ]}
    >
      <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
      <Text
        style={[
          styles.text,
          {
            color: colors.textPrimary,
            fontFamily: fonts ? fonts.medium : undefined,
          },
        ]}
      >
        Waking up the server, please wait...
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  spinner: {
    marginRight: 10,
  },
  text: {
    fontSize: 13,
  },
});

export default ServerWakingBanner;
