import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';

import LoginScreen from '../screens/LoginScreen';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ReservationScreen from '../screens/ReservationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManagerDashboardScreen from '../screens/ManagerDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomerTabs() {
  const { colors } = useTheme();
  const { totalItemCount } = useCart();
  const { orders } = useOrders();
  const insets = useSafeAreaInsets();
  const hasActiveOrder = orders?.some((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status));

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface, elevation: 2, shadowOpacity: 0.05 },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '800', fontSize: 17 },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'fast-food' : 'fast-food-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Culinary Tray',
          tabBarLabel: 'Tray',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ width: size, height: size, margin: 2 }}>
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
              {totalItemCount > 0 && (
                <View style={[styles.badgePill, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgePillText}>{totalItemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Reservations"
        component={ReservationScreen}
        options={{
          title: 'Table Booking',
          tabBarLabel: 'Reserve',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TrackTab"
        component={OrderTrackingScreen}
        options={{
          title: 'Live Kitchen Tracking',
          tabBarLabel: 'Track',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ width: size, height: size, margin: 2 }}>
              <Ionicons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={size}
                color={hasActiveOrder ? colors.primary : color}
              />
              {hasActiveOrder && (
                <View style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Guest Account',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { user, isLoadingAuth } = useAuth();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.surfaceBorder,
      primary: colors.primary,
    },
  };

  if (isLoadingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.role === 'manager' ? (
          <Stack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} />
        ) : (
          <>
            <Stack.Screen name="CustomerApp" component={CustomerTabs} />
            <Stack.Screen
              name="OrderSummary"
              component={OrderSummaryScreen}
              options={{
                headerShown: true,
                title: 'Confirm Order',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="OrderTracking"
              component={OrderTrackingScreen}
              options={{
                headerShown: true,
                title: 'Live Kitchen Tracking',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.textPrimary,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badgePill: {
    position: 'absolute',
    right: -8,
    top: -4,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
