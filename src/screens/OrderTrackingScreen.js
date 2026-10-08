import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import apiClient from '../api/client';
import { useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const STAGES = [
  { key: 'Pending', label: 'Order Received', desc: 'Sent to kitchen display', icon: 'receipt' },
  { key: 'Preparing', label: 'Chef Cooking', desc: 'Crafting fresh signature ingredients', icon: 'flame' },
  { key: 'Ready', label: 'Plated & Ready', desc: 'Food is inspected and garnished', icon: 'restaurant' },
  { key: 'Served', label: 'Delivered / Completed', desc: 'Bon appetit! Savor your culinary feast', icon: 'checkmark-done-circle' },
];

const ACTIVE_STATUSES = ['Pending', 'Preparing', 'Ready'];

// Must match server/config/constants.js CANCEL_WINDOW_MINUTES.
const CANCEL_WINDOW_MINUTES = 10;

export default function OrderTrackingScreen({ route, navigation }) {
  const { colors, isDark, shadows } = useTheme();
  const { user, logout } = useAuth();
  const { orders, cancelOrder, fetchOrders } = useOrders();

  const { orderId } = route.params || {};

  // Active orders (Pending, Preparing, Ready only) sorted by most recent
  const activeOrders = useMemo(() => {
    return (orders || [])
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders]);

  // Pick the specified order if it is currently active, otherwise the most recent active order
  const activeOrder = useMemo(() => {
    if (orderId) {
      const matched = activeOrders.find((o) => o.id === orderId || o._id === orderId);
      if (matched) return matched;
    }
    return activeOrders[0] || null;
  }, [activeOrders, orderId]);

  // Read-only past orders (Cancelled or Served only) sorted by most recent
  const pastOrders = useMemo(() => {
    return (orders || [])
      .filter((o) => ['Served', 'Cancelled'].includes(o.status))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders]);

  // Running elapsed time counter (seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Cancel button loading state
  const [isCancelling, setIsCancelling] = useState(false);

  // Animation for active step pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Timers refs for cleanup
  const intervalCounterRef = useRef(null);

  // Initial fetch on mount if orders have not yet loaded
  useEffect(() => {
    if (fetchOrders && (!orders || orders.length === 0)) {
      fetchOrders().catch(() => {});
    }
  }, [fetchOrders]);

  // Pulse animation for active step (only active when an active order is being tracked)
  useEffect(() => {
    if (!activeOrder) return;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();

    return () => {
      anim.stop();
    };
  }, [activeOrder?.id, pulseAnim]);

  // Running elapsed-time counter updating every second (only active when an active order exists)
  useEffect(() => {
    if (!activeOrder) {
      setElapsedSeconds(0);
      return;
    }

    if (activeOrder.createdAt) {
      const createdMs = new Date(activeOrder.createdAt).getTime();
      const diffSecs = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));
      setElapsedSeconds(diffSecs);
    } else {
      setElapsedSeconds(0);
    }

    intervalCounterRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalCounterRef.current) clearInterval(intervalCounterRef.current);
    };
  }, [activeOrder?.id, activeOrder?.createdAt]);

  /**
   * Question 7 / Spec:
   * Stop polling when there is no active order, and keep the interval cleanup.
   * Polls GET /api/orders/my every 10 seconds when an active order exists.
   */
  useEffect(() => {
    if (!activeOrder) return; // Stop polling when there is no active order

    const pollingInterval = setInterval(() => {
      if (fetchOrders) {
        fetchOrders().catch(() => {});
      }
    }, 10000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [fetchOrders, activeOrder?.id, activeOrder?.status]);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageIndex = (status) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Preparing':
        return 1;
      case 'Ready':
        return 2;
      case 'Served':
        return 3;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(activeOrder?.status || 'Pending');

  // --- Cancel window remaining seconds ---
  const getCancelRemainingSeconds = useCallback(() => {
    if (!activeOrder?.createdAt || CANCEL_WINDOW_MINUTES === 0) return Infinity;
    const createdMs = new Date(activeOrder.createdAt).getTime();
    const windowMs = CANCEL_WINDOW_MINUTES * 60 * 1000;
    const deadlineMs = createdMs + windowMs;
    return Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
  }, [activeOrder?.createdAt]);

  const cancelRemaining = getCancelRemainingSeconds();
  const canCancel =
    activeOrder?.status === 'Pending' &&
    !isCancelling &&
    (CANCEL_WINDOW_MINUTES === 0 || cancelRemaining > 0);

  // Platform-safe alert helper
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // --- Handle Cancel Order ---
  const handleCancelOrder = async () => {
    const orderIdToCancel = activeOrder?.id || activeOrder?._id;
    if (!orderIdToCancel) return;

    const msg = 'Are you sure you want to cancel this order? This cannot be undone.';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm && !window.confirm(msg)) {
        return;
      }
    } else {
      const confirmed = await new Promise((resolve) => {
        Alert.alert('Cancel Order', msg, [
          { text: 'Keep Order', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Yes, Cancel', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) return;
    }

    setIsCancelling(true);
    try {
      if (cancelOrder) {
        await cancelOrder(orderIdToCancel);
      } else {
        await apiClient(`/api/orders/${orderIdToCancel}/status`, {
          method: 'PATCH',
          body: { status: 'Cancelled' },
        });
      }

      // Clear navigation param so it does not retain the cancelled order ID
      if (navigation?.setParams) {
        navigation.setParams({ orderId: undefined });
      }

      // Re-fetch to ensure all server data is synchronized
      if (fetchOrders) {
        fetchOrders().catch(() => {});
      }

      showAlert('Order Cancelled', 'Your order has been cancelled successfully.');
    } catch (err) {
      showAlert('Cancel Failed', err.message || 'Could not cancel the order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (e) {
      console.warn('Logout error:', e);
    }
  };

  const navigateToMenu = () => {
    navigation.navigate('CustomerApp', { screen: 'Menu' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Navigation & Action Bar */}
        <View style={styles.topActionsBar}>
          <TouchableOpacity
            onPress={navigateToMenu}
            style={[
              styles.backToMenuBtn,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
            ]}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.backToMenuText, { color: colors.textPrimary }]}>Back to Menu</Text>
          </TouchableOpacity>

          <View style={styles.rightActionsRow}>
            <TouchableOpacity
              onPress={() => {
                if (fetchOrders) fetchOrders();
              }}
              style={[
                styles.actionIconBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons name="sync-outline" size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={[
                styles.logoutQuickBtn,
                { backgroundColor: '#ef444418', borderColor: '#ef444433' },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons name="log-out-outline" size={16} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={styles.logoutQuickText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONDITION 1: NO ACTIVE ORDER (SHOW CLEAN EMPTY STATE + PAST ORDERS) */}
        {!activeOrder ? (
          <View style={styles.emptyContainer}>
            {/* Empty State Card */}
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                shadows.deep3D,
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                ]}
              >
                <Ionicons name="receipt-outline" size={44} color={colors.primary} />
              </View>

              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No active order right now
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                You have no orders currently in preparation. Explore our artisan culinary selections to place an order.
              </Text>

              <TouchableOpacity
                onPress={navigateToMenu}
                style={[styles.emptyMenuBtn, shadows.button3D]}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyMenuBtnGradient}
                >
                  <Ionicons name="fast-food-outline" size={18} color="#472a00" style={{ marginRight: 8 }} />
                  <Text style={[styles.emptyMenuBtnText, { color: '#472a00' }]}>Back to Menu</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Past Orders List (Cancelled & Served Orders, read-only) */}
            {pastOrders.length > 0 && (
              <View style={styles.pastOrdersContainer}>
                <View style={styles.pastOrdersHeaderRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.pastOrdersHeading, { color: colors.textSecondary }]}>
                    PAST ORDERS ({pastOrders.length})
                  </Text>
                </View>

                {pastOrders.map((order, idx) => {
                  const isServed = order.status === 'Served';
                  const formattedDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : order.timestamp || 'Recent';

                  return (
                    <View
                      key={order.id || order._id || idx}
                      style={[
                        styles.pastOrderCard,
                        { backgroundColor: colors.card, borderColor: colors.cardBorder },
                        shadows.soft,
                      ]}
                    >
                      <View style={styles.pastOrderTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pastOrderId, { color: colors.textPrimary }]}>
                            Order #{String(order.id || order._id).slice(-6).toUpperCase()}
                          </Text>
                          <Text style={[styles.pastOrderDate, { color: colors.textMuted }]}>
                            {formattedDate} • {order.type || 'Dine-in'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.pastStatusPill,
                            {
                              backgroundColor: isServed ? '#22c55e18' : '#ef444418',
                              borderColor: isServed ? '#22c55e44' : '#ef444444',
                            },
                          ]}
                        >
                          <Ionicons
                            name={isServed ? 'checkmark-circle' : 'close-circle'}
                            size={13}
                            color={isServed ? '#22c55e' : '#ef4444'}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.pastStatusText,
                              { color: isServed ? '#22c55e' : '#ef4444' },
                            ]}
                          >
                            {order.status}
                          </Text>
                        </View>
                      </View>

                      {order.items && order.items.length > 0 && (
                        <Text
                          style={[styles.pastOrderItemsSnippet, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {order.items.map((it) => `${it.quantity || 1}x ${it.name}`).join(', ')}
                        </Text>
                      )}

                      <View
                        style={[
                          styles.pastOrderBottomRow,
                          { borderTopColor: colors.surfaceBorder },
                        ]}
                      >
                        <Text style={[styles.pastOrderTotalLabel, { color: colors.textMuted }]}>
                          Total Amount
                        </Text>
                        <Text style={[styles.pastOrderTotal, { color: colors.primary }]}>
                          Rs. {Number(order.total || 0).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          /* CONDITION 2: ACTIVE ORDER TRACKING (Pending, Preparing, Ready) */
          <>
            {/* Top Status Card */}
            <View
              style={[
                styles.headerCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                shadows.deep3D,
              ]}
            >
              <View style={styles.topInfoRow}>
                <View>
                  <Text style={[styles.orderIdLabel, { color: colors.primary }]}>
                    #{String(activeOrder.id || activeOrder._id).slice(-6).toUpperCase()}
                  </Text>
                  <Text style={[styles.orderTypeBadge, { color: colors.textPrimary }]}>
                    {activeOrder.type === 'Dine-in'
                      ? `Dine-in • Table ${activeOrder.tableNumber || '1'}`
                      : `Takeaway • ${activeOrder.pickupTime || 'Ready Soon'}`}
                  </Text>
                </View>

                {/* Running Elapsed Time Counter */}
                <View
                  style={[
                    styles.timerBox,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                  ]}
                >
                  <Ionicons name="stopwatch-outline" size={16} color={colors.primary} />
                  <Text style={[styles.timerDigits, { color: colors.textPrimary }]}>
                    {formatTime(elapsedSeconds)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.liveStatusTitle, { color: colors.textPrimary }]}>
                {STAGES[currentStageIndex]?.label || activeOrder.status}
              </Text>
              <Text style={[styles.liveStatusDesc, { color: colors.textSecondary }]}>
                {STAGES[currentStageIndex]?.desc || 'Your order is currently progressing through the kitchen.'}
              </Text>
            </View>

            {/* CANCEL ORDER BUTTON — only when order status is Pending */}
            {canCancel && (
              <View
                style={[
                  styles.cancelSection,
                  { backgroundColor: colors.card, borderColor: colors.error + '40' },
                  shadows.soft,
                ]}
              >
                <TouchableOpacity
                  onPress={handleCancelOrder}
                  disabled={isCancelling}
                  style={[
                    styles.cancelOrderBtn,
                    { backgroundColor: colors.error },
                    isCancelling && { opacity: 0.6 },
                  ]}
                  activeOpacity={0.75}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="close-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.cancelOrderBtnText}>
                    {isCancelling ? 'Cancelling Order...' : 'Cancel Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP PROGRESS INDICATOR TIMELINE (Only shown for active orders) */}
            <View
              style={[
                styles.timelineCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                shadows.soft,
              ]}
            >
              <Text style={[styles.timelineHeading, { color: colors.textMuted }]}>
                KITCHEN PROGRESSION TIMELINE
              </Text>

              {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <View key={stage.key} style={styles.stageStepRow}>
                    {/* Connector Line */}
                    {idx < STAGES.length - 1 && (
                      <View
                        style={[
                          styles.connectorLine,
                          {
                            backgroundColor: isCompleted ? colors.primary : colors.surfaceBorder,
                          },
                        ]}
                      />
                    )}

                    {/* Circle Icon */}
                    {isCurrent ? (
                      <Animated.View
                        style={[
                          styles.stepCircle,
                          {
                            backgroundColor: '#f59e0b',
                            transform: [{ scale: pulseAnim }],
                          },
                          shadows.button3D,
                        ]}
                      >
                        <Ionicons name={stage.icon} size={18} color="#472a00" />
                      </Animated.View>
                    ) : (
                      <View
                        style={[
                          styles.stepCircle,
                          {
                            backgroundColor: isCompleted ? colors.primary : colors.surfaceSubtle,
                            borderColor: isCompleted ? colors.primary : colors.surfaceBorder,
                            borderWidth: 1.5,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isCompleted ? 'checkmark' : stage.icon}
                          size={16}
                          color={isCompleted ? '#FFFFFF' : colors.textMuted}
                        />
                      </View>
                    )}

                    {/* Step Text Info */}
                    <View style={styles.stepInfo}>
                      <Text
                        style={[
                          styles.stepLabel,
                          {
                            color: isCurrent
                              ? colors.primary
                              : isCompleted
                              ? colors.textPrimary
                              : colors.textMuted,
                            fontWeight: isCurrent ? '800' : '600',
                          },
                        ]}
                      >
                        {stage.label}
                      </Text>
                      <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                        {stage.desc}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ORDER DETAILS CARD */}
            <View
              style={[
                styles.timelineCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                shadows.soft,
              ]}
            >
              <Text style={[styles.timelineHeading, { color: colors.textMuted }]}>
                DISHES IN KITCHEN QUEUE
              </Text>

              {activeOrder.items?.map((item, i) => (
                <View key={i} style={styles.orderItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.orderItemName, { color: colors.textPrimary }]}>
                      {item.quantity}x {item.name}
                    </Text>
                    {item.note ? (
                      <Text style={[styles.orderItemNote, { color: colors.primary }]}>
                        Special: "{item.note}"
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.orderItemPrice, { color: colors.textPrimary }]}>
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}

              <View style={[styles.totalRow, { borderTopColor: colors.surfaceBorder }]}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Grand Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  Rs. {activeOrder.total?.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* RETURN BUTTON */}
            <TouchableOpacity
              onPress={navigateToMenu}
              style={[styles.returnBtn, shadows.button3D]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                <Ionicons name="fast-food-outline" size={18} color="#472a00" style={{ marginRight: 8 }} />
                <Text style={[styles.returnBtnText, { color: '#472a00' }]}>Return to Gourmet Menu</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  topActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backToMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  backToMenuText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutQuickText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  headerCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdLabel: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orderTypeBadge: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  timerDigits: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  liveStatusTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.3,
  },
  liveStatusDesc: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  // Cancel order section
  cancelSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  cancelOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelCountdown: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  cancelExpiredText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  timelineCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  timelineHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 18,
  },
  stageStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    top: 36,
    left: 17,
    width: 2,
    height: 34,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    zIndex: 2,
  },
  stepInfo: {
    flex: 1,
    paddingTop: 2,
  },
  stepLabel: {
    fontSize: 15,
  },
  stepDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderItemNote: {
    fontSize: 12,
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  returnBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  // Empty state styles
  emptyContainer: {
    marginTop: 8,
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
    maxWidth: 360,
  },
  emptyMenuBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 240,
  },
  emptyMenuBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  emptyMenuBtnText: {
    color: '#472a00',
    fontSize: 14,
    fontWeight: '800',
  },
  // Past orders styles
  pastOrdersContainer: {
    marginTop: 6,
    marginBottom: 24,
  },
  pastOrdersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  pastOrdersHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pastOrderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  pastOrderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pastOrderId: {
    fontSize: 14,
    fontWeight: '800',
  },
  pastOrderDate: {
    fontSize: 12,
    marginTop: 2,
  },
  pastStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pastStatusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pastOrderItemsSnippet: {
    fontSize: 12,
    marginVertical: 4,
  },
  pastOrderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  pastOrderTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  pastOrderTotal: {
    fontSize: 15,
    fontWeight: '900',
  },
});
