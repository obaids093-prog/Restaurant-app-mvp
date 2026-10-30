# AURA Security Audit & Remediation Log

This document tracks all identified security vulnerabilities, their immediate remediation fixes, and automated test verifications.

---

## 1. Social Login Authentication Bypass & Account Takeover
- **Vulnerability Finding**: `POST /api/auth/social-login` accepted arbitrary `email` parameters and immediately returned a signed JWT token without performing cryptographic signature, audience, or issuer verification against Google or Apple identity providers. Any attacker could take over any manager or customer account simply by supplying their email.
- **Remediation Fix**:
  - Removed `router.post('/social-login')` from `server/routes/authRoutes.js`.
  - Removed `socialLogin` controller implementation and export from `server/controllers/authController.js`.
  - Removed `SocialLoginButtons.js` and all Google and Apple sign-in buttons from `src/screens/Login/LoginScreen.js`.
  - Removed `loginWithSocial` method from `src/context/AuthContext.js`.
  - Verified no other endpoint in the server issues JWTs without verifying a password (`/register`, `/login`) or SMS OTP (`/phone/verify-otp`).
- **Automated Test**: `Security: Disabled Unverified Social Login › POST /api/auth/social-login returns 404 (unverified route removed)` in `server/tests/auth.test.js`.
