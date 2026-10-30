import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './paymentStyles';

export default function PaymentDetailsForm({
  method,
  formData,
  onChangeField,
  userPhone,
}) {
  const { colors } = useTheme();

  if (method === 'cash' || method === 'pay_at_table') {
    return null;
  }

  const isWallet = method === 'jazzcash' || method === 'easypaisa';

  return (
    <View
      style={[
        styles.formBox,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      {isWallet ? (
        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} Mobile Number
            </Text>
            {userPhone ? (
              <TouchableOpacity
                onPress={() => onChangeField('accountNumber', userPhone)}
                style={{ marginBottom: 6 }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.primary,
                    fontWeight: '600',
                  }}
                >
                  Autofill Phone
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                color: colors.textPrimary,
              },
            ]}
            placeholder="0300 1234567"
            placeholderTextColor={colors.mutedText}
            keyboardType="phone-pad"
            value={formData.accountNumber || ''}
            onChangeText={(txt) => onChangeField('accountNumber', txt)}
          />
        </View>
      ) : (
        <View>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Cardholder Full Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                color: colors.textPrimary,
              },
            ]}
            placeholder="e.g. Sarah Ahmed"
            placeholderTextColor={colors.mutedText}
            value={formData.cardHolder || ''}
            onChangeText={(txt) => onChangeField('cardHolder', txt)}
            autoCapitalize="words"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Card Number
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                color: colors.textPrimary,
              },
            ]}
            placeholder="4242 •••• •••• 4242"
            placeholderTextColor={colors.mutedText}
            keyboardType="numeric"
            maxLength={19}
            value={formData.cardNumber || ''}
            onChangeText={(txt) => {
              // Auto-format card with spaces
              const raw = txt.replace(/\D/g, '').slice(0, 16);
              const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
              onChangeField('cardNumber', formatted);
            }}
          />

          <View style={styles.cardRow}>
            <View style={styles.cardCol}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Expiry (MM/YY)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="12/28"
                placeholderTextColor={colors.mutedText}
                keyboardType="numeric"
                maxLength={5}
                value={formData.cardExpiry || ''}
                onChangeText={(txt) => {
                  let cleaned = txt.replace(/\D/g, '').slice(0, 4);
                  if (cleaned.length > 2) {
                    cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
                  }
                  onChangeField('cardExpiry', cleaned);
                }}
              />
            </View>

            <View style={styles.cardCol}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                CVV / CVC
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="123"
                placeholderTextColor={colors.mutedText}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={formData.cardCvv || ''}
                onChangeText={(txt) => onChangeField('cardCvv', txt.replace(/\D/g, ''))}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
