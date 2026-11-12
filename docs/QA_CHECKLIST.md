# Release Candidate Quality Assurance Checklist

**Target Branch:** `release-candidate`  
**Execution Date:** November 2026  
**Testing Framework:** Jest + Supertest  
**Mobile Environment:** Expo SDK 57 (React Native 0.81.5)  

---

## 1. Automated Test Suites & Verification

- [x] **Auth & Session Security:** `tests/auth.test.js` (Customer registration, password hashing, constant-work defense, 5-failure lockout, phone OTP SMS flow).
- [x] **Security Hardening:** `tests/securityHardening.test.js` (Strict Zod schema rejection, 15m access tokens, refresh token rotation, token family replay revocation, magic bytes image checks, RBAC).
- [x] **Password Reset & Recovery:** `tests/passwordReset.test.js` (Non-enumerating forgot-password responses, single-use SHA-256 hashed reset tokens, token expiry, strong password enforcement, automatic refresh token revocation).
- [x] **Menu & Catalog:** `tests/reviews.test.js`, `tests/noHardcodedVouchers.test.js` (Category filtering, pagination bounds, dynamic voucher retrieval from database).
- [x] **Orders & Dining Operations:** `tests/receipt.test.js`, `tests/payments.test.js` (Authentic digital receipt generation, strictly cash and pay-at-table modes, no simulated card processing).
- [x] **Table Management & Signed QR:** `tests/tableQR.test.js` (HMAC-SHA256 signature verification on table QR payloads, prevention of tampering).
- [x] **Inventory Control:** `tests/inventory.test.js` (Atomic stock decrements on order checkout, restock capabilities, stock exhaustion checks).
- [x] **Loyalty & Tier Calculation:** `tests/loyalty.test.js` (Tier calculation: Bronze/Silver/Gold/Platinum, quote calculation, redemption validation).
- [x] **Real-Time Communication:** `tests/socket.test.js` (JWT authentication on WebSocket connection handshake, room joins, live order/kitchen events).
- [x] **Cloud Storage:** `tests/cloudStorage.test.js` (Cloudinary upload integration with memory fallback).
- [x] **Analytics & Reporting:** `tests/analytics.test.js` (Sales metrics aggregation, branch breakdowns, manager-restricted route protection).
- [x] **Audit Trail:** Manager administrative actions recorded to `AuditLog` collection.

---

## 2. Play Store & Regulatory Compliance

- [x] **User Erasure (Account Deletion):** In-app deletion via `DELETE /api/auth/profile` with PII anonymization (`Deleted Customer`), clearing sensitive contact data across reservations, orders, and reviews.
- [x] **In-App Legal Transparency:** `LegalModal` rendering Privacy Policy, Terms of Service, and Concierge Contact directly without external browser dependencies.
- [x] **Asset Branding & Adaptive Icons:** Validated `./assets/android-icon-foreground.png`, `./assets/android-icon-background.png`, and `./assets/android-icon-monochrome.png` configured in `app.json`.
- [x] **Zero Mock / Zero Simulated Code:** No fake card payments, fake SMS gateways, or mock rider tracking.

---

## 3. Client Build & Compilation Verification

- [x] **Metro Bundling Check:** Bundled via `expo export -p android --no-minify` with 0 unresolved modules and 0 syntax failures across 1,200+ modules.
- [x] **Backend Syntax Verification:** Verified 100% of server JavaScript source files with `node --check`.
- [x] **Environment Security:** No raw API keys, credentials, or `.env` secrets tracked in Git.
