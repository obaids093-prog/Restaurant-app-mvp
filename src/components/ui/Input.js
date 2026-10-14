import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  rightAction,
  style,
  inputStyle,
  editable = true,
  maxLength,
  accessibilityLabel,
}) {
  const { colors, typography, radius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Animated focus border and glow (200ms with useNativeDriver)
  const focusOpacity = useRef(new Animated.Value(0)).current;

  // Animated inline error fade-in (200ms with useNativeDriver)
  const errorOpacity = useRef(new Animated.Value(error ? 1 : 0)).current;

  useEffect(() => {
    if (error) {
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      errorOpacity.setValue(0);
    }
  }, [error, errorOpacity]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const isPassword = secureTextEntry;
  const isInputSecure = isPassword && !isPasswordVisible;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text
          style={[
            typography.caption,
            styles.label,
            { color: colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBackground,
            borderRadius: radius.input,
            borderColor: error ? colors.error : colors.inputBorder,
          },
          multiline && { minHeight: 88, alignItems: 'flex-start' },
        ]}
      >
        {/* Soft Glow & Primary Focus Border Overlay (200ms transition) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.focusGlowOverlay,
            {
              borderRadius: radius.input,
              borderColor: error ? colors.error : colors.inputFocusBorder,
              shadowColor: error ? colors.error : colors.primary,
              opacity: error ? 0 : focusOpacity,
            },
          ]}
        />

        {icon ? <View style={styles.leftIcon}>{icon}</View> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isInputSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={accessibilityLabel || label || placeholder}
          style={[
            typography.body,
            styles.textInput,
            { color: colors.textPrimary },
            multiline && { textAlignVertical: 'top', paddingTop: 10 },
            inputStyle,
          ]}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightAction}
            activeOpacity={0.7}
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            accessibilityRole="button"
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.mutedText}
            />
          </TouchableOpacity>
        ) : rightAction ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : null}
      </View>

      {/* Inline error message with smooth 200ms fade-in */}
      {error ? (
        <Animated.View
          style={[
            styles.errorRow,
            {
              opacity: errorOpacity,
              transform: [
                {
                  translateY: errorOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={14}
            color={colors.error}
            style={styles.errorIcon}
          />
          <Text
            style={[
              typography.caption,
              { color: colors.error, fontWeight: '500' },
            ]}
          >
            {error}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  focusGlowOverlay: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderWidth: 1.8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    zIndex: 1,
  },
  leftIcon: {
    marginRight: 10,
    zIndex: 1,
  },
  rightAction: {
    marginLeft: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorIcon: {
    marginRight: 4,
  },
});
