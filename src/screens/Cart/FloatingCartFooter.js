import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../utils/SafeLinearGradient';
import { brand } from '../../config/brand';
import { styles } from './cartStyles';

export default function FloatingCartFooter({
  itemCount,
  grandTotal,
  colors,
  shadows,
  typography,
  onProceed,
}) {
  return (
    <View
      style={[
        styles.floatingBottomBar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.cardBorder,
        },
        shadows.medium3D,
      ]}
    >
      <View style={styles.floatingBarInner}>
        <View>
          <Text style={[typography.caption, { color: colors.mutedText }]}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in Tray
          </Text>
          <Text style={[typography.headingSm, { color: colors.primary, fontWeight: '800' }]}>
            {brand.formatPrice(grandTotal)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onProceed}
          style={[
            styles.floatingProceedBtn,
            { backgroundColor: colors.primary },
            shadows.button3D,
          ]}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={colors.gradientPrimary || [colors.primary, colors.primaryPressed || '#E04A27']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.floatingProceedGradient}
          >
            <Text style={[styles.floatingProceedText, { color: colors.onPrimary }]}>
              Review Order
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
