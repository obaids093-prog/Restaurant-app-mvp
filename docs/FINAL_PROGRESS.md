# Release Candidate Progress Tracker

Tracking progress across all phases for Release Candidate hardening, verification, and preparation.

| Part | Description | Status | Commit | Server Tests |
| :--- | :--- | :---: | :---: | :---: |
| **PART A** | Finish Safety Fixes & Remove Simulations (Payments, Sockets, Table QR, Inventory, Rider Tracking, SMS) | COMPLETED | `d1bd010` | 15 suites, 154 passed |
| **PART B** | Verify Every Feature & Comprehensive Fixes (Auth, Staff, Menu, Vouchers, Reservations, Pagination, etc.) | COMPLETED | `0adbb8b` | 15 suites, 154 passed |
| **PART C** | Security Hardening (Zod validation, Refresh Tokens, Rate Limits, Magic Bytes, Helmet, Logging, CI) | COMPLETED | `6c368b0` | 16 suites, 162 passed |
| **PART D** | Play Store & Customer Trust (Account Deletion, Legal Screens, Offline Handling, App Icons) | COMPLETED | `20bfd27` | 16 suites, 162 passed |
| **PART E** | Password Reset & Email (SMTP / Nodemailer optional environment integration) | COMPLETED | `f2222dd` | 17 suites, 171 passed |
| **PART F** | Final QA, Lint, Bundle Export & Documentation Sync | COMPLETED | In progress | 17 suites, 171 passed |
| **PART G** | Safe Push Verification & Release Candidate Push | PENDING | - | - |

## Detailed Fixes Log
- Baseline initialized on branch `release-candidate` branched from `safety-fixes`.
- **PART A Finished (`d1bd010`)**:
  - Removed simulated card, JazzCash, EasyPaisa, and 3DS OTP flows; only Cash and Pay-at-table settlements are accepted.
  - Authored `docs/PAYMENTS_FUTURE.md` detailing future PCI-compliant payment gateway integration.
  - Enforced strict socket authentication (JWT required, no anonymous connections). Removed client-controlled `join:role` emission; server automatically assigns personal room (`user:<id>`) and role room (`role:manager`, `role:customer`).
  - Added dedicated `TABLE_QR_SECRET` environment variable with production startup guard refusing to run if missing.
  - Upgraded inventory service to atomic conditional `$inc` (`{ stockCount: { $gte: qty } }`) to guarantee stock never drops below 0 under high concurrency, added restitution on cancellation, and implemented simultaneous-order test.
  - Completely purged simulated courier/rider GPS tracking (`riderTrackingService.js`, `riderTracking.test.js`, and client screens `RiderTracking/*`, `useRiderTracking.js`).
  - Removed simulated SMS receipts from `receiptService.js` and `DigitalReceiptModal.js`, retaining WhatsApp receipt deep linking.
  - Eliminated simulated payment form components (`PaymentDetailsForm.js`, `OtpVerificationModal.js`).
- **PART B Finished (`0adbb8b`)**:
  - Email domain rule: relaxed restrictive `@gmail.com` checks across backend (`authController.js`, `User.js` model) and frontend (`LoginScreen.js`, `ProfileScreen.js`) to allow any RFC 5322 compliant email domain, and sanitized email input placeholders (`you@example.com`).
  - Shared constants: created `src/config/constants.js` and synchronized `server/config/constants.js` with `CANCEL_WINDOW_MINUTES = 10` and `POLLING_INTERVAL_MS = 10000`, wired into tracking and kitchen display screens.
  - Pagination enforcement: added pagination limits on `getMyReviews` (100) and manager staff directory (100) queries, ensuring zero unbounded database finds across production endpoints.
  - Purged hardcoded demo promo code fallbacks (`LEGACY_PROMO_CODES`) from `orderController.js`, strictly enforcing real database voucher validation and usage limits.
  - Sanitized payment handling during checkout: removed client-specified `paymentStatus: 'Paid'` and client arbitrary `discountPercent`, enforcing server-computed totals and authoritative pending status.
  - Verified atomic loyalty points quote, deduction, and automatic refund on order cancellation.
  - Verified reservation capacity checks and 409 conflict handling on duplicate table slot bookings.
  - Verified dish reviews restricted strictly to served orders with one-review-per-dish-per-order guarantee.
- **PART C Finished (`6c368b0`)**:
  - Comprehensive Zod input validation schemas (.strict()) applied across auth, menu, orders, reservations, tables, reviews, vouchers, loyalty, inventory, and analytics routes.
  - Short-lived 15m access tokens and rotating SHA-256 hashed refresh tokens with family reuse detection (revokes entire token family upon replay attack).
  - Constant-work timing defense on login (`bcrypt.compare(password, DUMMY_HASH)`) and 5-failure account lockout (15 minutes).
  - Magic bytes file upload inspection verifying JPEG, PNG, and WebP signatures with random 16-byte hex filenames and `X-Content-Type-Options: nosniff`.
  - Administrative audit logging model and service recording actor ID, email, role, action, and target for manager changes, exposed via `GET /api/audit-logs`.
  - Modern security headers with Helmet (`crossOriginResourcePolicy: { policy: 'cross-origin' }`), HTTP parameter pollution (`hpp`), 30-second request timeouts, and global API rate limiting.
  - Client silent refresh on HTTP 401 using stored refresh token with automatic retry.
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`), Gitleaks scan (`.github/workflows/gitleaks.yml`), and Dependabot config (`.github/dependabot.yml`).
  - Added new automated test suite `server/tests/securityHardening.test.js` (8 passing unit tests).
- **PART D Finished (`20bfd27`)**:
  - User erasure via `DELETE /api/auth/profile` with PII anonymization across Orders, Reviews, and Reservations to maintain accounting and operational history without retaining personally identifiable information.
  - Added `LegalModal.js` providing in-app modal screens for Privacy Policy, Terms of Service, and Concierge Contact information.
  - Updated Profile screen with legal links accessible to both guest and authenticated users.
  - Configured adaptive Android icon paths (`android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`) in `app.json`.
- **PART E Finished (`f2222dd`)**:
  - Implemented secure password reset flow with single-use SHA-256 hashed tokens and 30-minute expiry (`PasswordResetToken` collection).
  - Added `forgotPassword` endpoint with constant-time response (never leaking user existence).
  - Added `resetPassword` endpoint enforcing strong password constraints, marking token used, and invalidating all active refresh token sessions.
  - Implemented transactional email service (`emailService.js`) using Nodemailer with optional SMTP environment variable configuration and local console fallback.
  - Added `tests/passwordReset.test.js` covering 9 unit test scenarios (total: 17 suites, 171 tests passing).
- **PART F Finished**:
  - Validated syntax of 100% server files via `node --check`.
  - Executed Android compilation and Metro bundling check via `expo export -p android --no-minify` with zero bundling errors.
  - Added `docs/QA_CHECKLIST.md` verifying manual and automated QA requirements.
  - Verified documentation alignment and unslop clarity across repository docs.
