import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './riderTrackingStyles';

export default function RiderInfoCard({
  rider,
  colors,
  shadows,
  typography,
  fonts,
}) {
  const riderName = rider?.name || 'Hamza Khan';
  const riderPhone = rider?.phone || '+92 300 8472910';
  const riderVehicle = rider?.vehicle || 'Honda CG 125 • LEK-4921';
  const riderRating = rider?.rating || 4.9;
  const riderPhoto = rider?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80';

  const handleCallRider = () => {
    const cleanPhone = riderPhone.replace(/\s+/g, '');
    const url = `tel:${cleanPhone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Call Rider', `Please dial ${riderPhone} directly from your phone.`);
        }
      })
      .catch(() => {
        Alert.alert('Call Rider', `Please dial ${riderPhone} directly.`);
      });
  };

  const handleMessageRider = () => {
    const cleanPhone = riderPhone.replace(/\s+/g, '');
    const url = `sms:${cleanPhone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Message Partner', `Send SMS to ${riderPhone}`);
        }
      })
      .catch(() => {
        Alert.alert('Message Partner', `Send SMS to ${riderPhone}`);
      });
  };

  return (
    <View
      style={[
        styles.riderCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        shadows.soft,
      ]}
    >
      <View style={styles.riderTopRow}>
        <Image
          source={{ uri: riderPhoto }}
          style={[styles.riderAvatar, { borderColor: colors.primary }]}
        />

        <View style={styles.riderInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={[
                typography.headingSm,
                { color: colors.textPrimary, fontWeight: '700', fontFamily: fonts?.bold },
              ]}
              numberOfLines={1}
            >
              {riderName}
            </Text>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.ready}
              style={{ marginLeft: 6 }}
            />
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={colors.secondary} style={{ marginRight: 3 }} />
            <Text
              style={[
                typography.caption,
                { color: colors.textPrimary, fontWeight: '700', marginRight: 8 },
              ]}
            >
              {riderRating}
            </Text>
            <Text style={[typography.caption, { color: colors.mutedText }]}>
              • 1,240+ deliveries
            </Text>
          </View>

          <Text
            style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}
            numberOfLines={1}
          >
            {riderVehicle}
          </Text>
        </View>
      </View>

      {/* Safety & Thermal Bag Pill */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceSubtle,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          marginTop: 12,
        }}
      >
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.ready} style={{ marginRight: 6 }} />
        <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11 }]}>
          Insulated thermal container • 100% tamper-evident seal
        </Text>
      </View>

      {/* Direct Contact Buttons */}
      <View style={[styles.riderActionRow, { borderTopColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          onPress={handleCallRider}
          activeOpacity={0.8}
          style={[styles.callBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="call" size={16} color={colors.onPrimary} style={{ marginRight: 6 }} />
          <Text
            style={[
              typography.caption,
              { color: colors.onPrimary, fontWeight: '700', fontFamily: fonts?.bold },
            ]}
          >
            Call Partner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMessageRider}
          activeOpacity={0.8}
          style={[
            styles.messageBtn,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={16}
            color={colors.textPrimary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              typography.caption,
              { color: colors.textPrimary, fontWeight: '700', fontFamily: fonts?.bold },
            ]}
          >
            Send Note
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
