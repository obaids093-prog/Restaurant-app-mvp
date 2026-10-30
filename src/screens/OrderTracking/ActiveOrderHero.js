import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import OrderStepper from '../../components/ui/OrderStepper';
import { styles } from './trackingStyles';

export default function ActiveOrderHero({
  activeOrder,
  elapsedSeconds,
  formatTime,
  canCancel,
  cancelRemaining,
  isCancelling,
  onCancelOrder,
  onTrackRider,
  colors,
  shadows,
  typography,
}) {
  return (
    <View
      style={[
        styles.heroActiveCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.medium3D,
      ]}
    >
      {/* Header: Ticket ID & Status Badge */}
      <View style={styles.heroTopRow}>
        <View>
          <Text style={[typography.caption, { color: colors.mutedText, textTransform: 'uppercase' }]}>
            Active Live Order
          </Text>
          <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '800' }]}>
            #AK-{String(activeOrder.id || activeOrder._id).slice(-4).toUpperCase()}
          </Text>
        </View>

        <View style={[styles.activeStatusPill, { backgroundColor: colors.primaryTint }]}>
          <View style={[styles.pulseLiveDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.activeStatusText, { color: colors.primary }]}>
            {activeOrder.status}
          </Text>
        </View>
      </View>

      {/* Service & Elapsed Timer Tile */}
      <View style={[styles.serviceTimerTile, { backgroundColor: colors.surfaceSubtle }]}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.caption, { color: colors.mutedText }]}>
            Service Allocation
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]} numberOfLines={1}>
            {activeOrder.tableNumber || (activeOrder.type === 'Takeaway' ? 'Takeaway Counter' : 'Table A-01')}
          </Text>
        </View>
        <View style={styles.timerRight}>
          <Ionicons name="timer-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[typography.headingSm, { color: colors.primary, fontWeight: '800' }]}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Order Stepper Component */}
      <View style={styles.stepperWrapper}>
        <OrderStepper currentStatus={activeOrder.status} />
      </View>

      {/* Order Items Preview */}
      {activeOrder.items && activeOrder.items.length > 0 && (
        <View style={[styles.heroItemsList, { borderTopColor: colors.surfaceBorder }]}>
          <Text style={[typography.caption, { color: colors.mutedText, textTransform: 'uppercase', marginBottom: 8 }]}>
            Creations in Preparation ({activeOrder.items.length})
          </Text>
          {activeOrder.items.map((it, idx) => (
            <View key={idx} style={styles.heroItemRow}>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600', flex: 1 }]} numberOfLines={1}>
                {it.quantity || 1}x {it.name}
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, fontWeight: '600' }]}>
                {brand.formatPrice(Number(it.price || 0) * (it.quantity || 1))}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Track Live Rider CTA */}
      {onTrackRider && (
        <TouchableOpacity
          onPress={() => onTrackRider(activeOrder)}
          style={[styles.trackRiderBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.onPrimary} style={{ marginRight: 6 }} />
          <Text style={[styles.trackRiderBtnText, { color: colors.onPrimary }]}>
            Track Live Rider
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.onPrimary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}

      {/* Cancel Button (While Pending) */}
      {canCancel && (
        <TouchableOpacity
          onPress={() => onCancelOrder(activeOrder)}
          disabled={isCancelling}
          style={[styles.cancelBtn, { borderColor: colors.error }]}
          activeOpacity={0.8}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={18} color={colors.error} style={{ marginRight: 6 }} />
              <Text style={[styles.cancelBtnText, { color: colors.error }]}>
                Cancel Order {cancelRemaining !== Infinity ? `(${Math.ceil(cancelRemaining / 60)}m left)` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
