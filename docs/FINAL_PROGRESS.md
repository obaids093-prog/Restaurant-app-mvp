# Release Candidate Progress Tracker

Tracking progress across all phases for Release Candidate hardening, verification, and preparation.

| Part | Description | Status | Commit | Server Tests |
| :--- | :--- | :---: | :---: | :---: |
| **PART A** | Finish Safety Fixes & Remove Simulations (Payments, Sockets, Table QR, Inventory, Rider Tracking, SMS) | COMPLETED | `d1bd010` | 15 suites, 154 passed |
| **PART B** | Verify Every Feature & Comprehensive Fixes (Auth, Staff, Menu, Vouchers, Reservations, Pagination, etc.) | PENDING | - | - |
| **PART C** | Security Hardening (Zod validation, Refresh Tokens, Rate Limits, Magic Bytes, Helmet, Logging, CI) | PENDING | - | - |
| **PART D** | Play Store & Customer Trust (Account Deletion, Legal Screens, Offline Handling, App Icons) | PENDING | - | - |
| **PART E** | Password Reset & Email (SMTP / Nodemailer optional environment integration) | PENDING | - | - |
| **PART F** | Final QA, Lint, Bundle Export & Documentation Sync | PENDING | - | - |
| **PART G** | Safe Push Verification & Release Candidate Push | PENDING | - | - |

## Detailed Fixes Log
- Baseline initialized on branch `release-candidate` branched from `safety-fixes`.
- **PART A Finished**:
  - Removed simulated card, JazzCash, EasyPaisa, and 3DS OTP flows; only Cash and Pay-at-table settlements are accepted.
  - Authored `docs/PAYMENTS_FUTURE.md` detailing future PCI-compliant payment gateway integration.
  - Enforced strict socket authentication (JWT required, no anonymous connections). Removed client-controlled `join:role` emission; server automatically assigns personal room (`user:<id>`) and role room (`role:manager`, `role:customer`).
  - Added dedicated `TABLE_QR_SECRET` environment variable with production startup guard refusing to run if missing.
  - Upgraded inventory service to atomic conditional `$inc` (`{ stockCount: { $gte: qty } }`) to guarantee stock never drops below 0 under high concurrency, added restitution on cancellation, and implemented simultaneous-order test.
  - Completely purged simulated courier/rider GPS tracking (`riderTrackingService.js`, `riderTracking.test.js`, and client screens `RiderTracking/*`, `useRiderTracking.js`).
  - Removed simulated SMS receipts from `receiptService.js` and `DigitalReceiptModal.js`, retaining WhatsApp receipt deep linking.
  - Eliminated simulated payment form components (`PaymentDetailsForm.js`, `OtpVerificationModal.js`).
