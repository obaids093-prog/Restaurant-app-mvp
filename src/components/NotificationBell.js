import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useNotificationContext } from '../context/NotificationContext';

export default function NotificationBell({ iconColor = null, size = 22, style = null }) {
  const navigation = useNavigation();
  const { colors, fonts } = useTheme();
  const { unreadCount } = useNotificationContext();

  const bellColor = iconColor || colors.textPrimary;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Notifications, ${unreadCount} unread`}
      onPress={() => navigation.navigate('Notifications')}
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={size} color={bellColor} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.cancelled || '#E53935' }]}>
          <Text style={[styles.badgeText, { fontFamily: fonts.bold }]}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
});
