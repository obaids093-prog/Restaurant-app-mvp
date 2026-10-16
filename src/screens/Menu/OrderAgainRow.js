import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './menuStyles';

export default function OrderAgainRow({
  pastOrders = [],
  selectedCategory = 'All',
  searchQuery = '',
  onReorder,
  colors,
  fonts,
  shadows,
}) {
  if (pastOrders.length === 0 || selectedCategory !== 'All' || searchQuery) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithBadge}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textPrimary, fontFamily: fonts.bold },
            ]}
          >
            Order Again
          </Text>
          <View
            style={[
              styles.sectionCounterBadge,
              { backgroundColor: colors.primaryTint },
            ]}
          >
            <Text
              style={[
                styles.sectionCounterText,
                { color: colors.primary, fontFamily: fonts.semiBold },
              ]}
            >
              {pastOrders.length} Past
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {pastOrders.slice(0, 5).map((order) => {
          const itemCount =
            order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;
          const itemNames = (order.items || [])
            .map((i) => i.name)
            .filter(Boolean)
            .join(' • ');

          return (
            <View
              key={order.id || order._id}
              style={[
                styles.orderAgainCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.subtleBorder,
                },
                shadows.cardLight,
              ]}
            >
              <View style={styles.orderAgainHeader}>
                <Text
                  style={[
                    styles.orderAgainDate,
                    { color: colors.mutedText, fontFamily: fonts.medium },
                  ]}
                >
                  Order #{String(order.id || order._id).slice(-5)}
                </Text>
                <Text
                  style={[
                    styles.orderAgainAmount,
                    { color: colors.primary, fontFamily: fonts.bold },
                  ]}
                >
                  Rs. {(order.total || 0).toLocaleString()}
                </Text>
              </View>

              <Text
                style={[
                  styles.orderAgainItems,
                  { color: colors.textPrimary, fontFamily: fonts.regular },
                ]}
                numberOfLines={2}
              >
                {itemNames || `${itemCount} items selection`}
              </Text>

              <TouchableOpacity
                onPress={() => onReorder(order)}
                style={[
                  styles.reorderBtn,
                  { backgroundColor: colors.primary },
                ]}
                activeOpacity={0.85}
                accessibilityLabel="Re-add order items to tray"
              >
                <Ionicons
                  name="repeat"
                  size={14}
                  color={colors.onPrimary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.reorderBtnText,
                    { color: colors.onPrimary, fontFamily: fonts.semiBold },
                  ]}
                >
                  Reorder ({itemCount})
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
