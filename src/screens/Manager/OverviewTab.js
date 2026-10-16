import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import OrderItemCard from './OrderItemCard';
import { styles } from './managerStyles';

export default function OverviewTab({
  user,
  colors,
  typography,
  radius,
  shadows,
  isDark,
  activeOrders,
  prepOrdersCount,
  readyOrdersCount,
  pendingBookings,
  todayRevenue,
  orders,
  setActiveTab,
  handleUpdateStatus,
  handleCancelOrder,
}) {
  return (
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
          Floor Shift: Dinner Service • Gulberg III
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
            {pendingBookings.length > 0 ? "Awaiting Maître d'" : 'All Tables Confirmed'}
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
  );
}
