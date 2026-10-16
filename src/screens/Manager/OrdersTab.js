import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
