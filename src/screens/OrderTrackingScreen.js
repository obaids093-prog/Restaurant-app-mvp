import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Must match server/config/constants.js CANCEL_WINDOW_MINUTES.
// NOTE: the server is the final authority — this is advisory for the UI countdown.
const CANCEL_WINDOW_MINUTES = 10;

export default function OrderTrackingScreen({ route, navigation }) {
  const { colors, isDark, shadows } = useTheme();
  const { user, logout } = useAuth();
  const { orders, cancelOrder, fetchOrders } = useOrders();

  const { orderId } = route.params || {};

  // Find active order or fallback to first order in state
  const activeOrder = orders.find((o) => o.id === orderId) || orders[0];

  // Running elapsed time counter (seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Cancel button loading state
  const [isCancelling, setIsCancelling] = useState(false);

  // Animation for active step pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Timers refs for cleanup
  const intervalCounterRef = useRef(null);
  const statusTimerRef = useRef(null);

  // Is the order in a terminal state?
  const isTerminal = activeOrder?.status === 'Served' || activeOrder?.status === 'Cancelled';

  useEffect(() => {
    // Pulse animation for active step
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Running elapsed-time counter updating every second
    intervalCounterRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      // Clear all intervals in cleanup
      if (intervalCounterRef.current) clearInterval(intervalCounterRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  /**
   * Question 7 Specification:
   * Remove fake timer from A1. Instead, use useEffect with setInterval
   * to call GET /api/orders/my every 10 seconds, so customer sees live status updates
   * as the manager modifies it. Clear interval in cleanup function.
   * Stop polling once the order reaches a terminal state (Served or Cancelled).
   */
  useEffect(() => {
    if (isTerminal) return; // Don't poll for terminal orders

    if (fetchOrders) {
      fetchOrders().catch(() => {});
    }

    const pollingInterval = setInterval(() => {
      if (fetchOrders) {
        fetchOrders().catch(() => {});
      }
    }, 10000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [fetchOrders, isTerminal]);


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
      await apiClient(`/api/orders/${orderIdToCancel}/status`, {
        method: 'PATCH',
        body: { status: 'Cancelled' },
      });
      // Refresh the order after success
      if (fetchOrders) {
        await fetchOrders();
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
            onPress={() => navigation.navigate('CustomerApp', { screen: 'Menu' })}
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
                {activeOrder?.id || 'ORD-8419'}
              </Text>
              <Text style={[styles.orderTypeBadge, { color: colors.textPrimary }]}>
                {activeOrder?.type === 'Dine-in'
                  ? `Dine-in • ${activeOrder?.tableNumber || 'Table 4'}`
                  : `Takeaway • ${activeOrder?.pickupTime || 'Ready Soon'}`}
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

          <Text style={[styles.liveStatusTitle, { color: activeOrder?.status === 'Cancelled' ? colors.error : colors.textPrimary }]}>
            {activeOrder?.status === 'Cancelled' ? 'Order Cancelled' : STAGES[currentStageIndex].label}
          </Text>
          <Text style={[styles.liveStatusDesc, { color: colors.textSecondary }]}>
            {activeOrder?.status === 'Cancelled' ? 'This order has been cancelled.' : STAGES[currentStageIndex].desc}
          </Text>
        </View>

        {/* CANCEL ORDER BUTTON — only when order status is Pending */}
        {activeOrder?.status === 'Pending' && (
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

        {/* STEP PROGRESS INDICATOR TIMELINE */}
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
            const isCancelled = activeOrder?.status === 'Cancelled';
            const isCompleted = !isCancelled && idx < currentStageIndex;
            const isCurrent = !isCancelled && idx === currentStageIndex;

            return (
              <View key={stage.key} style={styles.stageStepRow}>
                {/* Connector Line */}
                {idx < STAGES.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      {
                        backgroundColor: isCompleted ? colors.primary : isCancelled ? colors.error + '30' : colors.surfaceBorder,
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
                        backgroundColor: isCompleted ? colors.primary : isCancelled && idx === 0 ? colors.error : colors.surfaceSubtle,
                        borderColor: isCompleted ? colors.primary : isCancelled && idx === 0 ? colors.error : colors.surfaceBorder,
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark' : isCancelled && idx === 0 ? 'close' : stage.icon}
                      size={16}
                      color={isCompleted ? '#FFFFFF' : isCancelled && idx === 0 ? '#FFFFFF' : colors.textMuted}
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
                          : isCancelled && idx === 0
                          ? colors.error
                          : colors.textMuted,
                        fontWeight: isCurrent ? '800' : '600',
                      },
                    ]}
                  >
                    {isCancelled && idx === 0 ? 'Cancelled' : stage.label}
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                    {isCancelled && idx === 0 ? 'Order was cancelled' : stage.desc}
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

          {activeOrder?.items?.map((item, i) => (
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
              Rs. {activeOrder?.total?.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* RETURN BUTTON */}
        <TouchableOpacity
          onPress={() => navigation.navigate('CustomerApp', { screen: 'Menu' })}
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
});
