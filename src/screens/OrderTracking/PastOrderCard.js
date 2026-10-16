import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import { styles } from './trackingStyles';

export default function PastOrderCard({
  order,
  isExpanded,
  onToggleReceipt,
  onReorder,
  onCancelOrder,
  colors,
  shadows,
  typography,
}) {
  const isServed = order.status === 'Served' || order.status === 'Delivered';
  const isCancelled = order.status === 'Cancelled';
  const isPending = order.status === 'Pending';
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent';

  const orderTicket = String(order.id || order._id).slice(-4).toUpperCase();

  return (
    <View
      style={[
        styles.folioCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      {/* Card Header Row */}
      <View style={styles.folioHeaderRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '800' }]}>
              Folio #AK-{orderTicket}
            </Text>
            <View style={[styles.folioTypeBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.folioTypeBadgeText, { color: colors.textSecondary }]}>
                {order.type || 'Dine-In'}
              </Text>
            </View>
          </View>
          <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}>
            {formattedDate} • {order.tableNumber || 'Atrium'}
          </Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.folioStatusBadge,
            {
              backgroundColor: isServed
                ? '#22c55e18'
                : isCancelled
                ? '#ef444418'
                : colors.primaryTint,
              borderColor: isServed
                ? '#22c55e44'
                : isCancelled
                ? '#ef444444'
                : colors.primary + '44',
            },
          ]}
        >
          <Ionicons
            name={isServed ? 'checkmark-circle' : isCancelled ? 'close-circle' : 'time'}
            size={13}
            color={isServed ? '#22c55e' : isCancelled ? '#ef4444' : colors.primary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.folioStatusText,
              { color: isServed ? '#22c55e' : isCancelled ? '#ef4444' : colors.primary },
            ]}
          >
            {order.status}
          </Text>
        </View>
      </View>

      {/* Dish Preview Row */}
      {order.items && order.items.length > 0 && (
        <View
          style={[
            styles.dishPreviewTile,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.dishPreviewThumb, { backgroundColor: colors.primaryTint }]}>
            <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}
              numberOfLines={1}
            >
              {order.items.map((i) => i.name).join(' • ')}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {order.items.length} Course(s) • Total: {brand.formatPrice(order.totalPrice || order.total || 0)}
            </Text>
          </View>
          <Text style={[typography.price, { color: colors.primary, fontWeight: '800' }]}>
            {brand.formatPrice(order.totalPrice || order.total || 0)}
          </Text>
        </View>
      )}

      {/* Expanded Receipt Breakdown (if toggled) */}
      {isExpanded && order.items && (() => {
        const rSubtotal = order.subtotal !== undefined
          ? order.subtotal
          : order.items.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 1)), 0);
        const rDiscount = order.discountAmount || 0;
        const rDiscounted = Math.max(0, rSubtotal - rDiscount);
        const rService = order.serviceCharge !== undefined ? order.serviceCharge : (rDiscounted * 0.05);
        const rTax = order.salesTax !== undefined ? order.salesTax : (rDiscounted * 0.15);
        const rTotal = order.totalAmount !== undefined
          ? order.totalAmount
          : (order.totalPrice || order.total || (rDiscounted + rService + rTax));

        return (
          <View style={[styles.expandedReceipt, { borderTopColor: colors.surfaceBorder }]}>
            <Text style={[typography.caption, { color: colors.mutedText, textTransform: 'uppercase', marginBottom: 6 }]}>
              Course Breakdown
            </Text>
            {order.items.map((it, i) => (
              <View key={i} style={styles.expandedRow}>
                <Text style={[typography.caption, { color: colors.textPrimary, flex: 1 }]}>
                  {it.quantity || 1}x {it.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {brand.formatPrice(Number(it.price || 0) * (it.quantity || 1))}
                </Text>
              </View>
            ))}
            <View style={[styles.receiptDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.expandedRow}>
              <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>Subtotal</Text>
              <Text style={[typography.caption, { color: colors.textPrimary }]}>{brand.formatPrice(rSubtotal)}</Text>
            </View>
            {rDiscount > 0 && (
              <View style={styles.expandedRow}>
                <Text style={[typography.caption, { color: colors.success || '#10B981', flex: 1 }]}>Promo Discount</Text>
                <Text style={[typography.caption, { color: colors.success || '#10B981' }]}>-{brand.formatPrice(rDiscount)}</Text>
              </View>
            )}
            <View style={styles.expandedRow}>
              <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>Service Charge (5%)</Text>
              <Text style={[typography.caption, { color: colors.textPrimary }]}>{brand.formatPrice(rService)}</Text>
            </View>
            <View style={styles.expandedRow}>
              <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>Sales Tax (15%)</Text>
              <Text style={[typography.caption, { color: colors.textPrimary }]}>{brand.formatPrice(rTax)}</Text>
            </View>
            <View style={[styles.receiptDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.expandedRow}>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', flex: 1 }]}>Total</Text>
              <Text style={[typography.body, { color: colors.primary, fontWeight: '800' }]}>{brand.formatPrice(rTotal)}</Text>
            </View>
          </View>
        );
      })()}

      {/* Action Footer Buttons */}
      <View style={styles.folioActionRow}>
        {/* Reorder Button */}
        <TouchableOpacity
          onPress={() => onReorder(order)}
          style={[
            styles.reorderBtn,
            { backgroundColor: colors.primaryTint, borderColor: colors.primary + '30' },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons name="repeat" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.reorderBtnText, { color: colors.primary }]}>
            Reorder Flavors
          </Text>
        </TouchableOpacity>

        {/* Digital Receipt Toggle */}
        <TouchableOpacity
          onPress={onToggleReceipt}
          style={[
            styles.receiptBtn,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'receipt-outline'}
            size={15}
            color={colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.receiptBtnText, { color: colors.textPrimary }]}>
            {isExpanded ? 'Hide' : 'Digital Receipt'}
          </Text>
        </TouchableOpacity>

        {/* Cancel button if pending */}
        {isPending && (
          <TouchableOpacity
            onPress={() => onCancelOrder(order)}
            style={[styles.cancelSmallBtn, { borderColor: colors.error }]}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={14} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
