import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import { styles } from './trackingStyles';

function getStatusBadgeConfig(status, primaryColor, primaryTint) {
  if (status === 'Served' || status === 'Delivered') {
    return {
      bg: '#22c55e18',
      border: '#22c55e44',
      color: '#22c55e',
      icon: 'checkmark-circle',
    };
  }
  if (status === 'Cancelled') {
    return {
      bg: '#ef444418',
      border: '#ef444444',
      color: '#ef4444',
      icon: 'close-circle',
    };
  }
  return {
    bg: primaryTint,
    border: primaryColor + '44',
    color: primaryColor,
    icon: 'time',
  };
}

function ReceiptBreakdown({ order, colors, typography }) {
  const items = order.items || [];
  const rSubtotal = order.subtotal !== undefined
    ? order.subtotal
    : items.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 1)), 0);
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
      {items.map((it, i) => (
        <View key={it.id || it._id || it.menuItem || `${it.name}-${i}`} style={styles.expandedRow}>
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
}

export default function PastOrderCard({
  order,
  isExpanded,
  onToggleReceipt,
  onReorder,
  onCancelOrder,
  onRateOrder,
  colors,
  shadows,
  typography,
}) {
  const isPending = order.status === 'Pending';
  const isServed = order.status === 'Served';
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent';

  const orderTicket = String(order.id || order._id).slice(-4).toUpperCase();
  const badgeConfig = getStatusBadgeConfig(order.status, colors.primary, colors.primaryTint);

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
              backgroundColor: badgeConfig.bg,
              borderColor: badgeConfig.border,
            },
          ]}
        >
          <Ionicons
            name={badgeConfig.icon}
            size={13}
            color={badgeConfig.color}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.folioStatusText, { color: badgeConfig.color }]}>
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
      {isExpanded && order.items && (
        <ReceiptBreakdown
          order={order}
          colors={colors}
          typography={typography}
        />
      )}

      {/* Action Footer Buttons */}
      <View style={styles.folioActionRow}>
        {/* Rate Dishes button if Served */}
        {isServed && onRateOrder && (
          <TouchableOpacity
            onPress={() => onRateOrder(order)}
            style={[
              styles.reorderBtn,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.secondary + '60' },
            ]}
            activeOpacity={0.8}
            accessibilityLabel="Rate dishes in this order"
          >
            <Ionicons name="star" size={15} color={colors.secondary} style={{ marginRight: 6 }} />
            <Text style={[styles.reorderBtnText, { color: colors.textPrimary }]}>
              Rate Dishes
            </Text>
          </TouchableOpacity>
        )}

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
