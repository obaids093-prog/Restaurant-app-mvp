import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './loginStyles';

export default function GuestBrowseFooter({
  navigation,
  colors,
  fonts,
}) {
  return (
    <>
      {/* ─── OR Divider ─── */}
      <View style={styles.orDividerRow}>
        <View style={[styles.orDividerLine, { backgroundColor: colors.cardBorder }]} />
        <Text style={[styles.orDividerText, { color: colors.mutedText, fontFamily: fonts.medium }]}>
          OR
        </Text>
        <View style={[styles.orDividerLine, { backgroundColor: colors.cardBorder }]} />
      </View>

      {/* Guest Browse — Clean centered CTA like Uber Eats / Foodpanda */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CustomerApp')}
        style={[
          styles.guestBrowseBtn,
          {
            borderColor: colors.primary + '30',
            backgroundColor: colors.primaryTint || (colors.primary + '08'),
          },
        ]}
        activeOpacity={0.75}
        accessibilityLabel="Browse menu as guest"
      >
        <Ionicons name="compass-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text
          style={[
            styles.guestBrowseText,
            { color: colors.primary, fontFamily: fonts.semiBold },
          ]}
        >
          Browse Menu as Guest
        </Text>
        <Ionicons name="arrow-forward" size={15} color={colors.primary} style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      {/* Discreet Legal Notice */}
      <Text
        style={[
          styles.legalNoticeText,
          { color: colors.textSecondary, fontFamily: fonts.regular },
        ]}
      >
        By continuing, you agree to AURA's Terms of Dining and Privacy Charter.
      </Text>
    </>
  );
}
