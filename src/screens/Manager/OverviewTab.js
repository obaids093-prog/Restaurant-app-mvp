import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../config/brand';
import { useManagerAnalytics } from '../../hooks/useManagerAnalytics';
import HourlyBarChart from './HourlyBarChart';
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
  orders,
  setActiveTab,
  handleUpdateStatus,
  handleCancelOrder,
}) {
  const {
    data: analytics,
    range,
    setRange,
    isLoading,
    error,
    refetch,
  } = useManagerAnalytics('today');

  const ranges = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
  ];

  return (
    <View style={styles.tabContentBlock}>
      {/* Executive Greeting */}
      <View style={styles.greetingHeader}>
        <View style={styles.pulseLivePill}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.pulseLiveText}>Kitchen Active • Live Dispatch</Text>
        </View>
        <Text
          style={[
            typography.headingLg,
            { color: colors.textPrimary, fontWeight: '800', marginTop: 6 },
          ]}
        >
          Welcome, {user?.name || 'Chef General Manager'}
        </Text>
        <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}>
          Executive Dashboard • Real-time Business Intelligence
        </Text>
      </View>

      {/* Range Switcher (Today | 7d | 30d) */}
      <View style={localStyles.rangeSwitcherContainer}>
        {ranges.map((r) => {
          const isSelected = range === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              onPress={() => setRange(r.id)}
              activeOpacity={0.8}
              style={[
                localStyles.rangeBtn,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                  borderRadius: radius.pill || 20,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Analytics Content / Loading / Error / Empty States */}
      {isLoading && !analytics ? (
        <View
          style={[
            localStyles.stateBox,
            { backgroundColor: colors.surfaceSubtle, borderRadius: radius.card },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[typography.caption, { color: colors.mutedText, marginTop: 8 }]}>
            Aggregating executive metrics...
          </Text>
        </View>
      ) : error ? (
        <View
          style={[
            localStyles.stateBox,
            {
              backgroundColor: isDark ? '#2A1B1B' : '#FEF2F2',
              borderRadius: radius.card,
              borderColor: '#F87171',
              borderWidth: 1,
            },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text
            style={[typography.caption, { color: '#EF4444', marginTop: 4, textAlign: 'center' }]}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={refetch}
            activeOpacity={0.8}
            style={[
              localStyles.retryBtn,
              { backgroundColor: colors.primary, borderRadius: radius.button },
            ]}
          >
            <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '700' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : analytics && analytics.totalOrders === 0 ? (
        <View
          style={[
            localStyles.stateBox,
            { backgroundColor: colors.surfaceSubtle, borderRadius: radius.card },
          ]}
        >
          <Ionicons name="stats-chart-outline" size={28} color={colors.mutedText} />
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, fontWeight: '700', marginTop: 8 },
            ]}
          >
            No orders yet in this time window
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.mutedText, marginTop: 2, textAlign: 'center' },
            ]}
          >
            Live order metrics and hourly rush graphs will appear as patrons place orders.
          </Text>
        </View>
      ) : (
        <>
          {/* Executive KPI Cards Grid */}
          <View style={styles.kpiGrid}>
            {/* Card 1: Revenue (Full Width) */}
            <View
              style={[
                styles.kpiCardFull,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#2A2A2A',
                  borderRadius: radius.card * 1.2,
                },
                shadows.deep3D,
              ]}
            >
              <View style={styles.kpiCardTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cash-outline" size={18} color="#FBBF24" />
                  <Text style={[typography.caption, { color: '#D0D0D0', fontWeight: '600' }]}>
                    Settled Revenue ({range.toUpperCase()})
                  </Text>
                </View>
                <View style={styles.liveTagBadge}>
                  <Text style={styles.liveTagText}>Excl. Cancelled</Text>
                </View>
              </View>
              <Text
                style={[
                  typography.display,
                  { color: '#FFFFFF', fontWeight: '800', marginVertical: 6, fontSize: 26 },
                ]}
              >
                {brand.formatPrice(analytics?.revenue || 0)}
              </Text>
              <Text style={[typography.caption, { color: '#94A3B8', fontSize: 11 }]}>
                AOV: {brand.formatPrice(analytics?.averageOrderValue || 0)} •{' '}
                {analytics?.orderCount || 0} Successful Orders
              </Text>
            </View>

            {/* Card 2: Orders Count */}
            <View
              style={[
                styles.kpiCardHalf,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.cardBorder,
                  borderRadius: radius.card,
                },
                shadows.soft,
              ]}
            >
              <View style={styles.kpiCardTopRow}>
                <Text style={[typography.caption, { color: colors.mutedText, fontWeight: '600' }]}>
                  Total Volume
                </Text>
                <View style={[styles.kpiIconCircle, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                </View>
              </View>
              <Text
                style={[
                  typography.display,
                  { color: colors.textPrimary, fontWeight: '800', marginVertical: 4 },
                ]}
              >
                {analytics?.orderCount || 0}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                {analytics?.ordersByStatus?.Served || 0} Served •{' '}
                {analytics?.ordersByStatus?.Preparing || 0} In Kitchen
              </Text>
            </View>

            {/* Card 3: Repeat Patrons */}
            <View
              style={[
                styles.kpiCardHalf,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.cardBorder,
                  borderRadius: radius.card,
                },
                shadows.soft,
              ]}
            >
              <View style={styles.kpiCardTopRow}>
                <Text style={[typography.caption, { color: colors.mutedText, fontWeight: '600' }]}>
                  Repeat Patrons
                </Text>
                <View
                  style={[
                    styles.kpiIconCircle,
                    { backgroundColor: colors.readyTint || 'rgba(16, 185, 129, 0.15)' },
                  ]}
                >
                  <Ionicons name="repeat-outline" size={16} color="#10B981" />
                </View>
              </View>
              <Text
                style={[
                  typography.display,
                  { color: colors.textPrimary, fontWeight: '800', marginVertical: 4 },
                ]}
              >
                {analytics?.repeatCustomers || 0}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                Multi-order diner loyalty
              </Text>
            </View>
          </View>

          {/* Orders by Status Row */}
          <View
            style={[
              localStyles.statusBreakdownCard,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.cardBorder,
                borderRadius: radius.card,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: colors.mutedText, fontWeight: '700', marginBottom: 8 },
              ]}
            >
              STATUS DISTRIBUTION
            </Text>
            <View style={localStyles.statusPillsRow}>
              {[
                {
                  label: 'Pending',
                  count: analytics?.ordersByStatus?.Pending || 0,
                  color: '#F59E0B',
                },
                {
                  label: 'Preparing',
                  count: analytics?.ordersByStatus?.Preparing || 0,
                  color: '#3B82F6',
                },
                { label: 'Ready', count: analytics?.ordersByStatus?.Ready || 0, color: '#10B981' },
                {
                  label: 'Served',
                  count: analytics?.ordersByStatus?.Served || 0,
                  color: colors.primary,
                },
                {
                  label: 'Cancelled',
                  count: analytics?.ordersByStatus?.Cancelled || 0,
                  color: '#EF4444',
                },
              ].map((st) => (
                <View
                  key={st.label}
                  style={[
                    localStyles.statusMiniPill,
                    { backgroundColor: isDark ? '#262626' : '#FFFFFF' },
                  ]}
                >
                  <Text style={[localStyles.statusMiniCount, { color: st.color }]}>{st.count}</Text>
                  <Text style={[localStyles.statusMiniLabel, { color: colors.textSecondary }]}>
                    {st.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Hourly Order Rush Bar Chart */}
          <HourlyBarChart
            hourlyData={analytics?.hourly || []}
            colors={colors}
            typography={typography}
            radius={radius}
            isDark={isDark}
          />

          {/* Top 5 Dishes by Quantity & Revenue */}
          {Array.isArray(analytics?.topDishes) && analytics.topDishes.length > 0 && (
            <View
              style={[
                localStyles.topDishesCard,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.cardBorder,
                  borderRadius: radius.card,
                },
              ]}
            >
              <View style={localStyles.topDishesHeader}>
                <Text
                  style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}
                >
                  Top Selling Dishes
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  By popularity
                </Text>
              </View>

              {analytics.topDishes.map((dish, i) => (
                <View
                  key={dish.name}
                  style={[
                    localStyles.topDishRow,
                    i > 0 && {
                      borderTopColor: colors.cardBorder,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View
                    style={[
                      localStyles.dishRankBadge,
                      {
                        backgroundColor:
                          i === 0 ? colors.primaryTint : isDark ? '#262626' : '#F4F2FD',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        localStyles.dishRankText,
                        { color: i === 0 ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      #{i + 1}
                    </Text>
                  </View>
                  <View style={localStyles.dishInfo}>
                    <Text
                      style={[typography.caption, { color: colors.textPrimary, fontWeight: '600' }]}
                      numberOfLines={1}
                    >
                      {dish.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                      {dish.quantity} sold
                    </Text>
                  </View>
                  <Text
                    style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}
                  >
                    {brand.formatPrice(dish.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

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
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.cardBorder,
                borderRadius: radius.card,
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name={item.icon} size={20} color={colors.primary} />
            <Text
              style={[
                typography.caption,
                { color: colors.textPrimary, fontWeight: '700', marginTop: 4 },
              ]}
            >
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
          <Text
            style={[
              typography.caption,
              { color: colors.mutedText, textAlign: 'center', marginVertical: 20 },
            ]}
          >
            No active cooking tickets currently in the pipeline.
          </Text>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  rangeSwitcherContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  rangeBtn: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stateBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statusBreakdownCard: {
    padding: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  statusPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  statusMiniPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusMiniCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusMiniLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  topDishesCard: {
    padding: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  topDishesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topDishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  dishRankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishRankText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dishInfo: {
    flex: 1,
  },
});
