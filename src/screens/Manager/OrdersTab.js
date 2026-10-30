import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs, EmptyState } from '../../components/ui';
import OrderItemCard from './OrderItemCard';
import { styles } from './managerStyles';

export default function OrdersTab({
  orders,
  filteredOrders,
  orderFilter,
  setOrderFilter,
  orderBranchFilter,
  setOrderBranchFilter,
  colors,
  typography,
  radius,
  shadows,
  handleUpdateStatus,
  handleCancelOrder,
}) {
  const navigation = useNavigation();
  return (
    <View style={styles.tabContentBlock}>
      {/* Multi-Branch Filter Pills */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {[
          { id: 'all', label: 'All Outlets' },
          { id: 'lahore', label: '📍 Lahore' },
          { id: 'islamabad', label: '📍 Islamabad' },
        ].map((b) => {
          const isSelected = orderBranchFilter === b.id;
          return (
            <TouchableOpacity
              key={b.id}
              onPress={() => setOrderBranchFilter(b.id)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.cardBorder,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isSelected ? colors.onPrimary : colors.textSecondary,
                }}
              >
                {b.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Kitchen Display System Launch Banner */}
      <TouchableOpacity
        onPress={() => navigation.navigate('KitchenDisplay')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 12,
          backgroundColor: `${colors.primary}18`,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: `${colors.primary}40`,
          marginBottom: 12,
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Launch Kitchen Display System"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="tv-outline" size={22} color={colors.primary} />
          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
              Chef Kitchen Display System (KDS)
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Multi-station bump screen & timer rail for line cooks
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </TouchableOpacity>

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
  );
}
