import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useOrders } from '../context/OrdersContext';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { useTheme } from '../context/ThemeContext';
import { brand } from '../config/brand';
import OrderStepper from '../components/ui/OrderStepper';
import FilterTabs from '../components/ui/FilterTabs';

const ACTIVE_STATUSES = ['Pending', 'Preparing', 'Ready'];
const CANCEL_WINDOW_MINUTES = 10;

export default function OrderTrackingScreen({ route, navigation }) {
  const { colors, isDark, shadows, typography, fonts } = useTheme();
  const { orders, cancelOrder, fetchOrders, isLoading, error } = useOrders();
  const { addItem } = useCart();
  const { menuItems } = useMenu();

  const { orderId } = route.params || {};

  // Active filter tab: 'active' | 'all' | 'completed'
  const [activeTab, setActiveTab] = useState('active');

  // Cancel button loading state
  const [isCancelling, setIsCancelling] = useState(false);

  // Expanded receipt details toggle
  const [expandedReceiptId, setExpandedReceiptId] = useState(null);

  // Active orders (Pending, Preparing, Ready only) sorted by most recent
  const activeOrders = useMemo(() => {
    return (orders || [])
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders]);

  // Specific active order being tracked in hero view (if any)
  const activeOrder = useMemo(() => {
    if (orderId) {
      const matched = activeOrders.find((o) => o.id === orderId || o._id === orderId);
      if (matched) return matched;
    }
    return activeOrders[0] || null;
  }, [activeOrders, orderId]);

  // Completed / Past orders (Served, Delivered, Cancelled)
  const completedOrders = useMemo(() => {
    return (orders || [])
      .filter((o) => ['Served', 'Delivered', 'Cancelled'].includes(o.status))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders]);

  // Filter tabs with dynamic counts
  const filterTabs = useMemo(() => {
    return [
      { id: 'all', label: `All (${(orders || []).length})` },
      { id: 'active', label: `Active (${activeOrders.length})` },
      { id: 'completed', label: `Completed (${completedOrders.length})` },
    ];
  }, [orders, activeOrders.length, completedOrders.length]);

  // Running elapsed time counter (seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalCounterRef = useRef(null);

  // Initial fetch on mount if orders have not yet loaded
  useEffect(() => {
    if (fetchOrders && (!orders || orders.length === 0)) {
      fetchOrders().catch(() => {});
    }
  }, [fetchOrders]);

  // Running elapsed-time counter updating every second
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
   * 10-second polling interval with cleanup when active order exists
   */
  useEffect(() => {
    if (!activeOrder) return;

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

  // Cancel window check
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

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Handle Cancel Order
  const handleCancelOrder = async (targetOrder = activeOrder) => {
    const orderIdToCancel = targetOrder?.id || targetOrder?._id;
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

      if (navigation?.setParams) {
        navigation.setParams({ orderId: undefined });
      }

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

  // Reorder action — verifies dishes against current menu catalog and availability
  const handleReorder = (order) => {
    if (!order?.items || order.items.length === 0) return;

    let addedCount = 0;
    let skippedItems = [];

    (order.items || []).forEach((orderItem) => {
      const dishId = orderItem.menuItem || orderItem.id || orderItem._id;
      const currentDish = (menuItems || []).find(
        (m) =>
          String(m.id || m._id) === String(dishId) ||
          (m.name && orderItem.name && m.name.toLowerCase().trim() === orderItem.name.toLowerCase().trim())
      );

      if (currentDish && currentDish.isAvailable !== false) {
        const qty = orderItem.quantity || 1;
        for (let i = 0; i < qty; i++) {
          addItem({
            ...currentDish,
            id: currentDish.id || currentDish._id,
            price: Number(currentDish.price), // current menu price
          });
        }
        addedCount += qty;
      } else {
        skippedItems.push(orderItem.name || 'Sold out dish');
      }
    });

    if (skippedItems.length > 0 && addedCount > 0) {
      Alert.alert(
        'Tray Updated',
        `${addedCount} item(s) re-added at current menu prices. Note: ${skippedItems.join(
          ', '
        )} is currently unavailable and was omitted.`,
        [
          { text: 'Keep Browsing', style: 'cancel' },
          { text: 'View Tray', onPress: () => navigation.navigate('CustomerApp', { screen: 'Cart' }) },
        ]
      );
    } else if (skippedItems.length > 0 && addedCount === 0) {
      Alert.alert(
        'Dishes Unavailable',
        `None of the creations in this order (${skippedItems.join(
          ', '
        )}) are currently available in the menu catalog.`
      );
    } else if (addedCount > 0) {
      Alert.alert(
        'Dishes Re-added to Tray',
        `${addedCount} creation(s) have been placed in your tray at current menu prices.`,
        [
          { text: 'Keep Browsing', style: 'cancel' },
          { text: 'View Tray', onPress: () => navigation.navigate('CustomerApp', { screen: 'Cart' }) },
        ]
      );
    }
  };

  const navigateToMenu = () => {
    navigation.navigate('CustomerApp', { screen: 'Menu' });
  };

  // Filter orders according to active tab
  const displayedOrders = useMemo(() => {
    if (activeTab === 'active') return activeOrders;
    if (activeTab === 'completed') return completedOrders;
    return orders || [];
  }, [activeTab, activeOrders, completedOrders, orders]);

  // ─── LOADING STATE (First Load) ──────────────────────────────────────────
  if (isLoading && (!orders || orders.length === 0)) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View
          style={[
            styles.loadingBox,
            { backgroundColor: colors.card, borderColor: colors.surfaceBorder || colors.cardBorder },
            shadows.cardLight || shadows.soft,
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.stateHeading,
              { color: colors.textPrimary, fontFamily: fonts?.bold || typography.headingSm?.fontFamily },
            ]}
          >
            Retrieving Dining Folios
          </Text>
          <Text
            style={[
              styles.stateSubheading,
              { color: colors.mutedText, fontFamily: fonts?.regular || typography.body?.fontFamily },
            ]}
          >
            Fetching active kitchen dispatches and order history...
          </Text>
        </View>
      </View>
    );
  }

  // ─── ERROR STATE WITH RETRY ───────────────────────────────────────────────
  if (error && (!orders || orders.length === 0)) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View
          style={[
            styles.loadingBox,
            { backgroundColor: colors.card, borderColor: colors.surfaceBorder || colors.cardBorder },
            shadows.cardLight || shadows.soft,
          ]}
        >
          <Ionicons name="cloud-offline-outline" size={54} color={colors.cancelled || colors.error} />
          <Text
            style={[
              styles.stateHeading,
              { color: colors.textPrimary, fontFamily: fonts?.bold || typography.headingSm?.fontFamily },
            ]}
          >
            Connection Interrupted
          </Text>
          <Text
            style={[
              styles.stateSubheading,
              { color: colors.mutedText, fontFamily: fonts?.regular || typography.body?.fontFamily },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => fetchOrders && fetchOrders().catch(() => {})}
            style={[
              styles.retryBtn,
              { backgroundColor: colors.primary },
              shadows.buttonPrimary || shadows.button3D,
            ]}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
            <Text
              style={[
                styles.retryBtnText,
                { color: colors.onPrimary, fontFamily: fonts?.semiBold || typography.caption?.fontFamily },
              ]}
            >
              Retry Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stage Header */}
        <View style={styles.stageHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[typography.headingLg, { color: colors.textPrimary, fontWeight: '800' }]}>
                Kitchen Tracker
              </Text>
              <View
                style={[
                  styles.syncStatusPill,
                  { backgroundColor: activeOrder ? colors.primaryTint : colors.surfaceSubtle },
                ]}
              >
                <View
                  style={[
                    styles.syncDot,
                    { backgroundColor: activeOrder ? colors.primary : colors.mutedText },
                  ]}
                />
                <Text
                  style={[
                    styles.syncStatusText,
                    { color: activeOrder ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {activeOrder ? 'Live Sync' : 'Idle Sync'}
                </Text>
              </View>
            </View>
            <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}>
              Real-time artisan kitchen orchestration & live station status
            </Text>
          </View>

          {/* Sync Refresh Button */}
          <TouchableOpacity
            onPress={() => {
              if (fetchOrders) fetchOrders();
            }}
            style={[
              styles.refreshBtn,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              shadows.soft,
            ]}
            activeOpacity={0.8}
            accessibilityLabel="Refresh status"
          >
            <Ionicons name="sync" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Segmented Filter Tabs (All / Active / Completed) */}
        <View style={styles.filterTabsWrapper}>
          <FilterTabs
            tabs={filterTabs}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
        </View>

        {/* HERO ACTIVE ORDER SECTION (If on 'active' tab and an order is firing, or specified orderId) */}
        {activeOrder && (activeTab === 'active' || activeTab === 'all') && (
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

            {/* Cancel Button (While Pending) */}
            {canCancel && (
              <TouchableOpacity
                onPress={() => handleCancelOrder(activeOrder)}
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
        )}

        {/* EMPTY STATE (When Active Tab has 0 active orders, or entire list is empty) */}
        {activeTab === 'active' && activeOrders.length === 0 && (
          <View
            style={[
              styles.emptyHeroCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              shadows.soft,
            ]}
          >
            {/* Cloche with schedule beacon */}
            <View style={styles.emptyClocheCanvas}>
              <View style={[styles.emptyClocheGlow, { backgroundColor: colors.primaryTint }]} />
              <View style={[styles.emptyClocheOuter, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="restaurant" size={32} color={colors.primary} />
              </View>
              <View style={[styles.emptyClockBeacon, { backgroundColor: colors.primary }]}>
                <Ionicons name="time" size={14} color={colors.onPrimary} />
              </View>
            </View>

            <Text style={[typography.headingSm, styles.emptyHeroTitle, { color: colors.textPrimary }]}>
              No Active Orders in Kitchen
            </Text>
            <Text style={[typography.body, styles.emptyHeroSub, { color: colors.textSecondary }]}>
              You don't have any culinary orders currently firing in Chef Farhan's kitchen. Place a dine-in or takeaway order to track station progress live.
            </Text>

            <TouchableOpacity
              onPress={navigateToMenu}
              style={[styles.emptyHeroBtn, { backgroundColor: colors.primary }, shadows.button3D]}
              activeOpacity={0.88}
            >
              <Text style={[styles.emptyHeroBtnText, { color: colors.onPrimary }]}>
                Explore Artisan Menu
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}


        {/* ORDER LIST (Past & Completed Dining Folios) */}
        {displayedOrders.length > 0 && (
          <View style={styles.ordersListSection}>
            <View style={styles.ordersListHeader}>
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                {activeTab === 'active'
                  ? 'Past Dining Folios'
                  : activeTab === 'completed'
                  ? 'Completed Dining Folios'
                  : 'All Dining Folios'}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText }]}>
                {displayedOrders.length} Total
              </Text>
            </View>

            {displayedOrders.map((ord, idx) => {
              const isServed = ord.status === 'Served' || ord.status === 'Delivered';
              const isCancelled = ord.status === 'Cancelled';
              const isPending = ord.status === 'Pending';
              const formattedDate = ord.createdAt
                ? new Date(ord.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              const orderTicket = String(ord.id || ord._id).slice(-4).toUpperCase();
              const isExpanded = expandedReceiptId === (ord.id || ord._id);

              return (
                <View
                  key={ord.id || ord._id || idx}
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
                            {ord.type || 'Dine-In'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}>
                        {formattedDate} • {ord.tableNumber || 'Atrium'}
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
                        {ord.status}
                      </Text>
                    </View>
                  </View>

                  {/* Dish Preview Row */}
                  {ord.items && ord.items.length > 0 && (
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
                          {ord.items.map((i) => i.name).join(' • ')}
                        </Text>
                        <Text style={[typography.caption, { color: colors.textSecondary }]}>
                          {ord.items.length} Course(s) • Total: {brand.formatPrice(ord.totalPrice || ord.total || 0)}
                        </Text>
                      </View>
                      <Text style={[typography.price, { color: colors.primary, fontWeight: '800' }]}>
                        {brand.formatPrice(ord.totalPrice || ord.total || 0)}
                      </Text>
                    </View>
                  )}

                  {/* Expanded Receipt Breakdown (if toggled) */}
                  {isExpanded && ord.items && (() => {
                    const rSubtotal = ord.subtotal !== undefined
                      ? ord.subtotal
                      : ord.items.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 1)), 0);
                    const rDiscount = ord.discountAmount || 0;
                    const rDiscounted = Math.max(0, rSubtotal - rDiscount);
                    const rService = ord.serviceCharge !== undefined ? ord.serviceCharge : (rDiscounted * 0.05);
                    const rTax = ord.salesTax !== undefined ? ord.salesTax : (rDiscounted * 0.15);
                    const rTotal = ord.totalAmount !== undefined
                      ? ord.totalAmount
                      : (ord.totalPrice || ord.total || (rDiscounted + rService + rTax));

                    return (
                      <View style={[styles.expandedReceipt, { borderTopColor: colors.surfaceBorder }]}>
                        <Text style={[typography.caption, { color: colors.mutedText, textTransform: 'uppercase', marginBottom: 6 }]}>
                          Course Breakdown
                        </Text>
                        {ord.items.map((it, i) => (
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
                      onPress={() => handleReorder(ord)}
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
                      onPress={() => setExpandedReceiptId(isExpanded ? null : (ord.id || ord._id))}
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
                        onPress={() => handleCancelOrder(ord)}
                        style={[styles.cancelSmallBtn, { borderColor: colors.error }]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={14} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
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
    paddingBottom: 48,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabsWrapper: {
    marginBottom: 16,
  },
  heroActiveCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pulseLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  serviceTimerTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  timerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperWrapper: {
    paddingVertical: 8,
    marginBottom: 14,
  },
  heroItemsList: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
  },
  heroItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyClocheCanvas: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  emptyClocheGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.5,
  },
  emptyClocheOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyClockBeacon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  emptyHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyHeroSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 18,
  },
  emptyHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyHeroBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stationTeaserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  stationIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersListSection: {
    marginTop: 4,
  },
  ordersListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  folioCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  folioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  folioTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  folioTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  folioStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  folioStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dishPreviewTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  dishPreviewThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedReceipt: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginBottom: 10,
  },
  receiptDivider: {
    height: 1,
    marginVertical: 6,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  folioActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  receiptBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelSmallBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  stateHeading: {
    fontSize: 18,
    marginTop: 16,
    letterSpacing: -0.2,
  },
  stateSubheading: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 12,
    marginTop: 18,
  },
  retryBtnText: {
    fontSize: 14,
  },
});
