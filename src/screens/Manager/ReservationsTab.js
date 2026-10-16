import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FilterTabs, EmptyState } from '../../components/ui';
import ReservationCard from './ReservationCard';
import { styles } from './managerStyles';

export default function ReservationsTab({
  reservationsList,
  filteredReservations,
  pendingBookings,
  resFilter,
  setResFilter,
  resBranchFilter,
  setResBranchFilter,
  colors,
  typography,
  radius,
  shadows,
  handleReservationAction,
}) {
  return (
    <View style={styles.tabContentBlock}>
      {/* Multi-Branch Filter Pills for Reservations */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {[
          { id: 'all', label: 'All Outlets' },
          { id: 'lahore', label: '📍 Lahore' },
          { id: 'islamabad', label: '📍 Islamabad' },
        ].map((b) => {
          const isSelected = resBranchFilter === b.id;
          return (
            <TouchableOpacity
              key={b.id}
              onPress={() => setResBranchFilter(b.id)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.cardBorder,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected ? colors.onPrimary : colors.textPrimary,
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: 11,
                  },
                ]}
              >
                {b.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FilterTabs
        tabs={[
          { id: 'pending', label: `Pending (${pendingBookings.length})` },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'cancelled', label: 'Cancelled' },
          { id: 'completed', label: 'Visited' },
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
  );
}
