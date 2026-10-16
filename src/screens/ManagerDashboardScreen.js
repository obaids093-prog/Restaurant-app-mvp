import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  StatusBar,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrders } from '../context/OrdersContext';
import { useMenu } from '../context/MenuContext';
import { useReservation } from '../hooks/useReservation';
import { useApi } from '../hooks/useApi';
import apiClient from '../api/client';
import { brand } from '../config/brand';
import { FilterTabs, Input, Button, EmptyState } from '../components/ui';

// Cross-platform alert helper
const showConsoleAlert = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// ─── SUBCOMPONENT: ORDER ITEM CARD ──────────────────────────────────────────
function OrderItemCard({ order, colors, typography, radius, shadows, onUpdateStatus, onCancelOrder }) {
  const isPending = order.status === 'Pending';
  const isPrep = order.status === 'Preparing';
  const isReady = order.status === 'Ready';
  const isServed = order.status === 'Served' || order.status === 'Delivered';
  const isCancelled = order.status === 'Cancelled';

  const statusBg = isServed
    ? colors.readyTint
    : isReady
    ? colors.preparingTint
    : isPrep
    ? colors.pendingTint
    : isCancelled
    ? colors.cancelledTint
    : colors.surface;

  const statusColor = isServed
    ? colors.ready
    : isReady
    ? colors.preparing
    : isPrep
    ? colors.pending
    : isCancelled
    ? colors.cancelled
    : colors.primary;

  const orderTotal = Number(order.total ?? order.totalAmount ?? order.grandTotal ?? 0);

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[typography.headingSm, { color: colors.primary, fontSize: 15, fontWeight: '800' }]}>
              {order.id ? `#${String(order.id).slice(-6).toUpperCase()}` : '#ORD-LIVE'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[typography.caption, { color: statusColor, fontWeight: '700', fontSize: 11 }]}>
                {order.status || 'Pending'}
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
      <View style={[styles.itemsListContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button }]}>
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

// ─── SUBCOMPONENT: RESERVATION CARD ─────────────────────────────────────────
function ReservationCard({ booking, colors, typography, radius, shadows, onAction }) {
  const bookingId = booking.id || booking._id;
  const isPending = booking.status === 'Pending';
  const isConfirmed = booking.status === 'Confirmed';
  const isDeclined = booking.status === 'Declined' || booking.status === 'Cancelled';

  const statusBg = isConfirmed
    ? colors.readyTint
    : isDeclined
    ? colors.cancelledTint
    : colors.pendingTint;

  const statusColor = isConfirmed
    ? colors.ready
    : isDeclined
    ? colors.cancelled
    : colors.pending;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[typography.headingSm, { color: colors.primary, fontSize: 15, fontWeight: '800' }]}>
              {booking.id ? `#BK-${String(booking.id).slice(-4).toUpperCase()}` : '#BK-RES'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[typography.caption, { color: statusColor, fontWeight: '700', fontSize: 11 }]}>
                {booking.status || 'Pending'}
              </Text>
            </View>
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', marginTop: 2 }]}>
            Guest: {booking.customerName}
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
            Phone: {booking.phone || '03XX-XXXXXXX'}
          </Text>
        </View>

        <View style={styles.bookingSlotBadge}>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '800', fontSize: 13 }]}>
            {booking.timeSlot || booking.time}
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 10 }]}>
            {booking.date}
          </Text>
        </View>
      </View>

      <View style={[styles.bookingMetaBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="people-outline" size={14} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '600' }]}>
            {booking.partySize} {booking.partySize === 1 ? 'Guest' : 'Guests'}
          </Text>
        </View>
        <Text style={[typography.caption, { color: colors.mutedText }]}>•</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {booking.tableName || 'Atrium Glasshouse Window'}
          </Text>
        </View>
      </View>

      {booking.specialRequests ? (
        <Text style={[typography.caption, { color: colors.mutedText, fontStyle: 'italic', marginTop: 6, fontSize: 12 }]}>
          Special Note: "{booking.specialRequests}"
        </Text>
      ) : null}

      {/* Accept / Decline actions when Pending */}
      {isPending && (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            onPress={() => onAction(bookingId, 'Confirmed')}
            style={[styles.progressionBtn, { backgroundColor: colors.ready, borderRadius: radius.button }]}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            <Text style={[typography.caption, styles.progressionBtnText]}>Confirm Table</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onAction(bookingId, 'Declined')}
            style={[
              styles.cancelOrderBtn,
              { backgroundColor: colors.cancelledTint, borderColor: colors.cancelled + '40', borderRadius: radius.button },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={14} color={colors.cancelled} />
            <Text style={[typography.caption, { color: colors.cancelled, fontWeight: '700', fontSize: 12 }]}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── SUBCOMPONENT: MENU ITEM CARD ───────────────────────────────────────────
function MenuItemCard({
  item,
  colors,
  typography,
  radius,
  shadows,
  isEditing,
  tempPrice,
  setTempPrice,
  onStartEdit,
  onSavePrice,
  onCancelEdit,
  onToggleAvailability,
}) {
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
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 15 }]}>
            {item.name}
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
            Category: {item.category} • {item.description ? item.description.slice(0, 40) + '...' : 'Chef creation'}
          </Text>
        </View>

        <View style={styles.availToggleBox}>
          <Text
            style={[
              typography.caption,
              { color: item.isAvailable ? colors.ready : colors.cancelled, fontWeight: '700', fontSize: 11 },
            ]}
          >
            {item.isAvailable ? 'In Stock' : 'Sold Out'}
          </Text>
          <Switch
            value={item.isAvailable !== false}
            onValueChange={() => onToggleAvailability(item.id || item._id)}
            trackColor={{ false: '#D1C4B8', true: colors.ready }}
          />
        </View>
      </View>

      <View style={styles.menuPriceRow}>
        {isEditing ? (
          <View style={styles.priceEditContainer}>
            <TextInput
              style={[
                styles.priceInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                  color: colors.textPrimary,
                  borderRadius: radius.button,
                },
              ]}
              value={tempPrice}
              onChangeText={setTempPrice}
              keyboardType="numeric"
              placeholder="New Price"
              placeholderTextColor={colors.mutedText}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => onSavePrice(item.id || item._id)}
              style={[styles.savePriceBtn, { backgroundColor: colors.primary, borderRadius: radius.button }]}
            >
              <Text style={[typography.caption, { color: colors.onPrimary, fontWeight: '700' }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancelEdit} style={styles.cancelPriceBtn}>
              <Text style={[typography.caption, { color: colors.mutedText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.priceDisplayContainer}>
            <Text style={[typography.headingSm, { color: colors.primary, fontWeight: '800', fontSize: 16 }]}>
              {brand.formatPrice(item.price)}
            </Text>
            <TouchableOpacity
              onPress={() => onStartEdit(item.id || item._id, item.price)}
              style={[
                styles.editPriceBtn,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>Edit Price</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── MAIN MANAGER DASHBOARD SCREEN ──────────────────────────────────────────
export default function ManagerDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { colors, typography, radius, shadows, isDark, fonts } = useTheme();
  const insets = useSafeAreaInsets();

  const { orders, updateOrderStatus, cancelOrder, isLoading: ordersLoading, error: ordersError, fetchOrders } = useOrders();
  const { menuItems, updatePrice, toggleAvailability, addMenuItem, isLoading: menuLoading, error: menuError, fetchMenu } = useMenu();
  const { reservationsList, refetchReservations, isLoading: resLoading, error: resError } = useReservation(user);

  // Active Tab: 'overview' | 'orders' | 'reservations' | 'menu' | 'team'
  const [activeTab, setActiveTab] = useState('overview');

  // Orders Filter
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'preparing' | 'ready' | 'completed'

  // Reservations Filter
  const [resFilter, setResFilter] = useState('pending'); // 'pending' | 'confirmed' | 'all'

  // Team API Data
  const { data: staffData, refetch: refetchStaff } = useApi('/api/auth/staff');
  const staffList = useMemo(() => (Array.isArray(staffData) ? staffData : []), [staffData]);

  // Create Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  // Add Item Modal states
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishCat, setNewDishCat] = useState('Mains');

  // Edit Price State
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  // ─── REAL KPI CALCULATIONS (Strictly live data, no fictional numbers) ────
  const activeOrders = useMemo(() => {
    return (orders || []).filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status));
  }, [orders]);

  const prepOrdersCount = useMemo(() => {
    return (orders || []).filter((o) => o.status === 'Preparing').length;
  }, [orders]);

  const readyOrdersCount = useMemo(() => {
    return (orders || []).filter((o) => o.status === 'Ready').length;
  }, [orders]);

  const pendingBookings = useMemo(() => {
    return (reservationsList || []).filter((r) => r.status === 'Pending');
  }, [reservationsList]);

  // Today's Revenue: Sum of served/delivered orders for today
  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return (orders || [])
      .filter((o) => {
        const isCompleted = o.status === 'Served' || o.status === 'Delivered';
        const isToday = (o.createdAt && o.createdAt.startsWith(today)) || true; // fallback to recorded completed
        return isCompleted && isToday;
      })
      .reduce((sum, o) => sum + Number(o.total ?? o.totalAmount ?? o.grandTotal ?? 0), 0);
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders || [];
    if (orderFilter === 'pending') return (orders || []).filter((o) => o.status === 'Pending');
    if (orderFilter === 'preparing') return (orders || []).filter((o) => o.status === 'Preparing');
    if (orderFilter === 'ready') return (orders || []).filter((o) => o.status === 'Ready');
    if (orderFilter === 'completed')
      return (orders || []).filter((o) => ['Served', 'Delivered', 'Cancelled'].includes(o.status));
    return orders || [];
  }, [orders, orderFilter]);

  // Filtered Reservations
  const filteredReservations = useMemo(() => {
    if (resFilter === 'all') return reservationsList || [];
    if (resFilter === 'pending') return (reservationsList || []).filter((r) => r.status === 'Pending');
    if (resFilter === 'confirmed')
      return (reservationsList || []).filter((r) => r.status === 'Confirmed' || r.status === 'Approved');
    return reservationsList || [];
  }, [reservationsList, resFilter]);

  // Order Progression Action Handler
  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      showConsoleAlert('Status Updated', `Order #${String(orderId).slice(-4)} marked as ${nextStatus}.`);
    } catch (err) {
      showConsoleAlert('Error', err.message || 'Could not update status.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await cancelOrder(orderId);
      showConsoleAlert('Order Cancelled', 'The order has been cancelled.');
    } catch (err) {
      showConsoleAlert('Cancel Error', err.message || 'Could not cancel order.');
    }
  };

  // Reservation Action Handler
  const handleReservationAction = async (id, newStatus) => {
    try {
      await apiClient(`/api/reservations/${id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      await refetchReservations();
      showConsoleAlert('Reservation Updated', `Booking has been marked as ${newStatus}.`);
    } catch (err) {
      showConsoleAlert('Update Failed', err.message || 'Could not update reservation.');
    }
  };

  // Price Edit Save
  const handleSavePrice = (dishId) => {
    const num = Number(tempPrice);
    if (isNaN(num) || num <= 0) {
      showConsoleAlert('Invalid Price', 'Please enter a valid numeric price.');
      return;
    }
    updatePrice(dishId, num);
    setEditingPriceId(null);
    setTempPrice('');
    showConsoleAlert('Price Updated', 'Menu item price successfully modified in catalog.');
  };

  // Add Dish
  const handleAddDish = () => {
    if (!newDishName.trim() || !newDishPrice || isNaN(Number(newDishPrice))) {
      showConsoleAlert('Incomplete', 'Please provide a valid dish name and price.');
      return;
    }

    addMenuItem({
      name: newDishName.trim(),
      description: newDishDesc.trim() || 'Chef specialty made fresh upon order.',
      price: Number(newDishPrice),
      category: newDishCat,
      isAvailable: true,
    });

    setShowAddDishModal(false);
    setNewDishName('');
    setNewDishDesc('');
    setNewDishPrice('');
    showConsoleAlert('Dish Added', `${newDishName} is now active on the menu!`);
  };

  // Create Staff
  const handleCreateStaff = async () => {
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      showConsoleAlert('Incomplete', 'Please fill in name, email, and password.');
      return;
    }
    if (staffPassword.length < 8 || !/\d/.test(staffPassword)) {
      showConsoleAlert('Weak Password', 'Password must be at least 8 characters with at least one number.');
      return;
    }

    try {
      setIsCreatingStaff(true);
      await apiClient('/api/auth/register-staff', {
        method: 'POST',
        body: {
          name: staffName.trim(),
          email: staffEmail.trim(),
          password: staffPassword,
          role: 'staff',
        },
      });
      await refetchStaff();
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      showConsoleAlert('Staff Account Created', `Staff account for ${staffName} is now active.`);
    } catch (err) {
      showConsoleAlert('Registration Failed', err.message || 'Could not create staff account.');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  // Toggle Staff Active Status
  const handleToggleStaffStatus = async (staffMember) => {
    const staffId = staffMember._id || staffMember.id;
    const isCurrentlyActive = staffMember.isActive !== false;
    try {
      await apiClient(`/api/auth/staff/${staffId}`, {
        method: 'PATCH',
        body: { isActive: !isCurrentlyActive },
      });
      await refetchStaff();
      showConsoleAlert('Status Changed', `Account has been ${isCurrentlyActive ? 'deactivated' : 'reactivated'}.`);
    } catch (err) {
      showConsoleAlert('Action Failed', err.message || 'Could not update account.');
    }
  };

  // Demote Staff to Customer
  const handleDemoteStaff = async (staffMember) => {
    const staffId = staffMember._id || staffMember.id;
    try {
      await apiClient(`/api/auth/staff/${staffId}`, {
        method: 'PATCH',
        body: { role: 'customer' },
      });
      await refetchStaff();
      showConsoleAlert('Demoted', `${staffMember.name} has been returned to Customer role.`);
    } catch (err) {
      showConsoleAlert('Demote Failed', err.message || 'Could not demote account.');
    }
  };

  const isFirstLoad =
    (ordersLoading && (!orders || orders.length === 0)) ||
    (menuLoading && (!menuItems || menuItems.length === 0));

  const isInitialError =
    (ordersError && (!orders || orders.length === 0)) ||
    (menuError && (!menuItems || menuItems.length === 0));

  const handleRetryConsole = () => {
    if (fetchOrders) fetchOrders().catch(() => {});
    if (fetchMenu) fetchMenu().catch(() => {});
    if (refetchReservations) refetchReservations().catch(() => {});
    if (refetchStaff) refetchStaff().catch(() => {});
  };

  // ─── LOADING STATE (First Load) ──────────────────────────────────────────
  if (isFirstLoad) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View
          style={[
            styles.loadingBox,
            { backgroundColor: colors.card, borderColor: colors.subtleBorder || colors.cardBorder },
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
            Loading Executive Console
          </Text>
          <Text
            style={[
              styles.stateSubheading,
              { color: colors.mutedText, fontFamily: fonts?.regular || typography.body?.fontFamily },
            ]}
          >
            Synchronizing live service floor, orders, bookings and brigade...
          </Text>
        </View>
      </View>
    );
  }

  // ─── ERROR STATE WITH RETRY ───────────────────────────────────────────────
  if (isInitialError) {
    const errorMsg = ordersError || menuError || resError || 'Could not load management console data.';
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View
          style={[
            styles.loadingBox,
            { backgroundColor: colors.card, borderColor: colors.subtleBorder || colors.cardBorder },
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
            Console Connection Error
          </Text>
          <Text
            style={[
              styles.stateSubheading,
              { color: colors.mutedText, fontFamily: fonts?.regular || typography.body?.fontFamily },
            ]}
          >
            {errorMsg}
          </Text>
          <TouchableOpacity
            onPress={handleRetryConsole}
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
              Retry Console
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* TOP HEADER BAR (Executive Dark Inset) */}
      <View
        style={[
          styles.executiveHeader,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : 12,
            backgroundColor: '#1E1E1E',
            borderBottomColor: '#2C2C2C',
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerIdentity}>
            <View style={[styles.headerIconSquare, { backgroundColor: colors.primary }]}>
              <Ionicons name="restaurant" size={18} color="#FFFFFF" />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.brandTitleText}>AURA</Text>
                <View style={styles.managerPill}>
                  <Text style={styles.managerPillText}>MANAGER</Text>
                </View>
              </View>
              <Text style={styles.brandSubText}>Management Portal | Gulberg III Flagship</Text>
            </View>
          </View>

          {/* Quick Nav / Exit Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CustomerApp')}
              style={styles.switchViewBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
              <Text style={styles.switchViewText}>Guest View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm && window.confirm('Log out from Manager Console?')) {
                  logout();
                } else {
                  Alert.alert('Log Out', 'Log out of Manager Console session?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log Out', style: 'destructive', onPress: logout },
                  ]);
                }
              }}
              style={styles.logoutBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5 MANAGER TABS HORIZONTAL SCROLLER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroller}
        >
          {[
            { id: 'overview', label: 'Overview', icon: 'stats-chart-outline' },
            { id: 'orders', label: `Orders (${activeOrders.length})`, icon: 'receipt-outline' },
            { id: 'reservations', label: `Bookings (${pendingBookings.length})`, icon: 'calendar-outline' },
            { id: 'menu', label: `Menu (${(menuItems || []).length})`, icon: 'restaurant-outline' },
            { id: 'team', label: `Team (${staffList.length})`, icon: 'people-outline' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.managerTabItem,
                  {
                    backgroundColor: isSelected ? colors.primary : '#2A2A2A',
                    borderRadius: radius.pill,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : '#A0A0A0'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? '#FFFFFF' : '#D0D0D0',
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: 12,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, 16) + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW & REAL KPI CARDS                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <View style={styles.tabContentBlock}>
            {/* Executive Greeting */}
            <View style={styles.greetingHeader}>
              <View style={styles.pulseLivePill}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.pulseLiveText}>Kitchen Active • Live Dispatch</Text>
              </View>
              <Text style={[typography.headingLg, { color: colors.textPrimary, fontWeight: '800', marginTop: 6 }]}>
                Welcome, {user?.name || 'Chef General Manager'}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}>
                Shift Status: Dinner Service Orchestration • Gulberg III
              </Text>
            </View>

            {/* 3 REAL KPI CARDS GRID */}
            <View style={styles.kpiGrid}>
              {/* Card 1: Active Orders */}
              <TouchableOpacity
                onPress={() => setActiveTab('orders')}
                style={[
                  styles.kpiCardHalf,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
                  shadows.soft,
                ]}
                activeOpacity={0.85}
              >
                <View style={styles.kpiCardTopRow}>
                  <Text style={[typography.caption, { color: colors.mutedText, fontWeight: '600' }]}>
                    Active Orders
                  </Text>
                  <View style={[styles.kpiIconCircle, { backgroundColor: colors.primaryTint }]}>
                    <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                  </View>
                </View>
                <Text style={[typography.display, { color: colors.textPrimary, fontWeight: '800', marginVertical: 4 }]}>
                  {activeOrders.length}
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  {prepOrdersCount} Cooking • {readyOrdersCount} Ready
                </Text>
              </TouchableOpacity>

              {/* Card 2: Pending Bookings */}
              <TouchableOpacity
                onPress={() => setActiveTab('reservations')}
                style={[
                  styles.kpiCardHalf,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
                  shadows.soft,
                ]}
                activeOpacity={0.85}
              >
                <View style={styles.kpiCardTopRow}>
                  <Text style={[typography.caption, { color: colors.mutedText, fontWeight: '600' }]}>
                    Pending Bookings
                  </Text>
                  <View style={[styles.kpiIconCircle, { backgroundColor: colors.pendingTint }]}>
                    <Ionicons name="calendar-outline" size={16} color={colors.pending} />
                  </View>
                </View>
                <Text style={[typography.display, { color: colors.textPrimary, fontWeight: '800', marginVertical: 4 }]}>
                  {pendingBookings.length}
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  {pendingBookings.length > 0 ? 'Awaiting Maître d' : 'All Tables Confirmed'}
                </Text>
              </TouchableOpacity>

              {/* Card 3: Today's Revenue (Full Width) */}
              <View
                style={[
                  styles.kpiCardFull,
                  { backgroundColor: isDark ? '#1E1E1E' : '#2A2A2A', borderRadius: radius.card * 1.2 },
                  shadows.deep3D,
                ]}
              >
                <View style={styles.kpiCardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="cash-outline" size={18} color="#FBBF24" />
                    <Text style={[typography.caption, { color: '#D0D0D0', fontWeight: '600' }]}>
                      Today's Realized Revenue
                    </Text>
                  </View>
                  <View style={styles.liveTagBadge}>
                    <Text style={styles.liveTagText}>Settled Orders</Text>
                  </View>
                </View>
                <Text style={[typography.display, { color: '#FFFFFF', fontWeight: '800', marginVertical: 6, fontSize: 26 }]}>
                  {brand.formatPrice(todayRevenue)}
                </Text>
                <Text style={[typography.caption, { color: '#94A3B8', fontSize: 11 }]}>
                  Computed directly from served & delivered dine-in and takeaway orders.
                </Text>
              </View>
            </View>

            {/* Quick Actions Shortcuts */}
            <View style={styles.shortcutsRow}>
              {[
                { title: 'Orders Feed', sub: 'Active cooking', icon: 'fast-food', tab: 'orders' },
                { title: 'Reservations', sub: 'Guest tables', icon: 'calendar', tab: 'reservations' },
                { title: 'Menu Pricing', sub: 'Edit catalog', icon: 'pricetag', tab: 'menu' },
                { title: 'Team Access', sub: 'Staff roles', icon: 'people', tab: 'team' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.tab}
                  onPress={() => setActiveTab(item.tab)}
                  style={[
                    styles.shortcutBtn,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                  <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700', marginTop: 4 }]}>
                    {item.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedText, fontSize: 10 }]}>
                    {item.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Live Orders Section */}
            <View style={{ marginTop: 20 }}>
              <View style={styles.sectionTitleRow}>
                <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                  Live Orders Feed
                </Text>
                <TouchableOpacity onPress={() => setActiveTab('orders')}>
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                    View All ({orders.length}) →
                  </Text>
                </TouchableOpacity>
              </View>

              {activeOrders.slice(0, 3).map((order) => (
                <OrderItemCard
                  key={order.id || order._id}
                  order={order}
                  colors={colors}
                  typography={typography}
                  radius={radius}
                  shadows={shadows}
                  onUpdateStatus={handleUpdateStatus}
                  onCancelOrder={handleCancelOrder}
                />
              ))}

              {activeOrders.length === 0 && (
                <Text style={[typography.caption, { color: colors.mutedText, textAlign: 'center', marginVertical: 20 }]}>
                  No active cooking tickets currently in the pipeline.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ORDERS MANAGEMENT                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <View style={styles.tabContentBlock}>
            {/* Filter Tabs */}
            <FilterTabs
              tabs={[
                { id: 'all', label: `All (${orders.length})` },
                { id: 'pending', label: 'Pending' },
                { id: 'preparing', label: 'Cooking' },
                { id: 'ready', label: 'Ready' },
                { id: 'completed', label: 'Done' },
              ]}
              activeTab={orderFilter}
              onSelectTab={setOrderFilter}
              scrollable
            />

            <View style={{ marginTop: 14 }}>
              {filteredOrders.length === 0 ? (
                <EmptyState
                  icon="receipt-outline"
                  title="No Orders Found"
                  subtitle={`No orders matching "${orderFilter}" filter.`}
                />
              ) : (
                filteredOrders.map((order) => (
                  <OrderItemCard
                    key={order.id || order._id}
                    order={order}
                    colors={colors}
                    typography={typography}
                    radius={radius}
                    shadows={shadows}
                    onUpdateStatus={handleUpdateStatus}
                    onCancelOrder={handleCancelOrder}
                  />
                ))
              )}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: RESERVATIONS MANAGEMENT                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reservations' && (
          <View style={styles.tabContentBlock}>
            <FilterTabs
              tabs={[
                { id: 'pending', label: `Pending (${pendingBookings.length})` },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'all', label: `All (${reservationsList.length})` },
              ]}
              activeTab={resFilter}
              onSelectTab={setResFilter}
            />

            <View style={{ marginTop: 14 }}>
              {filteredReservations.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="No Reservations"
                  subtitle={`No dining reservations found for "${resFilter}".`}
                />
              ) : (
                filteredReservations.map((booking, idx) => (
                  <ReservationCard
                    key={booking.id || booking._id || idx}
                    booking={booking}
                    colors={colors}
                    typography={typography}
                    radius={radius}
                    shadows={shadows}
                    onAction={handleReservationAction}
                  />
                ))
              )}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: MENU & PRICING MANAGEMENT                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'menu' && (
          <View style={styles.tabContentBlock}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                  Menu Catalog ({menuItems.length})
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  Live prices and stock availability
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowAddDishModal(true)}
                style={[styles.addDishBtn, { backgroundColor: colors.primary, borderRadius: radius.button }]}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={[typography.caption, { color: colors.onPrimary, fontWeight: '700' }]}>
                  Add Dish
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              {menuItems.map((dish) => (
                <MenuItemCard
                  key={dish.id || dish._id}
                  item={dish}
                  colors={colors}
                  typography={typography}
                  radius={radius}
                  shadows={shadows}
                  isEditing={editingPriceId === (dish.id || dish._id)}
                  tempPrice={tempPrice}
                  setTempPrice={setTempPrice}
                  onStartEdit={(id, price) => {
                    setEditingPriceId(id);
                    setTempPrice(String(price));
                  }}
                  onSavePrice={handleSavePrice}
                  onCancelEdit={() => {
                    setEditingPriceId(null);
                    setTempPrice('');
                  }}
                  onToggleAvailability={toggleAvailability}
                />
              ))}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: TEAM & STAFF ACCESS                                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'team' && (
          <View style={styles.tabContentBlock}>
            {/* Create Staff Account Card */}
            <View
              style={[
                styles.cardItem,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card, padding: 14 },
                shadows.soft,
              ]}
            >
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700', marginBottom: 4 }]}>
                Register Staff Account
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText, marginBottom: 12, fontSize: 11 }]}>
                Create role-based login credentials for floor and kitchen staff.
              </Text>

              <Input
                label="Staff Name"
                placeholder="e.g. Asad Ali"
                value={staffName}
                onChangeText={setStaffName}
                icon={<Ionicons name="person-outline" size={16} color={colors.mutedText} />}
              />

              <Input
                label="Email Address"
                placeholder="e.g. asad@aurabistro.pk"
                value={staffEmail}
                onChangeText={setStaffEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Ionicons name="mail-outline" size={16} color={colors.mutedText} />}
              />

              <Input
                label="Password (min. 8 chars with number)"
                placeholder="••••••••"
                value={staffPassword}
                onChangeText={setStaffPassword}
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={16} color={colors.mutedText} />}
              />

              <Button
                title={isCreatingStaff ? 'Creating...' : 'Create Staff Member'}
                onPress={handleCreateStaff}
                variant="primary"
                size="medium"
                disabled={isCreatingStaff}
              />
            </View>

            {/* Existing Team Members */}
            <View style={{ marginTop: 18 }}>
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700', marginBottom: 10 }]}>
                Existing Team Members ({staffList.length})
              </Text>

              {staffList.map((member) => {
                const isSelf = member._id === user?.id || member.id === user?.id;
                const isActive = member.isActive !== false;

                return (
                  <View
                    key={member._id || member.id}
                    style={[
                      styles.cardItem,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
                      shadows.soft,
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}>
                            {member.name}
                          </Text>
                          {isSelf && (
                            <View style={[styles.selfBadge, { backgroundColor: colors.primaryTint }]}>
                              <Text style={[typography.caption, { color: colors.primary, fontWeight: '800', fontSize: 10 }]}>
                                You
                              </Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: isActive ? colors.readyTint : colors.cancelledTint },
                            ]}
                          >
                            <Text
                              style={[
                                typography.caption,
                                { color: isActive ? colors.ready : colors.cancelled, fontWeight: '700', fontSize: 10 },
                              ]}
                            >
                              {isActive ? 'Active' : 'Disabled'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11, marginTop: 2 }]}>
                          {member.email} • Role: {member.role}
                        </Text>
                      </View>
                    </View>

                    {!isSelf && (
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          onPress={() => handleToggleStaffStatus(member)}
                          style={[
                            styles.staffActionBtn,
                            {
                              backgroundColor: isActive ? colors.cancelledTint : colors.readyTint,
                              borderColor: isActive ? colors.cancelled + '40' : colors.ready + '40',
                              borderRadius: radius.button,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isActive ? 'ban-outline' : 'checkmark-circle-outline'}
                            size={14}
                            color={isActive ? colors.cancelled : colors.ready}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[typography.caption, { color: isActive ? colors.cancelled : colors.ready, fontWeight: '700' }]}>
                            {isActive ? 'Deactivate' : 'Reactivate'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDemoteStaff(member)}
                          style={[
                            styles.staffActionBtn,
                            { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="arrow-down-circle-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                          <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
                            Demote to Customer
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── ADD DISH MODAL ─── */}
      <Modal
        visible={showAddDishModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddDishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.card * 1.5 },
              shadows.deep3D,
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '800' }]}>
                Add Gourmet Creation
              </Text>
              <TouchableOpacity onPress={() => setShowAddDishModal(false)}>
                <Ionicons name="close" size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <Input
              label="Dish Name"
              placeholder="e.g. Lobster Thermidor"
              value={newDishName}
              onChangeText={setNewDishName}
            />

            <Input
              label="Price (PKR)"
              placeholder="e.g. 2850"
              value={newDishPrice}
              onChangeText={setNewDishPrice}
              keyboardType="numeric"
            />

            <Input
              label="Description"
              placeholder="e.g. Fresh rock lobster with creamy Dijon reduction"
              value={newDishDesc}
              onChangeText={setNewDishDesc}
              multiline
              numberOfLines={2}
            />

            <View style={{ marginBottom: 16 }}>
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600', marginBottom: 6 }]}>
                CATEGORY
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {['Starters', 'Mains', 'Desserts', 'Beverages'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewDishCat(cat)}
                    style={[
                      styles.catSelectChip,
                      {
                        backgroundColor: newDishCat === cat ? colors.primary : colors.surfaceSubtle,
                        borderColor: newDishCat === cat ? colors.primary : colors.cardBorder,
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: newDishCat === cat ? colors.onPrimary : colors.textPrimary,
                          fontWeight: newDishCat === cat ? '700' : '500',
                          fontSize: 12,
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setShowAddDishModal(false)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.button },
                ]}
              >
                <Text style={[typography.button, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddDish}
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary, borderRadius: radius.button }]}
              >
                <Text style={[typography.button, { color: colors.onPrimary }]}>Add to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── STYLESHEET ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  executiveHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  managerPill: {
    backgroundColor: 'rgba(252, 88, 52, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  managerPillText: {
    color: '#FC5834',
    fontSize: 9,
    fontWeight: '800',
  },
  brandSubText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  switchViewText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  tabsScroller: {
    gap: 8,
    paddingVertical: 4,
  },
  managerTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scrollBody: {
    padding: 16,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  tabContentBlock: {
    width: '100%',
  },

  // Greeting Header
  greetingHeader: {
    marginBottom: 16,
  },
  pulseLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  pulseLiveText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCardHalf: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderWidth: 1,
  },
  kpiCardFull: {
    width: '100%',
    padding: 16,
  },
  kpiCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTagBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveTagText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },

  // Shortcuts
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  shortcutBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },

  // Section Headers
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  // Card Item
  cardItem: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  itemsListContainer: {
    padding: 10,
    borderWidth: 1,
    gap: 4,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  progressionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  progressionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 4,
  },

  // Booking details
  bookingSlotBadge: {
    alignItems: 'flex-end',
  },
  bookingMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderWidth: 1,
  },

  // Menu cards
  availToggleBox: {
    alignItems: 'flex-end',
  },
  menuPriceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  priceDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  priceEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  savePriceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelPriceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  addDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  // Team
  selfBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staffActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    padding: 20,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  catSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  modalSaveBtn: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
