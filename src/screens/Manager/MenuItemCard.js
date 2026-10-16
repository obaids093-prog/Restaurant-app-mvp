import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import { styles } from './managerStyles';

export default function MenuItemCard({
  item,
  colors,
  typography,
  radius,
  shadows,
  isEditing,
  tempPrice,
  setTempPrice,
  onStartEdit,
  onSavePrice,
  onCancelEdit,
  onToggleAvailability,
  onOpenEditDishModal,
}) {
  return (
    <View
      style={[
        styles.cardItem,
        { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
        shadows.soft,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 15, flexShrink: 1 }]}>
              {item.name}
            </Text>
            {onOpenEditDishModal && (
              <TouchableOpacity
                onPress={() => onOpenEditDishModal(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ padding: 2 }}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11, marginTop: 2 }]}>
            Category: {item.category} • {item.description ? item.description.slice(0, 45) + '...' : 'Chef creation'}
          </Text>
        </View>

        <View style={styles.availToggleBox}>
          <Text
            style={[
              typography.caption,
              { color: item.isAvailable ? colors.ready : colors.cancelled, fontWeight: '700', fontSize: 11 },
            ]}
          >
            {item.isAvailable ? 'In Stock' : 'Sold Out'}
          </Text>
          <Switch
            value={item.isAvailable !== false}
            onValueChange={() => onToggleAvailability(item.id || item._id)}
            trackColor={{ false: '#D1C4B8', true: colors.ready }}
          />
        </View>
      </View>

      <View style={styles.menuPriceRow}>
        {isEditing ? (
          <View style={styles.priceEditContainer}>
            <TextInput
              style={[
                styles.priceInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                  color: colors.textPrimary,
                  borderRadius: radius.button,
                },
              ]}
              value={tempPrice}
              onChangeText={setTempPrice}
              keyboardType="numeric"
              placeholder="New Price"
              placeholderTextColor={colors.mutedText}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => onSavePrice(item.id || item._id)}
              style={[styles.savePriceBtn, { backgroundColor: colors.primary, borderRadius: radius.button }]}
            >
              <Text style={[typography.caption, { color: colors.onPrimary, fontWeight: '700' }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancelEdit} style={styles.cancelPriceBtn}>
              <Text style={[typography.caption, { color: colors.mutedText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.priceDisplayContainer}>
            <Text style={[typography.headingSm, { color: colors.primary, fontWeight: '800', fontSize: 16 }]}>
              {brand.formatPrice(item.price)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => onStartEdit(item.id || item._id, item.price)}
                style={[
                  styles.editPriceBtn,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="pricetag-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>Price</Text>
              </TouchableOpacity>
              {onOpenEditDishModal && (
                <TouchableOpacity
                  onPress={() => onOpenEditDishModal(item)}
                  style={[
                    styles.editPriceBtn,
                    { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40', borderRadius: radius.button },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>Edit Dish</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
