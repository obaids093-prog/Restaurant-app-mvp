import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, PhoneInput, Button, OtpInput } from '../../components/ui';
import { styles } from './loginStyles';

export default function PhoneOtpStep({
  phoneStep,
  setPhoneStep,
  mode,
  phoneName,
  setPhoneName,
  phoneNumber,
  setPhoneNumber,
  otpValue,
  setOtpValue,
  isSubmitting,
  isAuthSuccess,
  handleSendOtp,
  handleVerifyOtp,
  setAuthMethod,
  setServerError,
  setPhoneError,
  colors,
  fonts,
}) {
  return (
    <View style={styles.fieldsContainer}>
      {phoneStep === 'input' && (
        <>
          {mode === 'signup' && (
            <Input
              label="Your Name (Optional)"
              value={phoneName}
              onChangeText={setPhoneName}
              placeholder="e.g. Zainab Malik"
              icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
          )}

          <PhoneInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!isSubmitting}
          />

          <Button
            title="Send Verification Code"
            onPress={handleSendOtp}
            loading={isSubmitting}
            variant="primary"
            size="large"
            icon={<Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />}
            iconPosition="right"
            style={styles.submitBtn}
          />
        </>
      )}

      {phoneStep === 'otp' && (
        <>
          <View style={styles.otpHeader}>
            <Text
              style={[
                styles.otpTitle,
                { color: colors.textPrimary, fontFamily: fonts.bold },
              ]}
            >
              Enter 6-Digit Code
            </Text>
            <Text
              style={[
                styles.otpSubtitle,
                { color: colors.mutedText, fontFamily: fonts.regular },
              ]}
            >
              Code sent to {phoneNumber}
            </Text>
          </View>

          {/* OtpInput Component */}
          <OtpInput
            code={otpValue}
            length={6}
            onCodeChange={setOtpValue}
          />

          <Button
            title="Verify & Continue"
            onPress={handleVerifyOtp}
            loading={isSubmitting && !isAuthSuccess}
            success={isAuthSuccess}
            variant="primary"
            size="large"
            icon={<Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />}
            iconPosition="right"
            style={styles.submitBtn}
          />

          <View style={styles.otpActionsRow}>
            <TouchableOpacity
              onPress={() => setPhoneStep('input')}
              style={styles.textBtn}
            >
              <Text
                style={[
                  styles.textBtnLabel,
                  { color: colors.mutedText, fontFamily: fonts.medium },
                ]}
              >
                Change Number
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSendOtp} style={styles.textBtn}>
              <Text
                style={[
                  styles.textBtnLabel,
                  { color: colors.primary, fontFamily: fonts.semiBold },
                ]}
              >
                Resend Code
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Link: Continue with Email & Password */}
      <TouchableOpacity
        onPress={() => {
          setAuthMethod('email');
          setServerError(null);
          setPhoneError('');
        }}
        style={styles.switchAuthBtn}
        activeOpacity={0.7}
      >
        <Ionicons name="mail-outline" size={16} color={colors.primary} />
        <Text
          style={[
            styles.switchAuthText,
            { color: colors.primary, fontFamily: fonts.semiBold },
          ]}
        >
          Continue with email & password
        </Text>
      </TouchableOpacity>
    </View>
  );
}
