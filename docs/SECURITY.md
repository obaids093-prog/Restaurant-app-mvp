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

## 2. Unauthorized Socket.io Manager Room Eavesdropping & Client Room Tampering
- **Vulnerability Finding**: `socket.on('join:role')` previously allowed connected clients to request arbitrary room joins, and sockets allowed unauthenticated connections.
- **Remediation Fix**:
  - In `server/services/socketService.js`:
    - Made socket connection strictly authenticated via JWT; unauthenticated handshakes are rejected immediately.
    - Completely removed client-side `join:role` event listener and client room request capability.
    - Server automatically puts sockets into `user:<userId>` and verified role rooms (`role:manager`, `role:customer`).
  - In `src/context/SocketContext.js`:
    - Removed `socket.emit('join:role')` from client lifecycle.
- **Automated Test**: `Server-Controlled Room Assignments (Safety Fix #2 & Part A)` in `server/tests/socket.test.js`.

---

## 3. Inventory Concurrency, Negative Raw Stocks & Cancellation Restitution
- **Vulnerability Finding**:
  - Race conditions during concurrent orders could deplete stock below zero.
  - Cancelled orders previously never restored inventory.
- **Remediation Fix**:
  - In `server/services/inventoryService.js`:
    - Switched depletion to conditional atomic `$inc` (`{ _id, stockCount: { $gte: qty } }`), guaranteeing stock never drops below 0 even under simultaneous concurrent orders.
    - Automatic toggle of `isAvailable: false` when stock reaches 0.
    - Implemented `restoreOrderIngredients(order)` restoring dish portions, raw ingredient supplies, and auto-resetting `isAvailable: true`.
- **Automated Test**: `Inventory Depletion & Restitution Service (Safety Fix #3)` in `server/tests/inventory.test.js` (including simultaneous concurrent order simulation test).

---

## 4. Unsigned Table QR Code Injection & Forgery
- **Vulnerability Finding**: Table QR codes were completely unsigned, allowing arbitrary table spoofing.
- **Remediation Fix**:
  - In `server/controllers/tableController.js`:
    - Implemented cryptographic HMAC-SHA256 signature generation (`signTableQR`) and verification (`verifyTableQRSignature`).
    - Dedicated `TABLE_QR_SECRET` environment variable with production startup guard that refuses to boot if missing.
    - Appended cryptographic signatures (`&sig=...`) and optional timestamp expiration (`&exp=...`) to generated table standee deep links.
    - Updated `POST /api/tables/verify-qr` to validate QR signatures: rejects tampered signatures or expired codes with 400 Bad Request.
- **Automated Test**: `Table QR HMAC Cryptographic Signing (Safety Fix #4)` in `server/tests/tableQR.test.js`.

---

## 5. Simulated Payment Production Fraud & Card Data Collection
- **Vulnerability Finding**: Simulated online card and mobile wallet endpoints (`/api/payments/initiate` and `/api/payments/verify-otp`) allowed fake OTPs and collected sensitive card PAN and CVV data without PCI certification.
- **Remediation Fix**:
  - In `server/controllers/paymentController.js` and `server/routes/paymentRoutes.js`:
    - Purged all simulated payment mechanisms (JazzCash, EasyPaisa, online cards, 3DS OTP).
    - Permitted payment methods restricted exclusively to real-world in-person settlement (`cash` and `pay_at_table`).
    - Deleted `/verify-otp` and `/tokenize-card` endpoints.
    - Deleted client-side payment forms (`PaymentDetailsForm.js`, `OtpVerificationModal.js`). Zero card details are ever accepted or stored.
    - Created `docs/PAYMENTS_FUTURE.md` detailing future PCI-compliant integration plans.
- **Automated Test**: `Payment Methods Configuration`, `GET /api/payments/methods`, `POST /api/payments/initiate`, and `Removed Simulated Payment Endpoints` in `server/tests/payments.test.js`.
  - The payment UI lacked explicit simulation disclaimers alerting users not to input authentic financial instruments.
- **Remediation Fix**:
  - In `server/controllers/paymentController.js`:
    - Added production environment guards blocking online simulated payments and fake OTP verification when `NODE_ENV === 'production'` unless explicitly opted into via `ALLOW_SIMULATED_PAYMENTS`.
    - Allowed offline payment methods (Cash and Pay at Table) to proceed normally.
    - Immediately purged raw `cardCvv` from `req.body` upon receipt.
  - In `src/components/PaymentSheet/PaymentDetailsForm.js`:
    - Added a visible warning banner notifying users that the system operates in a simulated sandbox environment.
  - In `src/components/PaymentSheet/OtpVerificationModal.js`:
    - Enhanced the demo notice banner with clear simulation badges and disclaimer copy.
- **Automated Test**: `Production Safety Guards (Safety Fix #5)` in `server/tests/payments.test.js` (3 unit tests verifying production rejection of simulated online payments, offline payment allowance, and production rejection of OTP verification).
