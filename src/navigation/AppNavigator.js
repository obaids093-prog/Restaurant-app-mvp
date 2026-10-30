import React, { useRef, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import TabBar from '../components/ui/TabBar';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ReservationScreen from '../screens/ReservationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManagerDashboardScreen from '../screens/ManagerDashboardScreen';
import OrderPlacedScreen from '../screens/OrderPlacedScreen';
import NotificationScreen from '../screens/NotificationScreen';
import RiderTrackingScreen from '../screens/RiderTrackingScreen';
import { navigationRef } from './navigationRef';
export { navigationRef };

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomerTabs() {
  const { colors, typography } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.subtleBorder,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          ...typography.headingSm,
          color: colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Reservations"
        component={ReservationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
        }}
      />
      <Tab.Screen
        name="TrackTab"
        component={OrderTrackingScreen}
        options={{
          title: 'Live Kitchen Tracking',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark, typography } = useTheme();
  const { user } = useAuth();

  // Watch for auth state changes:
  // - If user logs out (non-null -> null), reset stack to Login
  // - If user logs in (null -> non-null) while on Login/Onboarding, reset stack to CustomerApp / ManagerDashboard
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user && navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else if (!prevUserRef.current && user && navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute();
      if (currentRoute?.name === 'Login' || currentRoute?.name === 'Onboarding') {
        if (user.role === 'manager') {
          navigationRef.reset({ index: 0, routes: [{ name: 'ManagerDashboard' }] });
        } else {
          navigationRef.reset({ index: 0, routes: [{ name: 'CustomerApp' }] });
        }
      }
    }
    prevUserRef.current = user;
  }, [user]);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.subtleBorder,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="CustomerApp"
          component={CustomerTabs}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="ManagerDashboard"
          component={ManagerDashboardScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="OrderSummary"
          component={OrderSummaryScreen}
          options={{
            headerShown: true,
            title: 'Confirm Order',
            headerStyle: {
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.subtleBorder,
            },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              ...typography.headingSm,
              color: colors.textPrimary,
            },
          }}
        />
        <Stack.Screen
          name="OrderTracking"
          component={OrderTrackingScreen}
          options={{
            headerShown: true,
            title: 'Live Kitchen Tracking',
            headerStyle: {
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.subtleBorder,
            },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              ...typography.headingSm,
              color: colors.textPrimary,
            },
          }}
        />
        <Stack.Screen
          name="OrderPlaced"
          component={OrderPlacedScreen}
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="RiderTracking"
          component={RiderTrackingScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
