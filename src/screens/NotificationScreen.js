import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotificationContext } from '../context/NotificationContext';

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function NotificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, fonts, radius, shadows } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    refreshNotifications,
    loadMore,
    markAsRead,
    markAllRead,
  } = useNotificationContext();

  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_status':
        return { name: 'restaurant', color: colors.primary };
      case 'review_reply':
        return { name: 'chatbubbles', color: '#3B82F6' };
      case 'loyalty_tier_up':
        return { name: 'trophy', color: '#F59E0B' };
      case 'loyalty_points':
        return { name: 'gift', color: '#10B981' };
      case 'voucher_expiring':
        return { name: 'ticket', color: '#EC4899' };
      case 'welcome':
        return { name: 'sparkles', color: '#8B5CF6' };
      default:
        return { name: 'notifications', color: colors.primary };
    }
  };

  const handleNotificationPress = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    // Deep navigation if notification links to an order
    if (item.refModel === 'Order' && item.refId) {
      navigation.navigate('OrderTracking', { orderId: item.refId });
    }
  };

  const renderItem = ({ item }) => {
    const { name: iconName, color: iconColor } = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.card,
          {
            backgroundColor: item.isRead
              ? isDark
                ? '#1A1A1A'
                : '#FFFFFF'
              : isDark
              ? '#2A241E'
              : '#FFF8F0',
            borderColor: item.isRead
              ? colors.subtleBorder || '#333'
              : colors.primary + '40',
            borderRadius: radius.md || 12,
          },
          shadows.cardLight,
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: iconColor + '20', borderRadius: radius.sm || 8 },
            ]}
          >
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>

          <View style={styles.contentColumn}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.textPrimary,
                    fontFamily: item.isRead ? fonts.semiBold : fonts.bold,
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </View>

            <Text
              style={[
                styles.body,
                { color: colors.mutedText || '#888', fontFamily: fonts.regular },
              ]}
              numberOfLines={3}
            >
              {item.body}
            </Text>

            <Text
              style={[
                styles.time,
                { color: colors.mutedText || '#888', fontFamily: fonts.medium },
              ]}
            >
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.surface,
            borderBottomColor: colors.subtleBorder,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { color: colors.textPrimary, fontFamily: fonts.bold },
            ]}
          >
            Notifications
          </Text>

          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} style={styles.readAllButton}>
              <Text
                style={[
                  styles.readAllText,
                  { color: colors.primary, fontFamily: fonts.semiBold },
                ]}
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilterUnreadOnly(false)}
            style={[
              styles.filterPill,
              !filterUnreadOnly
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? '#2C2C2C' : '#EFEFEF' },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: !filterUnreadOnly ? '#FFFFFF' : colors.textPrimary,
                  fontFamily: fonts.semiBold,
                },
              ]}
            >
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterUnreadOnly(true)}
            style={[
              styles.filterPill,
              filterUnreadOnly
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? '#2C2C2C' : '#EFEFEF' },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filterUnreadOnly ? '#FFFFFF' : colors.textPrimary,
                  fontFamily: fonts.semiBold,
                },
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText, fontFamily: fonts.medium }]}>
            Loading notifications...
          </Text>
        </View>
      ) : displayedNotifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: isDark ? '#2C2C2C' : '#F3F4F6' },
            ]}
          >
            <Ionicons
              name={filterUnreadOnly ? 'checkmark-circle-outline' : 'notifications-off-outline'}
              size={48}
              color={colors.mutedText || '#999'}
            />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.textPrimary, fontFamily: fonts.bold },
            ]}
          >
            {filterUnreadOnly ? 'All Caught Up!' : 'No Notifications Yet'}
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: colors.mutedText || '#888', fontFamily: fonts.regular },
            ]}
          >
            {filterUnreadOnly
              ? 'You have read all your alerts and order updates.'
              : 'Kitchen updates, chef notes, and loyalty awards will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedNotifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshNotifications}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  readAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  readAllText: {
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 14,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    flex: 1,
    marginRight: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontSize: 11,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
