import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrders } from '../context/OrdersContext';
import { useMenu } from '../context/MenuContext';
import { useApi } from '../hooks/useApi';
import apiClient from '../api/client';

const getOrderStatusBg = (status, colors) => {
  if (status === 'Served') return colors.successBackground;
  if (status === 'Ready') return '#E0F2FE';
  if (status === 'Preparing') return '#FEF3C7';
  return colors.badge;
};

const getOrderStatusColor = (status, colors) => {
  if (status === 'Served') return colors.success;
  if (status === 'Ready') return '#0284C7';
  if (status === 'Preparing') return '#D97706';
  return colors.badgeText;
};

const getReservationStatusBg = (status, colors) => {
  if (status === 'Confirmed') return colors.successBackground;
  if (status === 'Declined' || status === 'Cancelled') return colors.errorBackground;
  return colors.badge;
};

const getReservationStatusColor = (status, colors) => {
  if (status === 'Confirmed') return colors.success;
  if (status === 'Declined' || status === 'Cancelled') return colors.error;
  return colors.badgeText;
};

// ─── SUBCOMPONENT: ORDER ITEM CARD ──────────────────────────────────────────
function OrderItemCard({ order, colors, shadows, onUpdateStatus, onCancelOrder }) {
  const isPending = order.status === 'Pending';
  const isPrep = order.status === 'Preparing';
  const isReady = order.status === 'Ready';

  return (
    <View
      style={[
        styles.cardItem,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={[styles.orderRef, { color: colors.primary }]}>{order.id}</Text>
          <Text style={[styles.customerRef, { color: colors.textPrimary }]}>
            Guest: {order.customerName}
          </Text>
          <Text style={[styles.orderTypeDesc, { color: colors.textSecondary }]}>
            {order.type === 'Dine-in'
              ? `Dine-in • ${order.tableNumber || 'Table 4'}`
              : `Takeaway • ${order.pickupTime || '20 min'}`}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: getOrderStatusBg(order.status, colors) },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              { color: getOrderStatusColor(order.status, colors) },
            ]}
          >
            {order.status}
          </Text>
        </View>
      </View>

      {/* Items in order */}
      <View style={[styles.itemsBox, { backgroundColor: colors.surfaceSubtle }]}>
        {(order.items || []).map((item, idx) => (
          <Text
            key={item.id || item._id || item.menuItem || `${item.name}-${idx}`}
            style={[styles.itemLine, { color: colors.textPrimary }]}
          >
            • {item.quantity}x {item.name}{' '}
            {item.note ? `(Note: "${item.note}")` : ''}
          </Text>
        ))}
        <Text style={[styles.totalAmountText, { color: colors.primary }]}>
          Grand Total: Rs. {(order.total ?? order.totalAmount ?? 0).toLocaleString()}
        </Text>
      </View>

      {/* Action Buttons to manually change status */}
      <View style={styles.orderActionsRow}>
        {isPending && (
          <TouchableOpacity
            onPress={() => onUpdateStatus(order.id, 'Preparing')}
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
          >
            <Ionicons name="flame" size={14} color="#FFF" />
            <Text style={styles.actionBtnText}>Start Cooking</Text>
          </TouchableOpacity>
        )}

        {isPrep && (
          <TouchableOpacity
            onPress={() => onUpdateStatus(order.id, 'Ready')}
            style={[styles.actionBtn, { backgroundColor: '#0284C7' }]}
          >
            <Ionicons name="checkmark-circle" size={14} color="#FFF" />
            <Text style={styles.actionBtnText}>Mark Ready</Text>
          </TouchableOpacity>
        )}

        {isReady && (
          <TouchableOpacity
            onPress={() => onUpdateStatus(order.id, 'Served')}
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
          >
            <Ionicons name="checkmark-done" size={14} color="#FFF" />
            <Text style={styles.actionBtnText}>Mark Served</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => onCancelOrder(order.id)}
          style={[styles.cancelBtn, { borderColor: colors.error + '40' }]}
        >
          <Text style={[styles.cancelBtnText, { color: colors.error }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── SUBCOMPONENT: RESERVATION ITEM CARD ────────────────────────────────────
function ReservationItemCard({ booking, colors, shadows, onAction }) {
  const bookingId = booking._id || booking.id;
  const tableName = booking.table
    ? `Table ${booking.table.tableNumber} (${booking.table.zone || 'Dining Area'})`
    : booking.tableName || 'Assigned Table';
  const timeSlot = booking.time || booking.timeSlot || '19:00';
  const guestsCount = booking.guests || booking.partySize || 2;

  return (
    <View
      style={[
        styles.cardItem,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={[styles.orderRef, { color: colors.primary }]}>{bookingId}</Text>
          <Text style={[styles.customerRef, { color: colors.textPrimary }]}>
            {booking.customerName} ({booking.phone || 'No phone'})
          </Text>
          <Text style={[styles.orderTypeDesc, { color: colors.textSecondary }]}>
            {booking.date} at {timeSlot} • {guestsCount} Guests
          </Text>
          <Text style={[styles.orderTypeDesc, { color: colors.textPrimary }]}>
            {tableName}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: getReservationStatusBg(booking.status, colors) },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              { color: getReservationStatusColor(booking.status, colors) },
            ]}
          >
            {booking.status}
          </Text>
        </View>
      </View>

      {booking.specialRequests ? (
        <Text style={[styles.specialReqNote, { color: colors.textMuted }]}>
          Special Note: "{booking.specialRequests}"
        </Text>
      ) : null}

      {/* Accept / Decline — only show when Pending */}
      {booking.status === 'Pending' && (
        <View style={styles.orderActionsRow}>
          <TouchableOpacity
            onPress={() => onAction(bookingId, 'Confirmed')}
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
          >
            <Ionicons name="checkmark" size={14} color="#FFF" />
            <Text style={styles.actionBtnText}>Confirm Table</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onAction(bookingId, 'Declined')}
            style={[styles.actionBtn, { backgroundColor: colors.error }]}
          >
            <Ionicons name="close" size={14} color="#FFF" />
            <Text style={styles.actionBtnText}>Decline</Text>
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
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      <View style={styles.menuItemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dishName, { color: colors.textPrimary }]}>
            {item.name}
          </Text>
          <Text style={[styles.dishCat, { color: colors.textMuted }]}>
            Category: {item.category}
          </Text>
        </View>

        {/* Availability Toggle Switch */}
        <View style={styles.availToggleBox}>
          <Text
            style={[
              styles.availLabel,
              { color: item.isAvailable ? colors.success : colors.error },
            ]}
          >
            {item.isAvailable ? 'In Stock' : 'Sold Out'}
          </Text>
          <Switch
            value={item.isAvailable}
            onValueChange={() => onToggleAvailability(item.id)}
            trackColor={{ false: '#D1C4B8', true: colors.success }}
          />
        </View>
      </View>

      {/* Price Display & Edit */}
      <View style={styles.priceRow}>
        {isEditing ? (
          <View style={styles.priceEditRow}>
            <TextInput
              style={[
                styles.priceInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.primary,
                  color: colors.textPrimary,
                },
              ]}
              value={tempPrice}
              onChangeText={setTempPrice}
              keyboardType="numeric"
              placeholder="New Price"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              onPress={() => onSavePrice(item.id)}
              style={[styles.savePriceBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.savePriceText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancelEdit}
              style={styles.cancelPriceBtn}
            >
              <Text style={[styles.cancelPriceText, { color: colors.textMuted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.priceDisplayRow}>
            <Text style={[styles.currentPrice, { color: colors.primary }]}>
              Price: Rs. {item.price.toLocaleString()}
            </Text>
            <TouchableOpacity
              onPress={() => onStartEdit(item.id, item.price)}
              style={[
                styles.editPriceBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Ionicons name="pencil" size={13} color={colors.primary} />
              <Text style={[styles.editPriceText, { color: colors.primary }]}>
                Edit Price
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── SUBCOMPONENT: TEAM MANAGEMENT TAB ──────────────────────────────────────
function TeamManagementTab({
  colors,
  shadows,
  staffName,
  setStaffName,
  staffEmail,
  setStaffEmail,
  staffPassword,
  setStaffPassword,
  isCreatingStaff,
  createdStaff,
  onCreateStaff,
}) {
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollList}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.cardItem,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          <Text style={[styles.consoleTitle, { color: colors.textPrimary, fontSize: 16 }]}>
            Create Staff Account
          </Text>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
          New staff members are created with the Manager role and can access the Operations Console.
        </Text>

        <TextInput
          style={[
            styles.modalInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Full Name"
          placeholderTextColor={colors.textMuted}
          value={staffName}
          onChangeText={setStaffName}
        />
        <TextInput
          style={[
            styles.modalInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Email Address"
          placeholderTextColor={colors.textMuted}
          value={staffEmail}
          onChangeText={setStaffEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View
          style={[
            styles.passwordBox,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <TextInput
            style={[styles.passwordInput, { color: colors.textPrimary }]}
            placeholder="Temporary Password (min 8 chars, 1 digit)"
            placeholderTextColor={colors.textMuted}
            value={staffPassword}
            onChangeText={setStaffPassword}
            secureTextEntry={!showStaffPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowStaffPassword((prev) => !prev)}
            style={styles.eyeBtn}
            accessibilityLabel={showStaffPassword ? 'Hide password' : 'Show password'}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showStaffPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onCreateStaff}
          disabled={isCreatingStaff}
          style={[
            styles.modalSubmit,
            { backgroundColor: colors.primary, opacity: isCreatingStaff ? 0.6 : 1, marginTop: 8 },
          ]}
        >
          <Ionicons name="shield-checkmark-outline" size={16} color="#FFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '800', marginLeft: 6 }}>
            {isCreatingStaff ? 'Creating...' : 'Create Manager Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {createdStaff.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.consoleTitle, { color: colors.textPrimary, fontSize: 14, marginBottom: 10 }]}>
            Recently Added Staff
          </Text>
          {createdStaff.map((staff) => (
            <View
              key={staff._id}
              style={[
                styles.cardItem,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                shadows.soft,
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.statusPill, { backgroundColor: colors.successBackground }]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.customerRef, { color: colors.textPrimary }]}>
                    {staff.name}
                  </Text>
                  <Text style={[styles.orderTypeDesc, { color: colors.textSecondary }]}>
                    {staff.email} • {staff.role}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── SUBCOMPONENT: ADD DISH MODAL ───────────────────────────────────────────
function AddDishModal({
  visible,
  onClose,
  colors,
  shadows,
  newItemName,
  setNewItemName,
  newItemPrice,
  setNewItemPrice,
  newItemDesc,
  setNewItemDesc,
  newItemCat,
  setNewItemCat,
  newItemSpecial,
  setNewItemSpecial,
  onAddDish,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.deep3D,
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Add New Gourmet Creation
          </Text>

          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Dish Name (e.g. Lobster Thermidor)"
            placeholderTextColor={colors.textMuted}
            value={newItemName}
            onChangeText={setNewItemName}
          />

          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Price in Rs. (e.g. 2950)"
            placeholderTextColor={colors.textMuted}
            value={newItemPrice}
            onChangeText={setNewItemPrice}
            keyboardType="numeric"
          />

          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
                minHeight: 60,
              },
            ]}
            placeholder="Description of ingredients & preparation..."
            placeholderTextColor={colors.textMuted}
            value={newItemDesc}
            onChangeText={setNewItemDesc}
            multiline
          />

          {/* Category Picker */}
          <View style={styles.catPickerRow}>
            {['Starters', 'Mains', 'Desserts', 'Drinks'].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setNewItemCat(cat)}
                style={[
                  styles.catChoiceBtn,
                  {
                    backgroundColor:
                      newItemCat === cat ? colors.primary : colors.surfaceSubtle,
                    borderColor:
                      newItemCat === cat ? colors.primary : colors.surfaceBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catChoiceText,
                    { color: newItemCat === cat ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Featured Special Toggle */}
          <View style={styles.specialToggleRow}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
              Featured Chef's Special
            </Text>
            <Switch
              value={newItemSpecial}
              onValueChange={setNewItemSpecial}
              trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.modalCancel,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAddDish}
              style={[styles.modalSubmit, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Publish Dish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN COMPONENT ──────────────────────────────────────────────────
export default function ManagerDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { colors, isDark, shadows } = useTheme();
  const { orders, updateOrderStatus, cancelOrder } = useOrders();
  const { menuItems, toggleAvailability, updatePrice, addMenuItem } = useMenu();

  const {
    data: reservationsData,
    refetch: refetchReservations,
  } = useApi('/api/reservations');

  const reservationsList = Array.isArray(reservationsData) ? reservationsData : [];

  // Active Manager Tab
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'reservations' | 'menu' | 'team'

  // Team tab: create staff accounts
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [createdStaff, setCreatedStaff] = useState([]);

  // Local state for editing prices
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  // Add Item Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCat, setNewItemCat] = useState('Mains');
  const [newItemSpecial, setNewItemSpecial] = useState(false);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      const msg = `Order marked as "${nextStatus}".`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Status Updated', msg);
      }
    } catch (err) {
      const msg = err.message || 'Could not update status.';
      if (Platform.OS === 'web') {
        window.alert('Failed: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  const handlePriceSave = (itemId) => {
    if (!tempPrice || Number.isNaN(Number(tempPrice)) || Number(tempPrice) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid numeric price.');
      return;
    }
    updatePrice(itemId, Number(tempPrice));
    setEditingPriceId(null);
    setTempPrice('');
    Alert.alert('Price Updated', 'Menu item price successfully updated.');
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim() || !newItemPrice || Number.isNaN(Number(newItemPrice))) {
      Alert.alert('Incomplete Data', 'Please provide a valid dish name and price.');
      return;
    }

    addMenuItem({
      name: newItemName.trim(),
      description: newItemDesc.trim() || 'Chef specialty made fresh upon order.',
      price: Number(newItemPrice),
      category: newItemCat,
      isSpecial: newItemSpecial,
    });

    setShowAddModal(false);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemSpecial(false);
    Alert.alert('Dish Added', `${newItemName} is now live on the customer menu!`);
  };

  const handleReservationAction = async (id, newStatus) => {
    try {
      await apiClient(`/api/reservations/${id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      await refetchReservations();
      const msg = `Booking marked as ${newStatus}.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Reservation Updated', msg);
      }
    } catch (err) {
      const msg = err.message || 'Could not update reservation status.';
      if (Platform.OS === 'web') {
        window.alert('Update Failed: ' + msg);
      } else {
        Alert.alert('Update Failed', msg);
      }
    }
  };

  const handleCreateStaff = async () => {
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      Alert.alert('Incomplete', 'Please fill in name, email, and password for the new staff member.');
      return;
    }
    if (staffPassword.length < 8 || !/\d/.test(staffPassword)) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters and include at least one number.');
      return;
    }
    setIsCreatingStaff(true);
    try {
      const result = await apiClient('/api/auth/staff', {
        method: 'POST',
        body: {
          name: staffName.trim(),
          email: staffEmail.trim().toLowerCase(),
          password: staffPassword.trim(),
        },
      });
      setCreatedStaff((prev) => [result.user, ...prev]);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      const msg = `Manager account created for ${result.user.name} (${result.user.email}).`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Staff Created', msg);
      }
    } catch (err) {
      const msg = err.message || 'Could not create staff account.';
      if (Platform.OS === 'web') {
        window.alert('Failed: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsCreatingStaff(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* TOP HEADER */}
      <View
        style={[
          styles.headerCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.titleInfo}>
            <Text style={[styles.consoleTitle, { color: colors.textPrimary }]}>
              Kitchen & Operations Console
            </Text>
            <Text style={[styles.managerName, { color: colors.primary }]}>
              Logged in as: {user?.name || 'Chef Marcus Vance'} (Operations GM)
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={logout}
              style={[
                styles.switchViewBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
              ]}
            >
              <Ionicons name="log-out-outline" size={14} color={colors.error} />
              <Text style={[styles.switchViewText, { color: colors.error }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4 TAB SWITCHER BUTTONS */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
          ]}
        >
          {/* TAB 1: ORDERS */}
          <TouchableOpacity
            onPress={() => setActiveTab('orders')}
            style={[
              styles.tabBtn,
              activeTab === 'orders' && [
                styles.activeTabBtn,
                { backgroundColor: colors.surface },
                shadows.soft,
              ],
            ]}
          >
            <Ionicons
              name="fast-food-outline"
              size={16}
              color={activeTab === 'orders' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'orders' ? colors.primary : colors.textMuted },
              ]}
            >
              Orders ({orders.length})
            </Text>
          </TouchableOpacity>

          {/* TAB 2: RESERVATIONS */}
          <TouchableOpacity
            onPress={() => setActiveTab('reservations')}
            style={[
              styles.tabBtn,
              activeTab === 'reservations' && [
                styles.activeTabBtn,
                { backgroundColor: colors.surface },
                shadows.soft,
              ],
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={activeTab === 'reservations' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'reservations' ? colors.primary : colors.textMuted },
              ]}
            >
              Tables ({reservationsList.length})
            </Text>
          </TouchableOpacity>

          {/* TAB 3: MENU */}
          <TouchableOpacity
            onPress={() => setActiveTab('menu')}
            style={[
              styles.tabBtn,
              activeTab === 'menu' && [
                styles.activeTabBtn,
                { backgroundColor: colors.surface },
                shadows.soft,
              ],
            ]}
          >
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={activeTab === 'menu' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'menu' ? colors.primary : colors.textMuted },
              ]}
            >
              Menu Stock
            </Text>
          </TouchableOpacity>

          {/* TAB 4: TEAM */}
          <TouchableOpacity
            onPress={() => setActiveTab('team')}
            style={[
              styles.tabBtn,
              activeTab === 'team' && [
                styles.activeTabBtn,
                { backgroundColor: colors.surface },
                shadows.soft,
              ],
            ]}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'team' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'team' ? colors.primary : colors.textMuted },
              ]}
            >
              Team
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: INCOMING KITCHEN ORDERS */}
      {activeTab === 'orders' && (
        <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
          {orders.map((order) => (
            <OrderItemCard
              key={order.id}
              order={order}
              colors={colors}
              shadows={shadows}
              onUpdateStatus={handleUpdateStatus}
              onCancelOrder={cancelOrder}
            />
          ))}
        </ScrollView>
      )}

      {/* TAB 2: TABLE RESERVATIONS */}
      {activeTab === 'reservations' && (
        <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
          {reservationsList.length === 0 ? (
            <View style={[styles.cardItem, { backgroundColor: colors.card, alignItems: 'center', padding: 24 }]}>
              <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: 12 }}>
                No Table Bookings Found
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                Customer reservations from the app will appear here in real time.
              </Text>
            </View>
          ) : (
            reservationsList.map((booking) => (
              <ReservationItemCard
                key={booking._id || booking.id}
                booking={booking}
                colors={colors}
                shadows={shadows}
                onAction={handleReservationAction}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* TAB 3: MENU INVENTORY */}
      {activeTab === 'menu' && (
        <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addNewItemBtn, shadows.button3D]}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.addNewItemGradient}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addNewItemText}>Add New Gourmet Dish</Text>
            </LinearGradient>
          </TouchableOpacity>

          {menuItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              colors={colors}
              shadows={shadows}
              isEditing={editingPriceId === item.id}
              tempPrice={tempPrice}
              setTempPrice={setTempPrice}
              onStartEdit={(id, price) => {
                setEditingPriceId(id);
                setTempPrice(String(price));
              }}
              onSavePrice={handlePriceSave}
              onCancelEdit={() => setEditingPriceId(null)}
              onToggleAvailability={toggleAvailability}
            />
          ))}
        </ScrollView>
      )}

      {/* TAB 4: TEAM MANAGEMENT */}
      {activeTab === 'team' && (
        <TeamManagementTab
          colors={colors}
          shadows={shadows}
          staffName={staffName}
          setStaffName={setStaffName}
          staffEmail={staffEmail}
          setStaffEmail={setStaffEmail}
          staffPassword={staffPassword}
          setStaffPassword={setStaffPassword}
          isCreatingStaff={isCreatingStaff}
          createdStaff={createdStaff}
          onCreateStaff={handleCreateStaff}
        />
      )}

      {/* ADD ITEM MODAL */}
      <AddDishModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        colors={colors}
        shadows={shadows}
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        newItemPrice={newItemPrice}
        setNewItemPrice={setNewItemPrice}
        newItemDesc={newItemDesc}
        setNewItemDesc={setNewItemDesc}
        newItemCat={newItemCat}
        setNewItemCat={setNewItemCat}
        newItemSpecial={newItemSpecial}
        setNewItemSpecial={setNewItemSpecial}
        onAddDish={handleAddNewItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleInfo: {
    flex: 1,
  },
  consoleTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  managerName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  switchViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  switchViewText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  activeTabBtn: {},
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  cardItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderRef: {
    fontSize: 15,
    fontWeight: '800',
  },
  customerRef: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  orderTypeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemsBox: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  itemLine: {
    fontSize: 13,
    marginBottom: 3,
  },
  totalAmountText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
    paddingTop: 4,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  specialReqNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  addNewItemBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  addNewItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addNewItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishName: {
    fontSize: 15,
    fontWeight: '700',
  },
  dishCat: {
    fontSize: 12,
    marginTop: 2,
  },
  availToggleBox: {
    alignItems: 'flex-end',
  },
  availLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  priceRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  priceDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  editPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  editPriceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priceEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    width: 100,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  savePriceBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  savePriceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelPriceBtn: {
    padding: 6,
  },
  cancelPriceText: {
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  catPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  catChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  catChoiceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  specialToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalSubmit: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
