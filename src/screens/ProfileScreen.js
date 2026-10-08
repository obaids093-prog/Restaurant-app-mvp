import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Alert,
  Image,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CURATED_AVATARS = [
  { id: '1', label: 'VIP Patron', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop' },
  { id: '2', label: 'Executive', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop' },
  { id: '3', label: 'Artisan Chef', uri: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=250&auto=format&fit=crop' },
  { id: '4', label: 'Connoisseur', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop' },
  { id: '5', label: 'Emerald Member', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const { colors, isDark, toggleTheme, shadows } = useTheme();

  const [dietaryPrefs, setDietaryPrefs] = useState(['Halal', 'Window Seat']);

  // Edit Profile Modal States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Account Confirmation Modal States
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Sync edit form with current user data
  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditDob(user?.dob || '');
    setEditAvatar(user?.avatar || CURATED_AVATARS[0].uri);
    setEditError('');
    setIsEditModalVisible(true);
  };

  const handlePickFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 6 * 1024 * 1024) {
            setEditError('Selected photo is too large (max 6MB).');
            return;
          }
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            if (loadEvent.target && loadEvent.target.result) {
              setEditAvatar(loadEvent.target.result);
              setEditError('');
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Upload Picture',
        'Choose an avatar from the curated presets below or enter an image URL.'
      );
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Please enter your name.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditError('Please enter a valid email address.');
      return;
    }

    try {
      setIsSaving(true);
      setEditError('');
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        dob: editDob.trim(),
        avatar: editAvatar,
      });

      setIsEditModalVisible(false);
      if (Platform.OS === 'web') {
        window.alert('Profile details saved successfully!');
      } else {
        Alert.alert('Success', 'Profile details saved successfully!');
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setDeleteError('');
      await deleteAccount();
      setIsDeleteConfirmVisible(false);

      if (Platform.OS === 'web') {
        window.alert('Your account has been permanently deleted from our database.');
      } else {
        Alert.alert(
          'Account Deleted',
          'Your account has been permanently deleted from our database.'
        );
      }
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const togglePref = (pref) => {
    setDietaryPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to log out of your account?'
      );
      if (!confirmed) return;
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const isManager = user?.role === 'manager';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── VIP BLACK-TIE PATRON PASSPORT CARD ─── */}
        <View style={[styles.passportCardOuter, shadows.deep3D]}>
          <LinearGradient
            colors={isDark ? ['#132A26', '#0B1715', '#08100E'] : ['#064E3B', '#0D9488', '#042F2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.passportCardInner, { borderColor: '#D97706' }]}
          >
            {/* Card Brand Header */}
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="restaurant" size={16} color="#FBBF24" />
                <Text style={{ color: '#FBBF24', fontSize: 13, fontWeight: '800', marginLeft: 6, letterSpacing: 1.5 }}>
                  AURA
                </Text>
              </View>
              <View style={styles.vipTagPill}>
                <Text style={styles.vipTagPillText}>
                  {isManager ? 'MANAGER' : (user?.membership ? user.membership.toUpperCase() : 'CUSTOMER')}
                </Text>
              </View>
            </View>

            {/* Profile Credentials with Avatar */}
            <View style={styles.patronCredentialsArea}>
              <View style={styles.avatarWithInfoRow}>
                <View style={styles.avatarWrapper}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.cardAvatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.avatarMiniBadge}
                    onPress={openEditModal}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={11} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.patronNumber}>
                    {isManager ? 'ID: #MGR-001' : 'ID: #CUST-9041'}
                  </Text>
                  <Text style={styles.patronDisplayName} numberOfLines={1}>
                    {user?.name || 'Customer'}
                  </Text>
                  <Text style={styles.patronEmailText} numberOfLines={1}>
                    {user?.email || 'customer@aurabistro.pk'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Card Footer Details (Phone, DOB, Role) */}
            <View style={styles.cardFooterGrid}>
              <View style={styles.footerCol}>
                <Text style={styles.footerFieldTitle}>PHONE NUMBER</Text>
                <Text style={styles.footerFieldValue} numberOfLines={1}>
                  {user?.phone ? user.phone : 'Not provided'}
                </Text>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerFieldTitle}>DATE OF BIRTH</Text>
                <Text style={styles.footerFieldValue} numberOfLines={1}>
                  {user?.dob ? user.dob : 'Not specified'}
                </Text>
              </View>
              <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.footerFieldTitle}>ROLE</Text>
                <Text style={[styles.footerFieldValue, { color: '#FBBF24' }]}>
                  {user?.role ? user.role.toUpperCase() : 'CUSTOMER'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ─── QUICK EDIT PROFILE ACTION BUTTON ─── */}
        <TouchableOpacity
          onPress={openEditModal}
          style={[
            styles.editProfileTriggerBtn,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.primary + '50' },
            shadows.soft,
          ]}
          activeOpacity={0.85}
        >
          <View style={styles.editProfileTriggerLeft}>
            <View style={[styles.editIconBadge, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.editProfileTriggerTitle, { color: colors.textPrimary }]}>
                Edit Profile Details
              </Text>
              <Text style={[styles.editProfileTriggerSub, { color: colors.textMuted }]}>
                Update photo, name, email, DOB & phone number
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* ─── ATMOSPHERIC THEME SWITCHER ─── */}
        <View
          style={[
            styles.loungeCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <View style={styles.loungeCardHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={18}
                color={isDark ? '#F59E0B' : '#0D9488'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.loungeCardTitle, { color: colors.textPrimary }]}>
                Appearance
              </Text>
              <Text style={[styles.loungeCardSubtitle, { color: colors.textSecondary }]}>
                {isDark ? 'Dark Theme' : 'Light Theme'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>
        </View>

        {/* ─── CONCIERGE DINING PREFERENCES ─── */}
        <View
          style={[
            styles.loungeCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.soft,
          ]}
        >
          <Text style={[styles.sectionSmallHeading, { color: colors.textMuted }]}>
            DINING PREFERENCES
          </Text>
          <View style={styles.prefsChipRow}>
            {['Halal', 'Vegetarian', 'Non-Veg', 'Spicy', 'Window Seat', 'Outdoor Seating'].map(
              (pref) => {
                const active = dietaryPrefs.includes(pref);
                return (
                  <TouchableOpacity
                    key={pref}
                    onPress={() => togglePref(pref)}
                    style={[
                      styles.prefChip,
                      {
                        backgroundColor: active ? colors.primary + '18' : colors.surfaceSubtle,
                        borderColor: active ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'add-circle-outline'}
                      size={14}
                      color={active ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.prefChipText,
                        { color: active ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {pref}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>

        {/* ─── MANAGER OPERATIONS DIRECT LAUNCH (If Manager) ─── */}
        {isManager && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerDashboard')}
            style={[styles.managerLaunchBtn, shadows.button3D]}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.managerLaunchGradient}
            >
              <View style={styles.managerLaunchLeft}>
                <View style={styles.chefHatIcon}>
                  <Ionicons name="restaurant" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.managerLaunchTitle}>Manager Dashboard</Text>
                  <Text style={styles.managerLaunchSubtitle}>Manage orders, reservations & menu</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#F59E0B" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ─── SECURITY & LOGOUT TERMINAL ─── */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.signOutDeck,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
            shadows.soft,
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.signOutLeft}>
            <View style={[styles.signOutIconDisc, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.signOutText, { color: colors.textPrimary }]}>Log Out</Text>
              <Text style={[styles.signOutSubtext, { color: colors.textMuted }]}>
                Sign out of your account
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* ─── DANGER ZONE: PERMANENT ACCOUNT DELETION ─── */}
        <View
          style={[
            styles.dangerCard,
            { backgroundColor: isDark ? '#2A1215' : '#FEF2F2', borderColor: '#F87171' },
            shadows.soft,
          ]}
        >
          <View style={styles.dangerHeaderRow}>
            <View style={styles.dangerIconBadge}>
              <Ionicons name="warning-outline" size={18} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>Delete Account</Text>
              <Text style={[styles.dangerSubtitle, { color: isDark ? '#FCA5A5' : '#7F1D1D' }]}>
                Permanently delete your account and saved data
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              setDeleteError('');
              setIsDeleteConfirmVisible(true);
            }}
            style={styles.deleteAccountButton}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.deleteAccountButtonText}>Delete My Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════
          EDIT PROFILE MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !isSaving && setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Dining Profile</Text>
                <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                  Update your patron credentials & avatar
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => !isSaving && setIsEditModalVisible(false)}
                style={[styles.closeIconBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Avatar Preview & Upload Buttons */}
              <View style={styles.avatarPickerSection}>
                <View style={styles.avatarBigWrapper}>
                  {editAvatar ? (
                    <Image source={{ uri: editAvatar }} style={styles.avatarBigImg} />
                  ) : (
                    <View style={[styles.avatarBigImg, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 32, color: '#FFFFFF', fontWeight: '800' }}>
                        {(editName || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handlePickFile}
                  style={[styles.uploadFileBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cloud-upload-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadFileBtnText}>Upload Photo from Device</Text>
                </TouchableOpacity>

                {/* Preset Avatar Selection */}
                <Text style={[styles.presetsHeading, { color: colors.textMuted }]}>
                  Or choose a curated luxury persona:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetAvatarRow}>
                  {CURATED_AVATARS.map((av) => {
                    const isSelected = editAvatar === av.uri;
                    return (
                      <TouchableOpacity
                        key={av.id}
                        onPress={() => setEditAvatar(av.uri)}
                        style={[
                          styles.presetAvatarItem,
                          isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                        ]}
                      >
                        <Image source={{ uri: av.uri }} style={styles.presetAvatarThumb} />
                        {isSelected && (
                          <View style={[styles.selectedCheckBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Error Notice */}
              {editError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{editError}</Text>
                </View>
              ) : null}

              {/* Form Input: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                  <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Enter full name"
                    placeholderTextColor={colors.textMuted}
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>
              </View>

              {/* Form Input: Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="e.g. patron@aurabistro.pk"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={editEmail}
                    onChangeText={setEditEmail}
                  />
                </View>
              </View>

              {/* Form Input: Date of Birth (DOB) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date of Birth (DOB)</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="e.g. 1998-08-15 or 15 Aug 1998"
                    placeholderTextColor={colors.textMuted}
                    value={editDob}
                    onChangeText={setEditDob}
                  />
                </View>
              </View>

              {/* Form Input: Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                  <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="e.g. 0300-1234567"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={editPhone}
                    onChangeText={setEditPhone}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  onPress={() => setIsEditModalVisible(false)}
                  style={[styles.modalCancelBtn, { borderColor: colors.surfaceBorder }]}
                  disabled={isSaving}
                >
                  <Text style={[styles.modalCancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveProfile}
                  style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                  disabled={isSaving}
                  activeOpacity={0.88}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          DELETE ACCOUNT CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        visible={isDeleteConfirmVisible}
        animationType="fade"
        transparent
        onRequestClose={() => !isDeleting && setIsDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalBox, { backgroundColor: colors.card, borderColor: '#DC2626' }]}>
            <View style={styles.deleteModalIconRing}>
              <Ionicons name="trash" size={32} color="#DC2626" />
            </View>

            <Text style={[styles.deleteModalTitle, { color: colors.textPrimary }]}>
              Permanently Delete Account?
            </Text>

            <Text style={[styles.deleteModalDesc, { color: colors.textSecondary }]}>
              Are you sure you want to permanently delete your account? This action cannot be reversed. Your user account and dining credentials will be completely erased from the database.
            </Text>

            {deleteError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorBannerText}>{deleteError}</Text>
              </View>
            ) : null}

            <View style={styles.deleteModalBtnRow}>
              <TouchableOpacity
                onPress={() => setIsDeleteConfirmVisible(false)}
                style={[styles.deleteModalCancelBtn, { borderColor: colors.surfaceBorder }]}
                disabled={isDeleting}
              >
                <Text style={[styles.deleteModalCancelText, { color: colors.textPrimary }]}>
                  Keep Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDeleteAccount}
                style={styles.deleteModalConfirmBtn}
                disabled={isDeleting}
                activeOpacity={0.88}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteModalConfirmText}>Yes, Delete Permanently</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // ─── VIP BLACK-TIE PATRON PASSPORT CARD ───
  passportCardOuter: {
    borderRadius: 22,
    marginBottom: 14,
  },
  passportCardInner: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goldSmartChip: {
    width: 32,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    padding: 3,
    justifyContent: 'space-between',
  },
  chipWire1: {
    height: 1.5,
    backgroundColor: '#B45309',
    borderRadius: 1,
  },
  chipWire2: {
    height: 1.5,
    backgroundColor: '#B45309',
    borderRadius: 1,
  },
  vipTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    borderWidth: 1,
    borderColor: '#D97706',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  vipTagPillText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // Patron Credentials + Avatar Row
  patronCredentialsArea: {
    marginVertical: 12,
  },
  avatarWithInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  cardAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  avatarMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D9488',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
  },
  patronNumber: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  patronDisplayName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  patronEmailText: {
    color: '#2DD4BF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // Card Footer Grid (Phone, DOB, Clearance)
  cardFooterGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  footerCol: {
    flex: 1,
  },
  footerFieldTitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  footerFieldValue: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },

  // ─── EDIT PROFILE TRIGGER BUTTON ───
  editProfileTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 14,
  },
  editProfileTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  editProfileTriggerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  editProfileTriggerSub: {
    fontSize: 11,
    marginTop: 1,
  },

  // ─── METRIC PODS ───
  metricsMatrix: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricPod: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  // ─── LOUNGE CARDS ───
  loungeCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  loungeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  loungeCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  loungeCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionSmallHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  prefsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  prefChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── MANAGER LAUNCH ───
  managerLaunchBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  managerLaunchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  managerLaunchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chefHatIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  managerLaunchTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  managerLaunchSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },

  // ─── SIGN OUT ───
  signOutDeck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
  },
  signOutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutIconDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '800',
  },
  signOutSubtext: {
    fontSize: 11,
    marginTop: 2,
  },

  // ─── DANGER ZONE: PERMANENT ACCOUNT DELETION ───
  dangerCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 4,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  dangerSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // ═══════════════════════════════════════════════════════════
  // MODAL STYLES (EDIT PROFILE & DELETE CONFIRM)
  // ═══════════════════════════════════════════════════════════
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  editModalBox: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar Picker
  avatarPickerSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarBigWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarBigImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#D97706',
  },
  uploadFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 6,
  },
  uploadFileBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  presetsHeading: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
  },
  presetAvatarRow: {
    gap: 10,
    paddingVertical: 4,
  },
  presetAvatarItem: {
    position: 'relative',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  presetAvatarThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 1.6,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Delete Confirmation Modal
  deleteModalBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
  },
  deleteModalIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteModalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteModalConfirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
