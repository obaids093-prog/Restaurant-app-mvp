import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MenuItemCard from './MenuItemCard';
import { styles } from './managerStyles';

export default function MenuStockTab({
  menuItems,
  colors,
  typography,
  radius,
  shadows,
  editingPriceId,
  setEditingPriceId,
  tempPrice,
  setTempPrice,
  handleSavePrice,
  toggleAvailability,
  handleOpenEditDish,
  setShowAddDishModal,
}) {
  return (
    <View style={styles.tabContentBlock}>
      <View style={styles.sectionTitleRow}>
        <View>
          <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
            Menu Catalog ({menuItems.length})
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
            Live prices and stock availability
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddDishModal(true)}
          style={[styles.addDishBtn, { backgroundColor: colors.primary, borderRadius: radius.button }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={[typography.caption, { color: colors.onPrimary, fontWeight: '700' }]}>
            Add Dish
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 12 }}>
        {menuItems.map((dish) => (
          <MenuItemCard
            key={dish.id || dish._id}
            item={dish}
            colors={colors}
            typography={typography}
            radius={radius}
            shadows={shadows}
            isEditing={editingPriceId === (dish.id || dish._id)}
            tempPrice={tempPrice}
            setTempPrice={setTempPrice}
            onStartEdit={(id, price) => {
              setEditingPriceId(id);
              setTempPrice(String(price));
            }}
            onSavePrice={handleSavePrice}
            onCancelEdit={() => {
              setEditingPriceId(null);
              setTempPrice('');
            }}
            onToggleAvailability={toggleAvailability}
            onOpenEditDishModal={handleOpenEditDish}
          />
        ))}
      </View>
    </View>
  );
}
