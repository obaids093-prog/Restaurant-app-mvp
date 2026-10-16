import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components/ui';
import brand from '../../config/brand';
import { styles } from './loginStyles';

export default function NameEntryStep({
  phoneName,
  setPhoneName,
  isSubmitting,
  handleNameSubmit,
  handleSkipName,
  colors,
  fonts,
}) {
  return (
    <View style={styles.fieldsContainer}>
      <View style={styles.otpHeader}>
        <Text
          style={[
            styles.otpTitle,
            { color: colors.textPrimary, fontFamily: fonts.bold },
          ]}
        >
          Welcome to {brand.appName}!
        </Text>
        <Text
          style={[
            styles.otpSubtitle,
            { color: colors.mutedText, fontFamily: fonts.regular },
          ]}
        >
          Enter your name to complete account setup
        </Text>
      </View>

      <Input
        label="Your Full Name"
        value={phoneName}
        onChangeText={setPhoneName}
        placeholder="e.g. Syed Obaid Ali"
        icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
        autoCapitalize="words"
        editable={!isSubmitting}
      />

      <Button
        title={`Continue to ${brand.appName}`}
        onPress={handleNameSubmit}
        loading={isSubmitting}
        variant="primary"
        size="large"
        style={styles.submitBtn}
      />

      <TouchableOpacity
        onPress={handleSkipName}
        disabled={isSubmitting}
        style={styles.skipBtn}
      >
        <Text
          style={[
            styles.skipBtnText,
            { color: colors.mutedText, fontFamily: fonts.medium },
          ]}
        >
          Skip for now
        </Text>
      </TouchableOpacity>
    </View>
  );
}
