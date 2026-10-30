import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './paymentStyles';

export const METHODS = [
  {
    id: 'jazzcash',
    name: 'JazzCash Mobile Account',
    icon: 'wallet-outline',
    color: '#D32F2F',
    perk: 'Instant 10% Cashback up to Rs. 200',
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa Wallet',
    icon: 'cash-outline',
    color: '#2E7D32',
    perk: 'Instant 0% Fee Mobile Push',
  },
  {
    id: 'card_online',
    name: 'Credit / Debit Card',
    icon: 'card-outline',
    color: '#1565C0',
    perk: 'Visa • Mastercard • PayPak (3D Secure)',
  },
  {
    id: 'pay_at_table',
    name: 'Pay at Table (Dine-in)',
    icon: 'restaurant-outline',
    color: '#D4AF37',
    perk: 'Cash or Card directly with server',
  },
  {
    id: 'cash',
    name: 'Cash on Delivery',
    icon: 'cube-outline',
    color: '#546E7A',
    perk: 'Settle in cash upon arrival',
  },
];

export default function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
  orderType = 'Dine-in',
}) {
  const { colors, typography } = useTheme();

  const isDineIn = String(orderType).toLowerCase().includes('dine');
  const filteredMethods = isDineIn
    ? METHODS.filter((m) => m.id !== 'cash')
    : METHODS.filter((m) => m.id !== 'pay_at_table');

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Payment Method
      </Text>
      <View style={styles.methodsGrid}>
        {filteredMethods.map((m) => {
          const isSelected = selectedMethod === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.85}
              onPress={() => onSelectMethod(m.id)}
              style={[
                styles.methodCard,
                {
                  backgroundColor: isSelected
                    ? colors.cardHover || colors.card
                    : colors.card,
                  borderColor: isSelected ? m.color : colors.cardBorder,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${m.name}: ${m.perk}`}
            >
              <View style={[styles.iconBox, { backgroundColor: `${m.color}15` }]}>
                <Ionicons name={m.icon} size={22} color={m.color} />
              </View>

              <View style={styles.methodContent}>
                <View style={styles.methodNameRow}>
                  <Text style={[styles.methodName, { color: colors.textPrimary }]}>
                    {m.name}
                  </Text>
                </View>
                <Text style={[styles.perkBadge, { color: m.color }]}>
                  {m.perk}
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  { borderColor: isSelected ? m.color : colors.mutedText },
                ]}
              >
                {isSelected && (
                  <View style={[styles.radioInner, { backgroundColor: m.color }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
