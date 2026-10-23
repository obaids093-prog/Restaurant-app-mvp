import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, CATEGORY_ICONS } from './menuStyles';

export default function CategoryRow({
  categories = CATEGORIES,
  selectedCategory = 'All',
  onSelectCategory,
  categoryIcons = CATEGORY_ICONS,
  colors,
  fonts,
  radius,
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const iconName = categoryIcons[cat] || 'restaurant';

          return (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.8}
              onPress={() => onSelectCategory(cat)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.subtleBorder,
                  borderRadius: radius?.full || 20,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Category ${cat}`}
            >
              <Ionicons
                name={iconName}
                size={16}
                color={isActive ? '#FFFFFF' : colors.textPrimary}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: isActive ? '#FFFFFF' : colors.textPrimary,
                    fontFamily: isActive ? fonts.bold : fonts.medium,
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 40,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 13,
  },
});
