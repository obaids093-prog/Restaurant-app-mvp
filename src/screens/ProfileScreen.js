import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrders } from '../context/OrdersContext';
import { brand } from '../config/brand';
import { normalizePkPhone } from '../utils/phone';
import { Input, PhoneInput, Switch } from '../components/ui';

const PRESET_DIETARY_OPTIONS = [
  { id: 'halal', label: 'Halal Only', icon: 'shield-checkmark-outline' },
  { id: 'nut_free', label: 'Nut Free', icon: 'nutrition-outline' },
  { id: 'shellfish', label: 'Shellfish Alert', icon: 'alert-circle-outline' },
  { id: 'gluten', label: 'Gluten Conscious', icon: 'leaf-outline' },
  { id: 'vegetarian', label: 'Vegetarian', icon: 'flower-outline' },
  { id: 'dairy_free', label: 'Dairy Free', icon: 'water-outline' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const { colors, typography, radius, shadows, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders } = useOrders() || { orders: [] };

  // Dietary preferences state
  const [dietaryPrefs, setDietaryPrefs] = useState(['halal', 'window']);

  // Edit Profile Modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAmbience, setEditAmbience] = useState('atrium');
  const [editOccasion, setEditOccasion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Account Confirmation Modal state
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Active orders count for badge
  const activeOrdersCount = useMemo(() => {
    return (orders || []).filter((o) =>
      ['Pending', 'Preparing', 'Ready', 'Cooking', 'On the way'].includes(o.status)
    ).length;
  }, [orders]);

  // Compute User Initials (e.g. "Zainab Malik" -> "ZM")
  const userInitials = useMemo(() => {
    if (!user?.name) return '?';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  const activeLocationsText = useMemo(() => {
    const list = (brand.outlets || []).filter((o) => o.isActive !== false);
    if (list.length === 0) return 'Fine Dining';
    return list.map((o) => o.city).join(' & ');
  }, []);

  const togglePref = (id) => {
    setDietaryPrefs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Helper to detect auto-generated dummy email from phone OTP signup
  const isPlaceholderEmail = (email) => {
    if (!email || typeof email !== 'string') return true;
    const lower = email.toLowerCase().trim();
    return (
      lower.includes('@customer.aura.pk') ||
      lower.includes('@aurabistro.pk') ||
      lower.includes('aurahospitality') ||
      lower.includes('aura.internal') ||
      /^\+?\d{9,15}@/.test(lower)
    );
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(isPlaceholderEmail(user?.email) ? '' : (user?.email || ''));
    const phoneParsed = normalizePkPhone(user?.phone || '');
    setEditPhone(phoneParsed.isValid ? phoneParsed.raw : (user?.phone || ''));
    setEditAmbience(user?.defaultAmbience || 'atrium');
    setEditOccasion(user?.specialOccasion || '');
    setEditError('');
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName) {
      setEditError('Please enter your full name.');
      return;
    }
    if (trimmedEmail && (!trimmedEmail.includes('@') || !trimmedEmail.includes('.'))) {
      setEditError('Please enter a valid email address (e.g. yourname@gmail.com).');
      return;
    }

    try {
      setIsSaving(true);
      setEditError('');
      const payload = {
        name: trimmedName,
        phone: editPhone.trim(),
        defaultAmbience: editAmbience,
        specialOccasion: editOccasion.trim(),
      };
      if (trimmedEmail) {
        payload.email = trimmedEmail.toLowerCase();
      }
      await updateProfile(payload);

      setIsEditModalVisible(false);
      const msg = 'Personal information saved successfully!';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert('Saved', msg);
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutPress = () => {
    const performLogout = async () => {
      try {
        await logout();
      } catch (err) {
        console.warn('Logout error:', err.message);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm && window.confirm('Are you sure you want to log out of AURA?')) {
        performLogout();
      }
      return;
    }

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your dining account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: performLogout },
      ]
    );
  };

  const handleDeleteAccountPress = async () => {
    try {
      setIsDeleting(true);
      setDeleteError('');
      await deleteAccount();
      setIsDeleteModalVisible(false);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isManager = user?.role === 'manager';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* TOP HEADER BAR */}
      <View
        style={[
          styles.topHeader,
          {
            borderBottomColor: colors.cardBorder,
            paddingTop: insets.top > 0 ? insets.top + 8 : 12,
          },
        ]}
      >
        <Text style={[typography.headingLg, { color: colors.textPrimary, fontWeight: '800', fontSize: 22 }]}>
          Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── GUEST SIGN-IN PROMPT (when user is not logged in) ─── */}
        {!user ? (
          <>
            {/* Guest Welcome Card */}
            <View style={[styles.membershipCardWrapper, shadows.deep3D]}>
              <LinearGradient
                colors={['#64748B', '#475569', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.membershipCardInner, { borderRadius: radius.card * 1.5 }]}
              >
                <View style={styles.cardWatermarkCircle} />
                <View style={styles.membershipCardHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatarInitialsCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Ionicons name="person-outline" size={26} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.memberIdentityCol}>
                    <Text style={[styles.memberNameText, { fontSize: 18 }]}>Welcome to {brand.name}</Text>
                    <Text style={[styles.memberEmailText, { marginTop: 4 }]}>
                      Sign in to unlock reservations, orders, and personalised dining.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Sign In / Register CTA */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.88}
              style={[styles.managerBannerBtn, shadows.soft]}
            >
              <LinearGradient
                colors={['#FC5834', '#E03816']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.managerBannerGradient, { borderRadius: radius.card }]}
              >
                <View style={styles.managerBannerLeft}>
                  <View style={[styles.managerIconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={[styles.managerBannerTitle, { color: '#FFFFFF' }]}>Sign In or Register</Text>
                    <Text style={[styles.managerBannerSub, { color: 'rgba(255,255,255,0.7)' }]}>Create an account to start ordering</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Night Theme Toggle (available for guests too) */}
            <View
              style={[
                styles.groupedRowsContainer,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.cardBorder,
                  borderRadius: radius.card,
                },
                shadows.soft,
              ]}
            >
              <View style={styles.menuRow}>
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? colors.secondary : colors.primary} />
                  </View>
                  <View>
                    <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 14 }]}>
                      Ambient Night Theme
                    </Text>
                    <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                      {isDark ? 'Dark mode enabled' : 'Light mode active'}
                    </Text>
                  </View>
                </View>
                <Switch value={isDark} onValueChange={toggleTheme} />
              </View>
            </View>

            {/* APP VERSION & COPYRIGHT FOOTER */}
            <View style={styles.versionFooter}>
              <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                {brand.name} • {brand.tagline}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText, fontSize: 10, marginTop: 2 }]}>
                Version 1.0.0 • {activeLocationsText}
              </Text>
            </View>
          </>
        ) : (
          <>
        {/* ─── VIBRANT PRIMARY MEMBERSHIP CARD (Stitch Variant 2) ─── */}
        <View style={[styles.membershipCardWrapper, shadows.deep3D]}>
          <LinearGradient
            colors={['#FC5834', '#E03816', '#B22301']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.membershipCardInner, { borderRadius: radius.card * 1.5 }]}
          >
            {/* Ambient Watermark Background Shape */}
            <View style={styles.cardWatermarkCircle} />

            <View style={styles.membershipCardHeader}>
              {/* Avatar with Halo & Online Green Indicator */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarInitialsCircle}>
                  <Text style={styles.avatarInitialsText}>{userInitials}</Text>
                </View>
                <View style={styles.onlineHaloDot} />
              </View>

              {/* Identity & Role Badge */}
              <View style={styles.memberIdentityCol}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberNameText} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <View style={styles.roleBadgePill}>
                    <Text style={styles.roleBadgeText}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {isPlaceholderEmail(user.email) ? (
                  <TouchableOpacity
                    onPress={openEditModal}
                    activeOpacity={0.8}
                    style={styles.addEmailPill}
                  >
                    <Ionicons name="mail-outline" size={11} color="#FFFFFF" />
                    <Text style={styles.addEmailPillText}>+ Add your Gmail</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.memberEmailText} numberOfLines={1}>
                    {user.email}
                  </Text>
                )}

                {/* Verified Phone Chip */}
                {user.phone ? (
                <View style={styles.memberMetaRow}>
                  <Ionicons name="call-outline" size={12} color="#FFFFFF" style={{ opacity: 0.85 }} />
                  <Text style={styles.memberPhoneText}>
                    {normalizePkPhone(user.phone).display}
                  </Text>
                  <View style={styles.verifiedMiniTag}>
                    <Ionicons name="checkmark-circle" size={11} color="#4ADE80" />
                    <Text style={styles.verifiedMiniText}>Verified</Text>
                  </View>
                </View>
                ) : null}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ─── MANAGER CONSOLE SHORTCUT (If user is Manager) ─── */}
        {isManager && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerDashboard')}
            style={[styles.managerBannerBtn, shadows.soft]}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.managerBannerGradient, { borderRadius: radius.card }]}
            >
              <View style={styles.managerBannerLeft}>
                <View style={styles.managerIconBadge}>
                  <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.managerBannerTitle}>Manager Console</Text>
                  <Text style={styles.managerBannerSub}>Overview, Orders, Reservations & Menu</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#F59E0B" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ─── LIST ROWS CONTAINER (Divided group) ─── */}
        <View
          style={[
            styles.groupedRowsContainer,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.cardBorder,
              borderRadius: radius.card,
            },
            shadows.soft,
          ]}
        >
          {/* ROW 1: PERSONAL INFORMATION */}
          <TouchableOpacity
            onPress={openEditModal}
            style={[styles.menuRow, { borderBottomColor: colors.cardBorder }]}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 14 }]}>
                  Personal Information
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  Contact, dining notes & ambience
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
          </TouchableOpacity>

          {/* ROW 2: MY ORDERS */}
          <TouchableOpacity
            onPress={() => navigation.navigate('TrackTab')}
            style={[styles.menuRow, { borderBottomColor: colors.cardBorder }]}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Ionicons name="receipt-outline" size={18} color={colors.secondary} />
              </View>
              <View>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 14 }]}>
                  My Orders & Receipts
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  Live kitchen status & dining folios
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {activeOrdersCount > 0 && (
                <View style={[styles.rowCounterBadge, { backgroundColor: colors.primaryTint }]}>
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', fontSize: 11 }]}>
                    {activeOrdersCount} active
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </View>
          </TouchableOpacity>

          {/* ROW 3: TABLE RESERVATIONS */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Reservations')}
            style={[styles.menuRow, { borderBottomColor: colors.cardBorder }]}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.ready} />
              </View>
              <View>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 14 }]}>
                  Table Reservations
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  Bookings, guest party & history
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
          </TouchableOpacity>

          {/* ROW 4: APPEARANCE (NIGHT MODE TOGGLE) */}
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? colors.secondary : colors.primary} />
              </View>
              <View>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 14 }]}>
                  Ambient Night Theme
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  {isDark ? 'Dark mode enabled' : 'Light mode active'}
                </Text>
              </View>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
        </View>

        {/* ─── DIETARY & ALLERGEN PREFERENCES CARD ─── */}
        <View
          style={[
            styles.groupedRowsContainer,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.cardBorder,
              borderRadius: radius.card,
              padding: 16,
              paddingBottom: 16,
            },
            shadows.soft,
          ]}
        >
          <View style={styles.dietaryHeaderRow}>
            <View>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700', fontSize: 14 }]}>
                Dietary Preferences & Allergens
              </Text>
              <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                Tagged on kitchen order dispatch tickets
              </Text>
            </View>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>

          <View style={styles.dietaryChipsGrid}>
            {PRESET_DIETARY_OPTIONS.map((item) => {
              const isSelected = dietaryPrefs.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => togglePref(item.id)}
                  style={[
                    styles.dietaryChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                      borderRadius: radius.pill,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={isSelected ? colors.onPrimary : colors.mutedText}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isSelected ? colors.onPrimary : colors.textPrimary,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 12,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── LOG OUT & ACCOUNT ACTIONS ─── */}
        <View
          style={[
            styles.groupedRowsContainer,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.cardBorder,
              borderRadius: radius.card,
            },
            shadows.soft,
          ]}
        >
          {/* LOG OUT BUTTON */}
          <TouchableOpacity
            onPress={handleLogoutPress}
            style={[styles.menuRow, { borderBottomColor: colors.cardBorder }]}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: colors.cancelledTint, borderColor: colors.cancelled + '30' }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.cancelled} />
              </View>
              <View>
                <Text style={[typography.body, { color: colors.cancelled, fontWeight: '700', fontSize: 14 }]}>
                  Log Out
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  Sign out from this device session
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
          </TouchableOpacity>

          {/* DELETE ACCOUNT BUTTON */}
          <TouchableOpacity
            onPress={() => {
              setDeleteError('');
              setIsDeleteModalVisible(true);
            }}
            style={styles.menuRow}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Ionicons name="trash-outline" size={18} color={colors.mutedText} />
              </View>
              <View>
                <Text style={[typography.body, { color: colors.mutedText, fontWeight: '600', fontSize: 14 }]}>
                  Delete Dining Account
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                  Permanently erase credentials & data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* APP VERSION & COPYRIGHT FOOTER */}
        <View style={styles.versionFooter}>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
            {brand.name} • {brand.tagline}
          </Text>
          <Text style={[typography.caption, { color: colors.mutedText, fontSize: 10, marginTop: 2 }]}>
            Version 1.0.0 • {activeLocationsText}
          </Text>
        </View>
          </>
        )}
      </ScrollView>

      {/* ─── EDIT PROFILE MODAL ─── */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.card * 1.5 },
              shadows.deep3D,
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '800' }]}>
                Personal Information
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* Avatar Center Preview */}
              <View style={styles.editAvatarCenter}>
                <View style={[styles.editAvatarCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.editAvatarText}>{userInitials}</Text>
                </View>
                <Text style={[typography.caption, { color: colors.mutedText, marginTop: 6 }]}>
                  Guest Initials Avatar
                </Text>
              </View>

              {/* Form Inputs */}
              <Input
                label="Full Name"
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Zainab Malik"
                icon={<Ionicons name="person-outline" size={18} color={colors.mutedText} />}
              />

              <Input
                label="Gmail / Email Address"
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="yourname@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Ionicons name="mail-outline" size={18} color={colors.mutedText} />}
              />

              <PhoneInput
                label="Mobile Phone"
                value={editPhone}
                onChangePhone={setEditPhone}
              />

              <Input
                label="Special Occasion / Anniversary (Optional)"
                value={editOccasion}
                onChangeText={setEditOccasion}
                placeholder="e.g. 14 November (Anniversary)"
                icon={<Ionicons name="gift-outline" size={18} color={colors.mutedText} />}
              />

              {/* Artisan Privacy Promise Box */}
              <View style={[styles.privacyBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.button }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.textSecondary, flex: 1, marginLeft: 8, fontSize: 11, lineHeight: 16 }]}>
                  Artisan Privacy Promise: Your dining notes and culinary preferences are kept strictly confidential.
                </Text>
              </View>

              {editError ? (
                <Text style={[styles.modalErrorText, { color: colors.error }]}>
                  {editError}
                </Text>
              ) : null}
            </ScrollView>

            {/* Modal CTAs */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSaving}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.button },
                ]}
              >
                <Text style={[typography.button, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSaving}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: colors.primary, borderRadius: radius.button },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[typography.button, { color: colors.onPrimary }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── DELETE ACCOUNT CONFIRMATION MODAL ─── */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.card * 1.5 },
              shadows.deep3D,
            ]}
          >
            <View style={styles.deleteHeader}>
              <View style={[styles.deleteIconCircle, { backgroundColor: colors.cancelledTint }]}>
                <Ionicons name="warning-outline" size={28} color={colors.cancelled} />
              </View>
              <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '800', marginTop: 12 }]}>
                Delete Dining Account?
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 }]}>
                This will permanently delete your account, saved reservations, and order history from the restaurant system. This action cannot be undone.
              </Text>
            </View>

            {deleteError ? (
              <Text style={[styles.modalErrorText, { color: colors.error, textAlign: 'center', marginBottom: 12 }]}>
                {deleteError}
              </Text>
            ) : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={isDeleting}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.button },
                ]}
              >
                <Text style={[typography.button, { color: colors.textSecondary }]}>Keep Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccountPress}
                disabled={isDeleting}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: colors.cancelled, borderRadius: radius.button },
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[typography.button, { color: '#FFFFFF' }]}>Yes, Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── STYLESHEET ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },

  // Membership Card
  membershipCardWrapper: {
    marginBottom: 16,
  },
  membershipCardInner: {
    position: 'relative',
    padding: 18,
    overflow: 'hidden',
  },
  cardWatermarkCircle: {
    position: 'absolute',
    right: -24,
    bottom: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  membershipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarInitialsCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  onlineHaloDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberIdentityCol: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  roleBadgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  memberEmailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  addEmailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  addEmailPillText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  memberPhoneText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verifiedMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  verifiedMiniText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Manager Banner
  managerBannerBtn: {
    marginBottom: 16,
  },
  managerBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  managerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  managerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  managerBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },

  // Grouped Rows
  groupedRowsContainer: {
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  // Dietary Card
  dietaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dietaryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },

  // Version Footer
  versionFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    padding: 20,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  editAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  modalErrorText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 2,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  modalSaveBtn: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  // Delete Modal
  deleteHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
