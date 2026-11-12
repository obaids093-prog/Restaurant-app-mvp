import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import brand from '../config/brand';

/**
 * In-app legal and compliance modal (Privacy Policy, Terms of Service, Support).
 * Fulfills Play Store & transparency guidelines: provides clear policies and
 * contact methods directly without requiring browser redirection or account creation.
 */
export default function LegalModal({ visible, type, onClose }) {
  const { colors, typography } = useTheme();

  if (!visible) return null;

  const isPrivacy = type === 'privacy';
  const isTerms = type === 'terms';
  const isContact = type === 'contact';

  const getTitle = () => {
    if (isPrivacy) return 'Privacy Policy';
    if (isTerms) return 'Terms of Service';
    if (isContact) return 'Contact & Concierge';
    return 'Information';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerLeft}>
            <Text style={[typography.h3, { color: colors.textPrimary, fontSize: 18 }]}>
              {getTitle()}
            </Text>
            <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
              {brand.restaurantName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isPrivacy && (
            <View>
              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                1. Information We Collect
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                When you use {brand.appName}, we collect the minimal personal data necessary to process your table reservations and dining orders: your name, phone number, email address, dietary preferences, and table notes.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                2. How We Use Your Data
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                Your data is used solely to prepare meals, manage seating, issue digital bills, and calculate loyalty tier points. We do not sell, rent, or trade your personal information with third-party advertisers.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                3. Financial Information
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                All transactions are settled in person at the restaurant via cash or pay-at-table terminal. We never prompt for, collect, or store credit card numbers, CVVs, or bank credentials.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                4. Data Retention & Account Erasure
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                In accordance with Google Play Store policies and international data protection standards, you have the right to permanent erasure. You can delete your dining account at any time directly in Profile Settings via the "Delete Dining Account" button. Upon deletion, personal identifiers are wiped immediately.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                5. Contact Concierge
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                For privacy inquiries or data rights requests, email our data team at {brand.supportEmail} or visit our MM Alam Road branch.
              </Text>
            </View>
          )}

          {isTerms && (
            <View>
              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                1. Table Reservations
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {brand.reservationHoldPolicy} If your party is delayed, please notify our concierge via phone ({brand.phone}) so we can extend your holding window.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                2. Order Placement & Cancellation
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                Orders can be cancelled free of charge while in "Pending" status within 10 minutes of placement. Once kitchen preparation begins, orders cannot be cancelled.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                3. Promotional Vouchers & Loyalty
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                Vouchers are valid only before their published expiration date and are subject to minimum spend and per-user quota restrictions. Loyalty points hold zero cash-out value and may only be redeemed toward food orders.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                4. Dine-In Etiquette
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {brand.restaurantName} reserves the right to decline service to parties exhibiting abusive behavior toward staff or other patrons.
              </Text>
            </View>
          )}

          {isContact && (
            <View>
              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                Artisan Hospitality Concierge
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                We are dedicated to white-glove dining. Reach our concierge desk directly:
              </Text>

              <View style={[styles.infoBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>{brand.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>{brand.supportEmail}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>{brand.openingHours}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.textPrimary }]}>{brand.address}</Text>
                </View>
              </View>

              <Text style={[styles.sectionHeading, { color: colors.primary, marginTop: 24 }]}>
                Our Outlets
              </Text>
              {brand.outlets.map((outlet) => (
                <View
                  key={outlet.id}
                  style={[styles.outletCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
                >
                  <Text style={[styles.outletName, { color: colors.textPrimary }]}>{outlet.fullName}</Text>
                  <Text style={[styles.outletAddress, { color: colors.mutedText }]}>{outlet.address}</Text>
                  <Text style={[styles.outletPhone, { color: colors.primary }]}>Phone: {outlet.phone}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { color: colors.onPrimary || '#FFFFFF' }]}>
              Close
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoText: {
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
  },
  outletCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  outletName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  outletAddress: {
    fontSize: 12,
    marginBottom: 4,
  },
  outletPhone: {
    fontSize: 12,
    fontWeight: '600',
  },
  doneBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

