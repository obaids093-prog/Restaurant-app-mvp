import React from 'react';
import { View, Text, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import { styles } from './cartStyles';

export default function CartItemCard({
  item,
  unitPrice,
  colors,
  shadows,
  onIncrement,
  onDecrement,
  onConfirmDelete,
  onUpdateNote,
}) {
  return (
    <View
      style={[
        styles.cartCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      <View style={styles.cartCardHeader}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemThumb} />
        ) : (
          <View style={[styles.itemThumbFallback, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="restaurant" size={24} color={colors.primary} />
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemUnitPrice, { color: colors.textSecondary }]}>
            {brand.formatPrice(unitPrice)} each
          </Text>
          <Text style={[styles.itemSubtotal, { color: colors.primary }]}>
            {brand.formatPrice(unitPrice * item.quantity)}
          </Text>
        </View>

        {/* Delete Item Button with 44px min touch target */}
        <TouchableOpacity
          onPress={() => onConfirmDelete(item.id, item.name)}
          style={styles.deleteBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={`Remove ${item.name}`}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Special Instructions Field (per-item notes) */}
      <View
        style={[
          styles.noteInputWrapper,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
        ]}
      >
        <Ionicons name="create-outline" size={15} color={colors.mutedText} />
        <TextInput
          style={[styles.noteInput, { color: colors.textPrimary }]}
          placeholder="Special instructions (e.g., extra spicy, no onions)..."
          placeholderTextColor={colors.mutedText}
          value={item.note || ''}
          onChangeText={(text) => onUpdateNote(item.id, text)}
        />
      </View>

      {/* Quantity Stepper with 44px min tap targets */}
      <View style={styles.stepperRow}>
        <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>
          Course Portions
        </Text>
        <View
          style={[
            styles.stepperBox,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
          ]}
        >
          <TouchableOpacity
            onPress={() => onDecrement(item.id)}
            style={styles.stepBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Decrease quantity"
          >
            <Ionicons name="remove" size={18} color={colors.primary} />
          </TouchableOpacity>

          <Text style={[styles.quantityValue, { color: colors.textPrimary }]}>
            {item.quantity}
          </Text>

          <TouchableOpacity
            onPress={() => onIncrement(item.id)}
            style={styles.stepBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Increase quantity"
          >
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
