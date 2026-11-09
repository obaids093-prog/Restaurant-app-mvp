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

---

## 2. Unauthorized Socket.io Manager Room Eavesdropping
- **Vulnerability Finding**: `socket.on('join:role')` previously allowed any connected client (even unauthenticated or customer users) to emit `join:role('manager')` and join the `role:manager` room. This allowed malicious clients to eavesdrop on all kitchen tickets, manager alerts, and inventory alerts.
- **Remediation Fix**:
  - In `server/services/socketService.js`:
    - Extracted and verified authenticated user ID and verified role via JWT and MongoDB User model during socket handshake middleware.
    - Implemented `handleRoleJoin(socket, requestedRole)` with strict RBAC: rejects `manager` room requests unless `socket._userRole === 'manager'`. Emits `error:unauthorized` to offending clients.
    - Exported `handleRoleJoin` for automated unit testing.
- **Automated Test**: `Security & RBAC Room Guards (Safety Fix #2)` in `server/tests/socket.test.js` (5 unit tests verifying rejection of unauthenticated clients, rejection of customers, acceptance of managers, and denial of unknown roles).
