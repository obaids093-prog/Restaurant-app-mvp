import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import { styles, getOrderStatusStyles } from './managerStyles';

export default function OrderItemCard({
  order,
  colors,
  typography,
  radius,
  shadows,
  onUpdateStatus,
  onCancelOrder,
}) {
  const isPending = order.status === 'Pending';
  const isPrep = order.status === 'Preparing';
  const isReady = order.status === 'Ready';
  const isServed = order.status === 'Served' || order.status === 'Delivered';
  const isCancelled = order.status === 'Cancelled';

  const { bg: statusBg, color: statusColor } = getOrderStatusStyles(order.status, colors);
  const orderTotal = Number(order.total ?? order.totalAmount ?? order.grandTotal ?? 0);

  const isIslamabad = String(order.branchCity || order.branchName || '').toLowerCase().includes('islamabad');

  return (
    <View
      style={[
        styles.cardItem,
        { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
        shadows.soft,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={[typography.headingSm, { color: colors.primary, fontSize: 15, fontWeight: '800' }]}>
              {order.id ? `#${String(order.id).slice(-6).toUpperCase()}` : '#ORD-LIVE'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[typography.caption, { color: statusColor, fontWeight: '700', fontSize: 11 }]}>
                {order.status || 'Pending'}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: isIslamabad ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: isIslamabad ? '#3B82F6' : '#EF4444',
                  fontWeight: '700',
                  fontSize: 11,
                }}
              >
                📍 {order.branchCity || (isIslamabad ? 'Islamabad' : 'Lahore')}
              </Text>
            </View>
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', marginTop: 2 }]}>
            Guest: {order.customerName || 'Valued Guest'}
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
            {order.type === 'Dine-in'
              ? `Dine-in • ${order.tableNumber || 'Table A-01'}`
              : `Takeaway • ${order.pickupTime || 'In 25 minutes'}`}
          </Text>
        </View>

        <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '800' }]}>
          {brand.formatPrice(orderTotal)}
        </Text>
      </View>

      {/* Items list */}
      <View
        style={[
          styles.itemsListContainer,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button },
        ]}
      >
        {(order.items || []).map((item, idx) => (
          <View key={item.id || item._id || idx} style={styles.itemRow}>
            <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '600', flex: 1 }]}>
              {item.quantity || 1}x {item.name}
            </Text>
            {item.note ? (
              <Text style={[typography.caption, { color: colors.mutedText, fontStyle: 'italic', fontSize: 11 }]}>
                "{item.note}"
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Order Progression Actions */}
      <View style={styles.cardActionsRow}>
        {isPending && (
          <TouchableOpacity
            onPress={() => onUpdateStatus(order.id || order._id, 'Preparing')}
            style={[styles.progressionBtn, { backgroundColor: colors.pending, borderRadius: radius.button }]}
            activeOpacity={0.8}
          >
            <Ionicons name="flame" size={14} color="#FFFFFF" />
            <Text style={[typography.caption, styles.progressionBtnText]}>Start Cooking</Text>
          </TouchableOpacity>
        )}

        {isPrep && (
          <TouchableOpacity
            onPress={() => onUpdateStatus(order.id || order._id, 'Ready')}
            style={[styles.progressionBtn, { backgroundColor: colors.preparing, borderRadius: radius.button }]}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            <Text style={[typography.caption, styles.progressionBtnText]}>Mark Ready</Text>
          </TouchableOpacity>
        )}

        {isReady && (
          <TouchableOpacity
            onPress={() => onUpdateStatus(order.id || order._id, 'Served')}
            style={[styles.progressionBtn, { backgroundColor: colors.ready, borderRadius: radius.button }]}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
            <Text style={[typography.caption, styles.progressionBtnText]}>Mark Served</Text>
          </TouchableOpacity>
        )}

        {!isServed && !isCancelled && (
          <TouchableOpacity
            onPress={() => onCancelOrder(order.id || order._id)}
            style={[
              styles.cancelOrderBtn,
              { backgroundColor: colors.cancelledTint, borderColor: colors.cancelled + '40', borderRadius: radius.button },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={14} color={colors.cancelled} />
            <Text style={[typography.caption, { color: colors.cancelled, fontWeight: '700', fontSize: 12 }]}>
              Cancel Order
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
