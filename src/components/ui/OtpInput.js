import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function OtpInput({
  code = '',
  length = 4,
  onCodeChange,
  style,
}) {
  const { colors, typography, radius } = useTheme();
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = code.split('').slice(0, length);

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Hidden input catching keystrokes */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(val) => {
          const clean = val.replace(/[^0-9]/g, '').slice(0, length);
          onCodeChange && onCodeChange(clean);
          if (clean.length === length) {
            Keyboard.dismiss();
          }
        }}
        keyboardType="number-pad"
        maxLength={length}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />

      {/* 4 visible code boxes */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleBoxPress}
        style={styles.boxesRow}
        accessibilityLabel="4-digit verification code"
        accessibilityRole="none"
      >
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isCurrentActive = isFocused && digits.length === index;
          const isFilled = Boolean(digit);

          return (
            <View
              key={index}
              style={[
                styles.codeBox,
                {
                  borderRadius: radius.input,
                  backgroundColor: colors.inputBackground,
                  borderColor: isCurrentActive
                    ? colors.primary
                    : isFilled
                    ? colors.primary
                    : colors.inputBorder,
                },
                (isCurrentActive || isFilled) && {
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  typography.headingLg,
                  styles.digitText,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                {digit}
              </Text>

              {isCurrentActive ? (
                <View
                  style={[
                    styles.cursorLine,
                    { backgroundColor: colors.primary },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 14,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  boxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  codeBox: {
    width: 58,
    height: 64,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  digitText: {
    fontSize: 24,
    fontWeight: '700',
  },
  cursorLine: {
    position: 'absolute',
    bottom: 12,
    width: 18,
    height: 2.5,
    borderRadius: 2,
  },
});
