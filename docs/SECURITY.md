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
## 6. Security Hardening & Zero-Trust Defense (Part C)

### Architectural Protections
1. **Zod Input Validation with Strict Schema Enforcement**:
   - Every route validates `req.body`, `req.params`, or `req.query` with Zod schemas.
   - All mutations enforce `.strict()`: extra or unknown injected fields are rejected with HTTP 400 Bad Request.
   - Numeric fields (quantities, prices, coordinates, ratings) enforce minimums and maximums to prevent integer wrap, negative charges, and resource abuse.
2. **Rotating Refresh Tokens & Replay Attack Invalidation**:
   - Access tokens are short-lived (15 minutes).
   - Refresh tokens are cryptographically random 256-bit hex strings, hashed with SHA-256 before storage in MongoDB.
   - Each token belongs to an immutable token family. When a token is refreshed, it is revoked and replaced with a child token.
   - If an attacker attempts to replay a previously rotated token, the server immediately revokes every token in that user's token family, forcing re-authentication.
3. **Constant-Work Password Verification**:
   - `POST /api/auth/login` defends against user enumeration timing attacks by running a full bcrypt comparison against a pre-computed dummy hash when an email is not found.
   - Accounts enter temporary 15-minute lockouts after 5 consecutive failed login attempts.
4. **File Upload Security & Magic Bytes Verification**:
   - `POST /api/upload` checks actual file signatures (magic bytes) for JPEG, PNG, and WebP, rejecting disguised scripts or executables.
   - Generates random 16-byte hex filenames to prevent path traversal (`../../`).
   - Serves files with `X-Content-Type-Options: nosniff`.
   - Per-user sliding rate limiting prevents storage denial of service.
5. **Manager Action Audit Logging**:
   - Critical administrative actions (staff creation, menu modification, order cancellation/status change, voucher creation) are recorded in `AuditLog` collection with actor ID, email, role, target resource, and IP address.
   - Audit logs are accessible exclusively via manager-only endpoint `GET /api/audit-logs`.
6. **HTTP Parameter Pollution & Security Headers**:
   - `hpp()` prevents array-pollution vulnerabilities in queries and parameters.
   - Helmet configures `crossOriginResourcePolicy: { policy: 'cross-origin' }` and modern defense headers.
   - 30-second request timeout middleware prevents connection hanging.

---

## 7. Route-by-Route Authorization & Validation Matrix

| Endpoint | Method | Access Rule | Zod Validation Schema | Test Verification |
| :--- | :---: | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | `registerSchema` (.strict) | `auth.test.js`, `securityHardening.test.js` |
| `/api/auth/login` | `POST` | Public (Rate Limited) | `loginSchema` (.strict) | `auth.test.js`, `securityHardening.test.js` |
| `/api/auth/refresh` | `POST` | Public | `refreshTokenSchema` (.strict) | `securityHardening.test.js` |
| `/api/auth/logout` | `POST` | Public / Token Owner | `refreshTokenSchema` (.strict) | `securityHardening.test.js` |
| `/api/auth/me` | `GET` | Private (Any Authenticated) | Bearer Token Auth | `auth.test.js` |
| `/api/auth/profile` | `PUT` | Private (Owner) | `updateProfileSchema` (.strict) | `auth.test.js` |
| `/api/auth/profile` | `DELETE` | Private (Owner) | Bearer Token Auth | `accountDeletion.test.js` |
| `/api/auth/staff` | `POST` | Private (Manager Only) | `staffCreateSchema` (.strict) | `auth.test.js` |
| `/api/auth/phone/send-otp` | `POST` | Public (Daily Capped) | `phoneSendOtpSchema` (.strict) | `auth.test.js` |
| `/api/auth/phone/verify-otp` | `POST` | Public | `phoneVerifyOtpSchema` (.strict) | `auth.test.js` |
| `/api/menu` | `GET` | Public | `menuQuerySchema` | `menu.test.js` |
| `/api/menu` | `POST` | Private (Manager Only) | `menuItemCreateSchema` (.strict) | `menu.test.js` |
| `/api/menu/:id` | `PUT` | Private (Manager Only) | `idParamSchema`, `menuItemUpdateSchema` | `menu.test.js` |
| `/api/menu/:id` | `DELETE` | Private (Manager Only) | `idParamSchema` | `menu.test.js` |
| `/api/orders` | `GET` | Private (Manager Only) | Bearer Token Auth | `orders.test.js` |
| `/api/orders/my` | `GET` | Private (Owner) | Bearer Token Auth | `orders.test.js` |
| `/api/orders` | `POST` | Private (Customer / Manager) | `orderCreateSchema` | `orders.test.js`, `securityHardening.test.js` |
| `/api/orders/:id/status` | `PATCH` | Private (Manager / Kitchen) | `idParamSchema`, `orderStatusUpdateSchema` | `orders.test.js` |
| `/api/orders/:id/cancel` | `PATCH` | Private (Owner within 10 min) | `idParamSchema` | `orders.test.js` |
| `/api/reservations` | `POST` | Private (Customer / Manager) | `reservationCreateSchema` (.strict) | `reservations.test.js` |
| `/api/reservations/my` | `GET` | Private (Owner) | Bearer Token Auth | `reservations.test.js` |
| `/api/reservations` | `GET` | Private (Manager Only) | Bearer Token Auth | `reservations.test.js` |
| `/api/reservations/:id` | `PATCH` | Private (Manager / Owner Cancel) | `idParamSchema`, `reservationStatusUpdateSchema` | `reservations.test.js` |
| `/api/tables` | `GET` | Public | None | `tableQR.test.js` |
| `/api/tables/verify-qr` | `POST` | Public | `tableQRVerifySchema` (.strict) | `tableQR.test.js` |
| `/api/upload` | `POST` | Private (Manager Only) | Magic Bytes + Rate Limiter | `cloudStorage.test.js`, `securityHardening.test.js` |
| `/api/reviews` | `POST` | Private (Order Owner) | `reviewCreateSchema` (.strict) | `reviews.test.js` |
| `/api/reviews/my` | `GET` | Private (Owner) | Bearer Token Auth | `reviews.test.js` |
| `/api/reviews/:id` | `PATCH` | Private (Owner within 24h) | `idParamSchema`, `reviewUpdateSchema` | `reviews.test.js` |
| `/api/reviews/:id/reply` | `PATCH` | Private (Manager Only) | `idParamSchema`, `reviewReplySchema` | `reviews.test.js` |
| `/api/vouchers/active` | `GET` | Public | None | `vouchers.test.js` |
| `/api/vouchers/validate` | `POST` | Public | `voucherValidateSchema` (.strict) | `vouchers.test.js` |
| `/api/vouchers` | `POST` | Private (Manager Only) | `voucherCreateSchema` (.strict) | `vouchers.test.js` |
| `/api/vouchers/:id` | `PUT` | Private (Manager Only) | `idParamSchema`, `voucherUpdateSchema` | `vouchers.test.js` |
| `/api/loyalty` | `GET` | Private (Owner) | Bearer Token Auth | `loyalty.test.js` |
| `/api/loyalty/quote` | `POST` | Private (Owner) | `loyaltyQuoteSchema` (.strict) | `loyalty.test.js` |
| `/api/inventory` | `GET` | Private (Manager Only) | Bearer Token Auth | `inventory.test.js` |
| `/api/inventory/replenish` | `POST` | Private (Manager Only) | `inventoryRestockSchema` (.strict) | `inventory.test.js` |
| `/api/audit-logs` | `GET` | Private (Manager Only) | Query params (page, limit) | `securityHardening.test.js` |

