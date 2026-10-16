import React from 'react';
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryChip } from '../../components/ui';
import { styles, CATEGORIES, CATEGORY_ICONS } from './menuStyles';

export default function CategoryRow({
  categories = CATEGORIES,
  selectedCategory = 'All',
  onSelectCategory,
  categoryIcons = CATEGORY_ICONS,
  colors,
}) {
  return (
    <View style={styles.categorySection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <CategoryChip
              key={cat}
              label={cat}
              active={isActive}
              onPress={() => onSelectCategory(cat)}
              icon={
                <Ionicons
                  name={categoryIcons[cat] || 'restaurant'}
                  size={22}
                  color={isActive ? colors.onPrimary : colors.mutedText}
                />
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
