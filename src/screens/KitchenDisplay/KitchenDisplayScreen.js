import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useOrders } from '../../context/OrdersContext';
import { LiveSocketBadge } from '../../components/LiveSocketBadge';
import { styles } from './kdsStyles';

const STATIONS = [
  { id: 'all', label: 'All Stations', icon: 'layers-outline' },
  { id: 'mains', label: 'Grill & Mains', icon: 'flame-outline' },
  { id: 'apps', label: 'Appetizers', icon: 'restaurant-outline' },
  { id: 'desserts', label: 'Dessert & Pastry', icon: 'ice-cream-outline' },
  { id: 'drinks', label: 'Bar & Beverages', icon: 'wine-outline' },
];

export default function KitchenDisplayScreen({ navigation }) {
  const { colors, isDark, shadows, typography } = useTheme();
  const { orders, updateOrderStatus, fetchOrders, isLoading } = useOrders();

  const [activeStation, setActiveStation] = useState('all');
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bumpingOrderId, setBumpingOrderId] = useState(null);

  // Live digital clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling kitchen tickets every 5 seconds
  useEffect(() => {
    const poll = setInterval(() => {
      if (fetchOrders) fetchOrders().catch(() => {});
    }, 5000);
    return () => clearInterval(poll);
  }, [fetchOrders]);

  // Filter active tickets (Pending, Preparing, Ready)
  const kitchenTickets = useMemo(() => {
    return (orders || [])
      .filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status))
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [orders]);

  // Station filtering based on item category or keywords
  const filteredTickets = useMemo(() => {
    if (activeStation === 'all') return kitchenTickets;
    return kitchenTickets.filter((order) => {
      const items = order.items || [];
      return items.some((item) => {
        const name = (item.name || '').toLowerCase();
        if (activeStation === 'mains') {
          return name.includes('wagyu') || name.includes('burger') || name.includes('steak') || name.includes('pasta') || name.includes('chicken');
        }
        if (activeStation === 'apps') {
          return name.includes('slider') || name.includes('fries') || name.includes('soup') || name.includes('salad') || name.includes('wing');
        }
        if (activeStation === 'desserts') {
          return name.includes('tiramisu') || name.includes('chocolate') || name.includes('cake') || name.includes('gelato');
        }
        if (activeStation === 'drinks') {
          return name.includes('mocktail') || name.includes('shake') || name.includes('coffee') || name.includes('tea') || name.includes('juice');
        }
        return true;
      });
    });
  }, [kitchenTickets, activeStation]);

  // Format elapsed time string
  const getElapsedMinutes = (createdAt) => {
    if (!createdAt) return 0;
    const diffMs = currentTime.getTime() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getTimerConfig = (minutes) => {
    if (minutes >= 20) {
      return {
        bg: '#EF4444',
        text: '#FFFFFF',
        label: 'RUSH / LATE',
        borderColor: '#EF4444',
      };
    }
    if (minutes >= 10) {
      return {
        bg: '#F59E0B',
        text: '#000000',
        label: 'ATTENTION',
        borderColor: '#F59E0B',
      };
    }
    return {
      bg: '#10B981',
      text: '#FFFFFF',
      label: 'ON TRACK',
      borderColor: '#10B981',
    };
  };

  // 1-Tap Bump Bar Action
  const handleBumpTicket = async (order) => {
    const orderId = order.id || order._id;
    if (bumpingOrderId) return;
    setBumpingOrderId(orderId);

    let nextStatus = 'Preparing';
    if (order.status === 'Pending') nextStatus = 'Preparing';
    else if (order.status === 'Preparing') nextStatus = 'Ready';
    else if (order.status === 'Ready') nextStatus = 'Served';

    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      Alert.alert('Kitchen Error', err.message || 'Could not bump order status.');
    } finally {
      setBumpingOrderId(null);
    }
  };

  const rushCount = kitchenTickets.filter((t) => getElapsedMinutes(t.createdAt) >= 20).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header Bar */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.cardBorder },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backBtn,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              AURA Kitchen Display (KDS)
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Live Chef Line • Expediter Station
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Live WebSocket Status Badge */}
          <LiveSocketBadge style={{ marginRight: 8 }} />

          {/* Digital Clock */}
          <View
            style={[
              styles.clockBadge,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.clockText, { color: colors.textPrimary }]}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>

          {/* Chime Toggle */}
          <TouchableOpacity
            onPress={() => setChimeEnabled(!chimeEnabled)}
            style={[
              styles.chimeBtn,
              { backgroundColor: chimeEnabled ? `${colors.primary}20` : colors.surfaceSubtle },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Toggle Kitchen Audio Chime"
          >
            <Ionicons
              name={chimeEnabled ? 'volume-high' : 'volume-mute'}
              size={16}
              color={chimeEnabled ? colors.primary : colors.mutedText}
            />
            <Text
              style={[
                styles.chimeText,
                { color: chimeEnabled ? colors.primary : colors.mutedText },
              ]}
            >
              {chimeEnabled ? 'Chime ON' : 'Muted'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metrics Summary Strip */}
      <View
        style={[
          styles.metricsBar,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
      >
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Live Tickets</Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {kitchenTickets.length}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Pending Prep</Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>
            {kitchenTickets.filter((t) => t.status === 'Pending').length}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Cooking</Text>
          <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
            {kitchenTickets.filter((t) => t.status === 'Preparing').length}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Rush Delay (>20m)</Text>
          <Text
            style={[
              styles.metricValue,
              { color: rushCount > 0 ? '#EF4444' : colors.ready || '#10B981' },
            ]}
          >
            {rushCount}
          </Text>
        </View>
      </View>

      {/* Station Pills Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stationRow}
      >
        {STATIONS.map((station) => {
          const isSelected = activeStation === station.id;
          return (
            <TouchableOpacity
              key={station.id}
              activeOpacity={0.8}
              onPress={() => setActiveStation(station.id)}
              style={[
                styles.stationPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name={station.icon}
                size={14}
                color={isSelected ? colors.onPrimary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.stationText,
                  { color: isSelected ? colors.onPrimary : colors.textPrimary },
                ]}
              >
                {station.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Ticket Cards Grid */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTickets.length === 0 ? (
          <View
            style={[
              styles.emptyStateBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="checkmark-done-circle-outline" size={56} color={colors.ready || '#10B981'} />
            <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
              All Kitchen Tickets Cleared
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
              The expediter rail is calm. Incoming guest creations will chime immediately.
            </Text>
          </View>
        ) : (
          filteredTickets.map((ticket) => {
            const ticketId = String(ticket.id || ticket._id).slice(-4).toUpperCase();
            const elapsedMins = getElapsedMinutes(ticket.createdAt);
            const timerCfg = getTimerConfig(elapsedMins);
            const isBumping = bumpingOrderId === (ticket.id || ticket._id);

            const bumpButtonText =
              ticket.status === 'Pending'
                ? '🔥 Start Cooking'
                : ticket.status === 'Preparing'
                ? '✅ Mark Ready to Expedite'
                : '🍽 Serve & Clear';

            const bumpColor =
              ticket.status === 'Pending'
                ? colors.primary
                : ticket.status === 'Preparing'
                ? '#10B981'
                : '#3B82F6';

            return (
              <View
                key={ticket.id || ticket._id}
                style={[
                  styles.ticketCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: timerCfg.borderColor,
                  },
                  shadows.medium3D,
                ]}
              >
                {/* Ticket Top Header */}
                <View
                  style={[
                    styles.ticketHeader,
                    { borderBottomColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.ticketIdRow}>
                    <Text style={[styles.ticketNumber, { color: colors.textPrimary }]}>
                      #{ticketId}
                    </Text>
                    <View
                      style={[
                        styles.orderTypeBadge,
                        { backgroundColor: `${colors.primary}20` },
                      ]}
                    >
                      <Text style={[styles.orderTypeText, { color: colors.primary }]}>
                        {ticket.orderType || 'Dine-in'}
                      </Text>
                    </View>
                  </View>

                  {/* Elapsed Timer Tag */}
                  <View style={[styles.timerBadge, { backgroundColor: timerCfg.bg }]}>
                    <Ionicons name="time" size={14} color={timerCfg.text} />
                    <Text style={[styles.timerText, { color: timerCfg.text }]}>
                      {elapsedMins}m • {timerCfg.label}
                    </Text>
                  </View>
                </View>

                {/* Ticket Body */}
                <View style={styles.ticketBody}>
                  <View style={styles.tableAllocationRow}>
                    <Text style={[styles.guestText, { color: colors.textSecondary }]}>
                      Guest: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{ticket.customerName || 'Valued Guest'}</Text>
                    </Text>
                    <Text style={[styles.tableText, { color: colors.primary }]}>
                      {ticket.tableNumber || (ticket.orderType === 'Delivery' ? 'Delivery Dispatch' : 'Counter Pickup')}
                    </Text>
                  </View>

                  {/* Items Checklist */}
                  <View style={styles.itemsList}>
                    {(ticket.items || []).map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <View style={[styles.itemQtyBadge, { backgroundColor: colors.surfaceSubtle }]}>
                          <Text style={[styles.itemQtyText, { color: colors.primary }]}>
                            {item.quantity || 1}x
                          </Text>
                        </View>
                        <View style={styles.itemDetails}>
                          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                            {item.name}
                          </Text>
                          {item.specialInstructions || item.note ? (
                            <Text style={[styles.itemNote, { color: '#F59E0B' }]}>
                              ⚡ Note: "{item.specialInstructions || item.note}"
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Bump Action Bar */}
                <View
                  style={[
                    styles.bumpButtonBar,
                    { borderTopColor: colors.cardBorder, backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isBumping}
                    onPress={() => handleBumpTicket(ticket)}
                    style={[styles.bumpBtn, { backgroundColor: bumpColor }]}
                  >
                    {isBumping ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="arrow-forward-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.bumpBtnText}>{bumpButtonText}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
