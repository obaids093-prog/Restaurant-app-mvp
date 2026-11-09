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

---

## 3. Inventory Concurrency, Negative Raw Stocks & Cancellation Restitution
- **Vulnerability Finding**:
  - Dish depletion relied on non-atomic `findById` followed by JavaScript arithmetic and `save()`, leading to race conditions under concurrent orders.
  - Raw ingredients could decrement below 0 without lower bounds.
  - Cancelled orders never restored inventory, permanently draining restaurant supplies and triggering false "Sold Out" states.
- **Remediation Fix**:
  - In `server/services/inventoryService.js`:
    - Refactored `depleteOrderIngredients` to atomic MongoDB `findByIdAndUpdate` with `$inc` and clamped non-negative lower bounds (`Math.min(currentStock, qty)`).
    - Added non-negative lower bound checks for raw `Ingredient` stock decrements.
    - Implemented `restoreOrderIngredients(order)` restoring dish portions, raw ingredient supplies, and auto-resetting `isAvailable: true`.
  - In `server/controllers/orderController.js`:
    - Integrated `restoreOrderIngredients` in both customer self-cancellation (`cancelMyOrder`) and manager order cancellation paths.
- **Automated Test**: `Inventory Depletion & Restitution Service (Safety Fix #3)` in `server/tests/inventory.test.js` (8 unit tests verifying atomic decrements, zero-floor clamping, auto-sold-out transitions, and cancellation restitution).

---

## 4. Unsigned Table QR Code Injection & Forgery
- **Vulnerability Finding**: Table QR codes were completely unsigned. Anyone could craft an arbitrary `aura://table?branch=...&table=42` deep link or submit forged table numbers to `/api/tables/verify-qr`, tricking the system into locking wrong or non-existent tables.
- **Remediation Fix**:
  - In `server/controllers/tableController.js`:
    - Implemented cryptographic HMAC-SHA256 signature generation (`signTableQR`) and verification (`verifyTableQRSignature`).
    - Appended cryptographic signatures (`&sig=...`) and optional timestamp expiration (`&exp=...`) to generated table standee deep links.
    - Updated `POST /api/tables/verify-qr` to validate QR signatures: rejects tampered signatures or expired codes with 400 Bad Request. Returns `verifiedSignature: true` and `isTamperProof: true` for authentic standees.
- **Automated Test**: `Table QR HMAC Cryptographic Signing (Safety Fix #4)` in `server/tests/tableQR.test.js` (6 unit tests verifying signature consistency, tampering rejection, expiration rejection, and standee signature inclusion).
