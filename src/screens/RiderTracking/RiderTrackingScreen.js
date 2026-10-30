import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRiderTracking } from '../../hooks/useRiderTracking';
import LiveMapCanvas from './LiveMapCanvas';
import RiderInfoCard from './RiderInfoCard';
import DeliveryMilestones from './DeliveryMilestones';
import { styles } from './riderTrackingStyles';

export default function RiderTrackingScreen({ route, navigation }) {
  const { colors, isDark, shadows, typography, fonts } = useTheme();
  const { orderId } = route.params || {};

  const { tracking, isLoading, error, refreshTracking } = useRiderTracking(orderId);

  const handleCallRestaurant = () => {
    const restaurantPhone = '+92 42 35789123';
    const url = `tel:${restaurantPhone.replace(/\s+/g, '')}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Contact Outlet', `Please call ${restaurantPhone}`);
        }
      })
      .catch(() => {
        Alert.alert('Contact Outlet', `Please call ${restaurantPhone}`);
      });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.subtleBorder },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text
            style={[
              typography.headingSm,
              { color: colors.textPrimary, fontWeight: '800', fontFamily: fonts?.bold },
            ]}
          >
            Live GPS Tracking
          </Text>

          <View style={[styles.livePill, { backgroundColor: colors.primaryTint }]}>
            <View style={[styles.livePulseDot, { backgroundColor: colors.primary }]} />
            <Text
              style={[
                typography.caption,
                { color: colors.primary, fontWeight: '800', fontSize: 10 },
              ]}
            >
              {tracking?.orderNumber || 'LIVE RIDER'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={refreshTracking}
          activeOpacity={0.7}
          style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Screen Body */}
      {isLoading && !tracking ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              typography.caption,
              { color: colors.mutedText, marginTop: 12, fontFamily: fonts?.medium },
            ]}
          >
            Connecting to live rider GPS satellite...
          </Text>
        </View>
      ) : !tracking && error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedText} style={{ marginBottom: 12 }} />
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
            ]}
          >
            Unable to Connect to Telemetry
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.mutedText, textAlign: 'center', marginBottom: 16 },
            ]}
          >
            {error || 'Could not retrieve live GPS rider position.'}
          </Text>
          <TouchableOpacity
            onPress={refreshTracking}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={[typography.caption, { color: colors.onPrimary, fontWeight: '700' }]}>
              Retry Connection
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Interactive Live Map Canvas */}
          <LiveMapCanvas
            tracking={tracking}
            colors={colors}
            isDark={isDark}
            shadows={shadows}
            typography={typography}
            fonts={fonts}
          />

          {/* Delivery Milestones & Progress */}
          <DeliveryMilestones
            tracking={tracking}
            colors={colors}
            shadows={shadows}
            typography={typography}
            fonts={fonts}
          />

          {/* Rider Partner Profile Card */}
          <RiderInfoCard
            rider={tracking?.rider}
            colors={colors}
            shadows={shadows}
            typography={typography}
            fonts={fonts}
          />

          {/* Restaurant Assistance Callout */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 18,
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.surfaceSubtle,
              alignItems: 'center',
            }}
          >
            <Text
              style={[
                typography.caption,
                { color: colors.mutedText, textAlign: 'center', marginBottom: 10 },
              ]}
            >
              Need to modify food preparation or gate instructions?
            </Text>
            <TouchableOpacity
              onPress={handleCallRestaurant}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Ionicons
                name="restaurant-outline"
                size={16}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  typography.caption,
                  { color: colors.textPrimary, fontWeight: '700', fontFamily: fonts?.bold },
                ]}
              >
                Call Restaurant Host
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
