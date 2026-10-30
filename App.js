import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { MenuProvider } from './src/context/MenuContext';
import { CartProvider } from './src/context/CartContext';
import { OrdersProvider } from './src/context/OrdersContext';
import { BranchProvider } from './src/context/BranchContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { BranchPickerModal } from './src/components/ui';
import { NotificationBannerToast } from './src/components/NotificationBannerToast';
import { ServerWakingBanner } from './src/components/ServerWakingBanner';
import AppNavigator from './src/navigation/AppNavigator';

function MainApp({ fontsLoaded }) {
  const { isDark, colors } = useTheme();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
      <BranchPickerModal />
      <NotificationBannerToast />
      <ServerWakingBanner />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BranchProvider>
              <MenuProvider>
                <CartProvider>
                  <OrdersProvider>
                    <NotificationProvider>
                      <MainApp fontsLoaded={fontsLoaded} />
                    </NotificationProvider>
                  </OrdersProvider>
                </CartProvider>
              </MenuProvider>
            </BranchProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
