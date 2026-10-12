import React from 'react';
import { Switch as RNSwitch, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function Switch({
  value = false,
  onValueChange,
  disabled = false,
  style,
  accessibilityLabel,
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, style]}>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.disabled,
          true: colors.primary,
        }}
        thumbColor={colors.onPrimary}
        ios_backgroundColor={colors.disabled}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
