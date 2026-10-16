import { StyleSheet } from 'react-native';

// Validation helpers
export const validateSignupNameAndPhone = (vals, newErrors) => {
  const nameTrim = vals.name?.trim();
  if (!nameTrim) {
    newErrors.name = 'Full name is required.';
  } else if (nameTrim.length < 2) {
    newErrors.name = 'Name must be at least 2 characters.';
  }

  const pakPhoneClean = (vals.phone || '').replace(/\D/g, '');

  if (!pakPhoneClean) {
    newErrors.phone = 'Mobile number is required for order notifications.';
  } else if (!/^3\d{9}$/.test(pakPhoneClean)) {
    newErrors.phone = 'Enter a valid 10-digit Pakistani mobile number.';
  }
};

export const validatePasswordFields = (vals, isSignup, newErrors) => {
  if (!vals.password) {
    newErrors.password = 'Password is required.';
    return;
  }
  if (!isSignup) return;

  if (vals.password.length < 8) {
    newErrors.password = 'Password must be at least 8 characters.';
  } else if (!/\d/.test(vals.password)) {
    newErrors.password = 'Password must contain at least one numeric digit.';
  }

  if (!vals.confirmPassword) {
    newErrors.confirmPassword = 'Please confirm your password.';
  } else if (vals.password !== vals.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match.';
  }
};

export const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    width: '100%',
  },
  canopyContainer: {
    width: '100%',
    paddingBottom: 54,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientOrb1: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  ambientArchRing: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1,
  },
  topUtilityRow: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    zIndex: 10,
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  glassBadgeText: {
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  themeToggleGlassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 86,
    height: 86,
    marginTop: 6,
    marginBottom: 10,
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDiamond: {
    position: 'absolute',
    fontSize: 10,
    lineHeight: 12,
  },
  emblemSquircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitleBlock: {
    alignItems: 'center',
  },
  brandTitleText: {
    fontSize: 27,
    letterSpacing: 8,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  taglineDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
  },
  taglineDividerLine: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  brandSubtitleText: {
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '600',
    textAlign: 'center',
  },
  formSheetWrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: -28,
  },
  formCard: {
    width: '100%',
    padding: 22,
    borderWidth: 1,
    marginBottom: 20,
  },
  legalNoticeText: {
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 16,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 16,
  },
  segmentedControl: {
    marginBottom: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldsContainer: {
    width: '100%',
  },
  rulesCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  rulesHeader: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    minHeight: 44,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 13,
  },
  submitBtn: {
    marginBottom: 16,
  },
  switchAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 10,
  },
  switchAuthText: {
    fontSize: 14,
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpTitle: {
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  textBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  textBtnLabel: {
    fontSize: 13,
  },
  skipBtn: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: 13,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 6,
    width: '100%',
  },
  orDividerLine: {
    flex: 1,
    height: 1,
  },
  orDividerText: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  guestBrowseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  guestBrowseText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
