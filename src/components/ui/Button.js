import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../utils/SafeLinearGradient';
import { useTheme } from '../../context/ThemeContext';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'text' | 'secondary'
  size = 'large', // 'large' | 'medium' | 'small'
  disabled = false,
  loading = false,
  success = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
  accessibilityLabel,
}) {
  const { colors, typography, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Shimmer loop for loading state
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop = null;
    if (loading) {
      shimmerAnim.setValue(0);
      loop = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      loop.start();
    } else {
      shimmerAnim.setValue(0);
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [loading, shimmerAnim]);

  const handlePressIn = () => {
    if (disabled || loading || success) return;
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading || success) return;
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const minHeight = size === 'small' ? 44 : size === 'medium' ? 48 : 54;
  const isBoldWhiteAllowed = variant === 'primary' && minHeight >= 44;

  const renderContent = () => (
    <View style={styles.contentRow}>
      {success ? (
        <View style={styles.successRow}>
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={variant === 'primary' ? colors.onPrimary : colors.success}
            style={styles.successIcon}
          />
          <Text
            style={[
              typography.button,
              {
                color: variant === 'primary' ? colors.onPrimary : colors.success,
                fontWeight: '700',
              },
              textStyle,
            ]}
          >
            Success
          </Text>
        </View>
      ) : loading ? (
        <>
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? colors.onPrimary : colors.primary}
            style={styles.loader}
          />
          <Text
            style={[
              typography.button,
              {
                color: variant === 'primary' ? colors.onPrimary : colors.primary,
                fontWeight: '600',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <View style={styles.iconLeft}>{icon}</View>
          ) : null}
          <Text
            style={[
              typography.button,
              {
                color: disabled
                  ? colors.mutedText
                  : variant === 'primary'
                  ? colors.onPrimary
                  : colors.primary,
                fontWeight: isBoldWhiteAllowed ? '600' : '600',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' ? (
            <View style={styles.iconRight}>{icon}</View>
          ) : null}
        </>
      )}
    </View>
  );

  const buttonShapeStyle = [
    styles.baseButton,
    {
      borderRadius: radius.button,
      minHeight,
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.6 : 1,
      overflow: 'hidden',
    },
    variant === 'outline' && {
      borderWidth: 1.5,
      borderColor: disabled ? colors.disabled : colors.primary,
      backgroundColor: 'transparent',
    },
    variant === 'secondary' && {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.subtleBorder,
    },
    variant === 'text' && {
      backgroundColor: 'transparent',
    },
    style,
  ];

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 360],
  });

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : 'auto' },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading || success}
        activeOpacity={0.88}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled || loading || success) }}
        style={variant === 'primary' && !disabled ? undefined : buttonShapeStyle}
      >
        {variant === 'primary' && !disabled ? (
          <LinearGradient
            colors={
              success
                ? [colors.success, colors.success]
                : [colors.primary, colors.primaryPressed]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[buttonShapeStyle, styles.gradientShadow]}
          >
            {/* Loading Shimmer Bar */}
            {loading && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shimmerBar,
                  {
                    transform: [{ translateX: shimmerTranslateX }, { skewX: '-22deg' }],
                  },
                ]}
              />
            )}
            {renderContent()}
          </LinearGradient>
        ) : (
          renderContent()
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    position: 'relative',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginRight: 6,
  },
  gradientShadow: {
    shadowColor: 'rgba(252, 88, 52, 0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  shimmerBar: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    zIndex: 1,
  },
  loader: {
    marginRight: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
