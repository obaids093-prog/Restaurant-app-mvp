import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './paymentStyles';

export default function OtpVerificationModal({
  visible,
  transaction,
  onVerify,
  onCancel,
  isVerifying,
}) {
  const { colors } = useTheme();
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (visible) {
      setOtp('123456'); // pre-fill demo OTP for convenience
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const methodColor =
    transaction?.method === 'jazzcash'
      ? '#D32F2F'
      : transaction?.method === 'easypaisa'
      ? '#2E7D32'
      : '#1565C0';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[styles.modalIconCircle, { backgroundColor: `${methodColor}20` }]}>
            <Ionicons name="shield-checkmark" size={32} color={methodColor} />
          </View>

          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            3D-Secure Verification
          </Text>

          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            A 6-digit confirmation code was sent to{' '}
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
              {transaction?.maskedAccount || 'your account'}
            </Text>{' '}
            for Rs. {transaction?.amount?.toLocaleString() || '0'}.
          </Text>

          <View style={[styles.demoNoticeBox, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.demoNoticeText, { color: colors.primary }]}>
              Demo Sandbox Code: 123456
            </Text>
          </View>

          <TextInput
            style={[
              styles.otpInput,
              {
                backgroundColor: colors.surface,
                borderColor: methodColor,
                color: colors.textPrimary,
              },
            ]}
            value={otp}
            onChangeText={(txt) => setOtp(txt.replace(/\D/g, '').slice(0, 6))}
            keyboardType="numeric"
            maxLength={6}
            placeholder="123456"
            placeholderTextColor={colors.mutedText}
          />

          <Text
            style={{
              fontSize: 12,
              color: colors.mutedText,
              marginBottom: 20,
            }}
          >
            Resend code in {countdown}s
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              disabled={isVerifying}
              style={[
                styles.cancelBtn,
                { borderColor: colors.cardBorder, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onVerify(otp)}
              disabled={isVerifying || otp.length < 6}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: methodColor,
                  opacity: isVerifying || otp.length < 6 ? 0.6 : 1,
                },
              ]}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.btnText, { color: '#FFFFFF' }]}>
                  Confirm Payment
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
