import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBranch } from '../../context/BranchContext';

export default function BranchChip({ style, compact = false }) {
  const { colors, typography } = useTheme();
  const { activeBranch, isMultiBranch, openBranchModal } = useBranch();

  if (!activeBranch) return null;

  const content = (
    <View
      style={[
        styles.chipContainer,
        {
          backgroundColor: colors.surfaceSubtle,
          borderColor: colors.cardBorder,
        },
        compact && styles.compactChip,
        style,
      ]}
    >
      <Ionicons name="location-sharp" size={compact ? 12 : 14} color={colors.primary} />
      <Text
        style={[
          typography.caption,
          styles.chipText,
          { color: colors.textPrimary },
          compact && styles.compactText,
        ]}
        numberOfLines={1}
      >
        {activeBranch.city} • {activeBranch.area}
      </Text>
      {isMultiBranch && (
        <Ionicons
          name="chevron-down"
          size={compact ? 11 : 13}
          color={colors.primary}
          style={{ marginLeft: 3 }}
        />
      )}
    </View>
  );

  if (isMultiBranch) {
    return (
      <TouchableOpacity
        onPress={openBranchModal}
        activeOpacity={0.75}
        accessibilityLabel={`Change branch, currently ${activeBranch.city} ${activeBranch.area}`}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  compactChip: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 16,
    gap: 3,
  },
  chipText: {
    fontWeight: '700',
    fontSize: 12,
  },
  compactText: {
    fontSize: 11,
  },
});
