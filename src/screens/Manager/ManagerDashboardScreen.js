import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useOrders } from '../../context/OrdersContext';
import { useMenu } from '../../context/MenuContext';
import { useReservation } from '../../hooks/useReservation';
import { useApi } from '../../hooks/useApi';
import apiClient from '../../api/client';
import { brand } from '../../config/brand';
import { pickDishImageFromDevice, uploadDishImageToServer } from '../../utils/imageUpload';

import { styles, showConsoleAlert } from './managerStyles';
import OverviewTab from './OverviewTab';
import OrdersTab from './OrdersTab';
import ReservationsTab from './ReservationsTab';
import MenuStockTab from './MenuStockTab';
import TeamTab from './TeamTab';
import ReviewsTab from './ReviewsTab';
import AddDishModal from './AddDishModal';
import EditDishModal from './EditDishModal';

export default function ManagerDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { colors, typography, radius, shadows, isDark, fonts } = useTheme();
  const insets = useSafeAreaInsets();

  const { orders, updateOrderStatus, cancelOrder, isLoading: ordersLoading, error: ordersError, fetchOrders } = useOrders();
  const { menuItems, updatePrice, updateMenuItem, toggleAvailability, addMenuItem, isLoading: menuLoading, error: menuError, fetchMenu } = useMenu();
  const { reservationsList, refetchReservations, error: resError } = useReservation(user);

  // Active Tab: 'overview' | 'orders' | 'reservations' | 'menu' | 'team' | 'reviews'
  const [activeTab, setActiveTab] = useState('overview');

  // Orders Filter
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderBranchFilter, setOrderBranchFilter] = useState('all');

  // Reservations Filter
  const [resFilter, setResFilter] = useState('pending');
  const [resBranchFilter, setResBranchFilter] = useState('all');

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
  const [newDishImage, setNewDishImage] = useState('');
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);

  // Edit Dish Full Modal states
  const [editingDish, setEditingDish] = useState(null);
  const [editDishName, setEditDishName] = useState('');
  const [editDishDesc, setEditDishDesc] = useState('');
  const [editDishPrice, setEditDishPrice] = useState('');
  const [editDishCat, setEditDishCat] = useState('Mains');
  const [editDishImage, setEditDishImage] = useState('');
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [isSavingDishEdit, setIsSavingDishEdit] = useState(false);

  // Edit Price State
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  // Real KPI Calculations
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

  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return (orders || [])
      .filter((o) => {
        const isCompleted = o.status === 'Served' || o.status === 'Delivered';
        const isToday = o.createdAt?.startsWith(today) || true;
        return isCompleted && isToday;
      })
      .reduce((sum, o) => sum + Number(o.total ?? o.totalAmount ?? o.grandTotal ?? 0), 0);
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    let list = orders || [];
    if (orderFilter === 'pending') list = list.filter((o) => o.status === 'Pending');
    else if (orderFilter === 'preparing') list = list.filter((o) => o.status === 'Preparing');
    else if (orderFilter === 'ready') list = list.filter((o) => o.status === 'Ready');
    else if (orderFilter === 'completed')
      list = list.filter((o) => ['Served', 'Delivered', 'Cancelled'].includes(o.status));

    if (orderBranchFilter !== 'all') {
      list = list.filter((o) => {
        const city = String(o.branchCity || (String(o.branchName || '').toLowerCase().includes('islamabad') ? 'islamabad' : 'lahore')).toLowerCase();
        return city.includes(orderBranchFilter.toLowerCase());
      });
    }

    return list;
  }, [orders, orderFilter, orderBranchFilter]);

  // Filtered Reservations
  const filteredReservations = useMemo(() => {
    let list = reservationsList || [];
    if (resFilter === 'pending') list = list.filter((r) => r.status === 'Pending');
    else if (resFilter === 'confirmed')
      list = list.filter((r) => r.status === 'Confirmed' || r.status === 'Approved');
    else if (resFilter === 'cancelled')
      list = list.filter((r) => r.status === 'Cancelled' || r.status === 'Declined');
    else if (resFilter === 'completed')
      list = list.filter((r) => r.status === 'Completed');

    if (resBranchFilter !== 'all') {
      list = list.filter((r) => {
        const city = String(r.branchCity || (String(r.branchName || '').toLowerCase().includes('islamabad') ? 'islamabad' : 'lahore')).toLowerCase();
        return city.includes(resBranchFilter.toLowerCase());
      });
    }

    return list;
  }, [reservationsList, resFilter, resBranchFilter]);

  // Handlers
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

  const handleSavePrice = (dishId) => {
    const num = Number(tempPrice);
    if (Number.isNaN(num) || num <= 0) {
      showConsoleAlert('Invalid Price', 'Please enter a valid numeric price.');
      return;
    }
    updatePrice(dishId, num);
    setEditingPriceId(null);
    setTempPrice('');
    showConsoleAlert('Price Updated', 'Menu item price successfully modified in catalog.');
  };

  const handleAddDish = () => {
    if (!newDishName.trim() || !newDishPrice || Number.isNaN(Number(newDishPrice))) {
      showConsoleAlert('Incomplete', 'Please provide a valid dish name and price.');
      return;
    }

    addMenuItem({
      name: newDishName.trim(),
      description: newDishDesc.trim() || 'Chef specialty made fresh upon order.',
      price: Number(newDishPrice),
      category: newDishCat,
      image: newDishImage.trim() || undefined,
      isAvailable: true,
    });

    setShowAddDishModal(false);
    setNewDishName('');
    setNewDishDesc('');
    setNewDishPrice('');
    setNewDishImage('');
    showConsoleAlert('Dish Added', `${newDishName} is now active on the menu!`);
  };

  const handlePickAndUploadNewImage = async () => {
    try {
      const asset = await pickDishImageFromDevice();
      if (!asset) return;
      setIsUploadingNewImage(true);
      const data = await uploadDishImageToServer(asset);
      setNewDishImage(data.imageUrl);
      showConsoleAlert('Photo Uploaded', 'Dish photo auto-compressed (4:3 ratio) and ready!');
    } catch (err) {
      showConsoleAlert('Upload Failed', err.message || 'Could not upload photo.');
    } finally {
      setIsUploadingNewImage(false);
    }
  };

  const handleOpenEditDish = (dish) => {
    setEditingDish(dish);
    setEditDishName(dish.name || '');
    setEditDishDesc(dish.description || '');
    setEditDishPrice(dish.price !== undefined ? String(dish.price) : '');
    setEditDishCat(dish.category || 'Mains');
    setEditDishImage(dish.image || '');
  };

  const handlePickAndUploadEditImage = async () => {
    try {
      const asset = await pickDishImageFromDevice();
      if (!asset) return;
      setIsUploadingEditImage(true);
      const data = await uploadDishImageToServer(asset);
      setEditDishImage(data.imageUrl);
      showConsoleAlert('Photo Uploaded', 'Dish photo auto-compressed (4:3 ratio) and ready!');
    } catch (err) {
      showConsoleAlert('Upload Failed', err.message || 'Could not upload photo.');
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  const handleSaveEditDish = async () => {
    if (!editingDish) return;
    if (!editDishName.trim() || !editDishPrice || Number.isNaN(Number(editDishPrice))) {
      showConsoleAlert('Incomplete', 'Please provide a valid dish name and price.');
      return;
    }

    setIsSavingDishEdit(true);
    try {
      await updateMenuItem(editingDish.id || editingDish._id, {
        name: editDishName.trim(),
        description: editDishDesc.trim(),
        price: Number(editDishPrice),
        category: editDishCat,
        image: editDishImage.trim() || editingDish.image,
      });
      showConsoleAlert('Dish Updated', `"${editDishName.trim()}" has been updated successfully.`);
      setEditingDish(null);
      setEditDishImage('');
    } catch (err) {
      showConsoleAlert('Update Failed', err.message || 'Could not update dish details.');
    } finally {
      setIsSavingDishEdit(false);
    }
  };

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

  // Loading State
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

  // Error State
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
            <View style={{ flex: 1, marginRight: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.brandTitleText}>AURA</Text>
                <View style={styles.managerPill}>
                  <Text style={styles.managerPillText}>MANAGER</Text>
                </View>
              </View>
              <Text style={styles.brandSubText} numberOfLines={1}>
                {brand.city || 'Lahore & Islamabad'} • Executive Console
              </Text>
            </View>
          </View>

          {/* Quick Nav / Exit Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CustomerApp')}
              style={styles.switchViewBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={13} color="#FFFFFF" />
              <Text style={styles.switchViewText}>App View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm?.('Log out from Manager Console?')) {
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
            { id: 'reviews', label: 'Reviews', icon: 'star-outline' },
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
        {activeTab === 'overview' && (
          <OverviewTab
            user={user}
            colors={colors}
            typography={typography}
            radius={radius}
            shadows={shadows}
            isDark={isDark}
            activeOrders={activeOrders}
            prepOrdersCount={prepOrdersCount}
            readyOrdersCount={readyOrdersCount}
            pendingBookings={pendingBookings}
            todayRevenue={todayRevenue}
            orders={orders}
            setActiveTab={setActiveTab}
            handleUpdateStatus={handleUpdateStatus}
            handleCancelOrder={handleCancelOrder}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            filteredOrders={filteredOrders}
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            orderBranchFilter={orderBranchFilter}
            setOrderBranchFilter={setOrderBranchFilter}
            colors={colors}
            typography={typography}
            radius={radius}
            shadows={shadows}
            handleUpdateStatus={handleUpdateStatus}
            handleCancelOrder={handleCancelOrder}
          />
        )}

        {activeTab === 'reservations' && (
          <ReservationsTab
            reservationsList={reservationsList}
            filteredReservations={filteredReservations}
            pendingBookings={pendingBookings}
            resFilter={resFilter}
            setResFilter={setResFilter}
            resBranchFilter={resBranchFilter}
            setResBranchFilter={setResBranchFilter}
            colors={colors}
            typography={typography}
            radius={radius}
            shadows={shadows}
            handleReservationAction={handleReservationAction}
          />
        )}

        {activeTab === 'menu' && (
          <MenuStockTab
            menuItems={menuItems}
            colors={colors}
            typography={typography}
            radius={radius}
            shadows={shadows}
            editingPriceId={editingPriceId}
            setEditingPriceId={setEditingPriceId}
            tempPrice={tempPrice}
            setTempPrice={setTempPrice}
            handleSavePrice={handleSavePrice}
            toggleAvailability={toggleAvailability}
            handleOpenEditDish={handleOpenEditDish}
            setShowAddDishModal={setShowAddDishModal}
          />
        )}

        {activeTab === 'team' && (
          <TeamTab
            staffList={staffList}
            staffName={staffName}
            setStaffName={setStaffName}
            staffEmail={staffEmail}
            setStaffEmail={setStaffEmail}
            staffPassword={staffPassword}
            setStaffPassword={setStaffPassword}
            isCreatingStaff={isCreatingStaff}
            handleCreateStaff={handleCreateStaff}
            handleToggleStaffStatus={handleToggleStaffStatus}
            handleDemoteStaff={handleDemoteStaff}
            user={user}
            colors={colors}
            typography={typography}
            radius={radius}
            shadows={shadows}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab
            colors={colors}
            fonts={fonts}
            radius={radius}
            shadows={shadows}
            insets={insets}
          />
        )}
      </ScrollView>

      {/* Add Dish Modal */}
      <AddDishModal
        visible={showAddDishModal}
        onClose={() => setShowAddDishModal(false)}
        newDishName={newDishName}
        setNewDishName={setNewDishName}
        newDishPrice={newDishPrice}
        setNewDishPrice={setNewDishPrice}
        newDishDesc={newDishDesc}
        setNewDishDesc={setNewDishDesc}
        newDishImage={newDishImage}
        setNewDishImage={setNewDishImage}
        newDishCat={newDishCat}
        setNewDishCat={setNewDishCat}
        isUploadingNewImage={isUploadingNewImage}
        handlePickAndUploadNewImage={handlePickAndUploadNewImage}
        handleAddDish={handleAddDish}
        colors={colors}
        typography={typography}
        radius={radius}
        shadows={shadows}
      />

      {/* Edit Dish Modal */}
      <EditDishModal
        visible={!!editingDish}
        onClose={() => setEditingDish(null)}
        editingDish={editingDish}
        editDishName={editDishName}
        setEditDishName={setEditDishName}
        editDishPrice={editDishPrice}
        setEditDishPrice={setEditDishPrice}
        editDishDesc={editDishDesc}
        setEditDishDesc={setEditDishDesc}
        editDishImage={editDishImage}
        setEditDishImage={setEditDishImage}
        editDishCat={editDishCat}
        setEditDishCat={setEditDishCat}
        isUploadingEditImage={isUploadingEditImage}
        handlePickAndUploadEditImage={handlePickAndUploadEditImage}
        handleSaveEditDish={handleSaveEditDish}
        isSavingDishEdit={isSavingDishEdit}
        colors={colors}
        typography={typography}
        radius={radius}
        shadows={shadows}
      />
    </View>
  );
}
