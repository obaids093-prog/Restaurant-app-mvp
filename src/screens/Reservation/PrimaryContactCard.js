import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './step3Styles';

export default function PrimaryContactCard({
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  email,
  setEmail,
  validationErrors = {},
}) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
          Primary Contact
        </Text>
        <View style={styles.cardHeaderRight}>
          <Ionicons name="shield-checkmark" size={18} color="#10B981" />
        </View>
      </View>

      {/* FULL NAME INPUT */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
          Full Name
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: isDark ? '#262626' : '#F4F2FD',
              borderColor: validationErrors.name
                ? '#EF4444'
                : isDark
                ? '#2E2E2E'
                : '#EBEAE5',
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={isDark ? '#A8A8A8' : '#71717A'}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.textInput, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}
            placeholder="Your full name"
            placeholderTextColor={isDark ? '#777777' : '#999999'}
            value={contactName}
            onChangeText={setContactName}
          />
          {contactName ? (
            <TouchableOpacity
              onPress={() => setContactName('')}
              activeOpacity={0.7}
              style={styles.clearBtn}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={isDark ? '#777777' : '#999999'}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {validationErrors.name && (
          <Text style={[styles.fieldHelperText, { color: '#EF4444' }]}>
            {validationErrors.name}
          </Text>
        )}
      </View>

      {/* MOBILE PHONE INPUT (PAKISTAN +92 PREFIX) */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
          Mobile Phone
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: isDark ? '#262626' : '#F4F2FD',
              borderColor: validationErrors.phone
                ? '#EF4444'
                : isDark
                ? '#2E2E2E'
                : '#EBEAE5',
            },
          ]}
        >
          <View style={[styles.flagPrefixBox, { borderRightColor: isDark ? '#2E2E2E' : '#EBEAE5' }]}>
            <Text style={styles.flagEmoji}>🇵🇰</Text>
            <Text style={[styles.prefixText, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}>
              +92
            </Text>
          </View>
          <TextInput
            style={[styles.textInput, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}
            placeholder="300 1234567"
            placeholderTextColor={isDark ? '#777777' : '#999999'}
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
          />
          {contactPhone ? (
            <TouchableOpacity
              onPress={() => setContactPhone('')}
              activeOpacity={0.7}
              style={styles.clearBtn}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={isDark ? '#777777' : '#999999'}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={[styles.fieldHelperText, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
          You'll receive SMS table updates and reminder
        </Text>
        {validationErrors.phone && (
          <Text style={[styles.fieldHelperText, { color: '#EF4444' }]}>
            {validationErrors.phone}
          </Text>
        )}
      </View>

      {/* EMAIL ADDRESS INPUT */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: isDark ? '#A8A8A8' : '#71717A' }]}>
          Email Address
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: isDark ? '#262626' : '#F4F2FD',
              borderColor: isDark ? '#2E2E2E' : '#EBEAE5',
            },
          ]}
        >
          <Ionicons
            name="mail-outline"
            size={18}
            color={isDark ? '#A8A8A8' : '#71717A'}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.textInput, { color: isDark ? '#F5F5F5' : '#1A1B22' }]}
            placeholder="guest@aurakitchen.pk"
            placeholderTextColor={isDark ? '#777777' : '#999999'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      </View>
    </View>
  );
}
