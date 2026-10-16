import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
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
import apiClient from '../../api/client';
import { useOrders } from '../../context/OrdersContext';
import { useCart } from '../../context/CartContext';
import { useMenu } from '../../context/MenuContext';
import { useTheme } from '../../context/ThemeContext';
import FilterTabs from '../../components/ui/FilterTabs';
import { styles, ACTIVE_STATUSES, CANCEL_WINDOW_MINUTES } from './trackingStyles';
import ActiveOrderHero from './ActiveOrderHero';
import PastOrderCard from './PastOrderCard';
import TrackingEmptyState from './TrackingEmptyState';

export { ACTIVE_STATUSES, CANCEL_WINDOW_MINUTES };

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
          <ActiveOrderHero
            activeOrder={activeOrder}
            elapsedSeconds={elapsedSeconds}
            formatTime={formatTime}
            canCancel={canCancel}
            cancelRemaining={cancelRemaining}
            isCancelling={isCancelling}
            onCancelOrder={handleCancelOrder}
            colors={colors}
            shadows={shadows}
            typography={typography}
          />
        )}

        {/* EMPTY STATE (When Active Tab has 0 active orders, or entire list is empty) */}
        {activeTab === 'active' && activeOrders.length === 0 && (
          <TrackingEmptyState
            onNavigateToMenu={navigateToMenu}
            colors={colors}
            shadows={shadows}
            typography={typography}
          />
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

            {displayedOrders.map((ord, idx) => (
              <PastOrderCard
                key={ord.id || ord._id || idx}
                order={ord}
                isExpanded={expandedReceiptId === (ord.id || ord._id)}
                onToggleReceipt={() =>
                  setExpandedReceiptId(
                    expandedReceiptId === (ord.id || ord._id) ? null : ord.id || ord._id
                  )
                }
                onReorder={handleReorder}
                onCancelOrder={handleCancelOrder}
                colors={colors}
                shadows={shadows}
                typography={typography}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
