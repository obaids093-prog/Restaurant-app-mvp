# Feature Verification Audit & Gap Analysis

**Branch**: `features-batch-1`  
**Date**: 2026-10-24  
**Audit Target**: Features Batch 1 codebase and `AURA_Restaurant_App_Features_and_Roadmap.docx` (source markdown: `docs/APP_FEATURES_AND_ROADMAP.md`).  
**Resumption Protocol**: If a session ends, the next session resumes from this file (`docs/FEATURE_AUDIT.md`).

---

## Executive Summary

- **Server Test Suite**: 53 tests passing across 4 suites (`tests/notifications.test.js`, `tests/vouchers.test.js`, `tests/reviews.test.js`, `tests/loyalty.test.js`). 0 failures.
- **Syntax & Compilation**: `node --check` passed on 100% of server JavaScript files with 0 syntax errors.
- **Linter**: ESLint passed with 0 errors (78 warnings).
- **Android Production Bundle**: `expo export --platform android` completed with 0 errors (1 bundle 2.9 MB, 54 static assets).
- **Batch 1 vs Batch 2 Gap**: Analytics, Deals row server-driven endpoint (`/api/vouchers/active`), 6-second in-app banner toast, and comprehensive jargon refactoring belong to Batch 2 and are **NOT present** on `features-batch-1`.
- **Critical Risk Discovered**: Phone OTP registration is broken in code due to a schema regex conflict (`@customer.aura.pk` vs `/^[a-zA-Z0-9_.+-]+@gmail\.com$/`), and loyalty points are never refunded upon order cancellation.

---

## PART A: Check Batch 1

### 1. Test Execution Results

**Total Test Count**: 53 tests  
**Pass Count**: 53 passed, 0 failed (100% pass rate)  
**Execution Time**: 54.73s (via Jest with MongoDB Memory / Atlas test instance)

#### Pass Count Per Suite & Per Feature

| Test Suite File | Feature Domain | Test Count | Pass Count | Status |
|---|---|:---:|:---:|:---:|
| `server/tests/reviews.test.js` | Feature 1: Ratings and Reviews Endpoints | 13 | 13 | PASS |
| `server/tests/vouchers.test.js` | Feature 2: Promotional Coupon & Voucher Engine | 17 | 17 | PASS |
| `server/tests/loyalty.test.js` | Feature 3: Patron Loyalty Points & VIP Tiers | 13 | 13 | PASS |
| `server/tests/notifications.test.js` | Feature 4: In-App Notification System | 10 | 10 | PASS |
| *(Analytics - Not in Batch 1)* | Feature: Executive Business Analytics | 0 | 0 | NOT IN BATCH 1 |
| **Total** | | **53** | **53** | **100% PASS** |

#### Verification of Exact Proof Assertions

1. **A customer cannot review a dish they did not receive**:
   - **Code Implementation**: `server/services/reviewService.js` (lines 72–79) verifies `order.items.some(...)` and throws `400 ('The specified dish was not part of this order')`.
   - **Test Status**: **UNTESTED IN SUITE**. `reviews.test.js` tests unserved order, wrong customer ownership, duplicate review, and invalid rating, but lacks an explicit test submitting a dish ID not present in the order.
2. **A second review of the same dish and order is rejected**:
   - **Exact Test**: `POST /api/reviews > rejects duplicate review for the same dish on the same order` (`server/tests/reviews.test.js:158`).
   - **Proof**: Submits a second review for the same `servedOrder._id` and `testDish._id`; asserts status `400` with message matching `/already reviewed/i`.
3. **An expired, inactive or used-up voucher is rejected at order creation**:
   - **Exact Tests**:
     - `POST /api/vouchers/validate > rejects expired vouchers with 400` (`server/tests/vouchers.test.js:177`)
     - `POST /api/vouchers/validate > rejects inactive vouchers with 400` (`server/tests/vouchers.test.js:186`)
     - `POST /api/vouchers/validate > rejects voucher if usage limit is reached` (`server/tests/vouchers.test.js:204`)
     - `Order Placement & Voucher Usage Tracking (POST /api/orders) > rejects order creation if an invalid voucher code is submitted` (`server/tests/vouchers.test.js:280`)
   - **Proof**: `orderController.js` calls `voucherService.validateVoucher` directly during checkout; expired, inactive, or exhausted vouchers throw 400 errors blocking order creation.
4. **The order total is recomputed on the server with the voucher (subtotal, discount, 5% service charge, 15% tax)**:
   - **Exact Test**: `POST /api/orders > applies voucher discount during checkout and increments usageCount` (`server/tests/vouchers.test.js:254`).
   - **Proof**: For subtotal Rs. 2,000 with 20% discount (Rs. 400): net subtotal = Rs. 1,600, service charge (5%) = Rs. 80, provincial sales tax (15%) = Rs. 240, final totalAmount = Rs. 1,920. Asserted at line 273: `expect(res.body.totalAmount).toBe(1920)`.
5. **GET /api/vouchers/active hides inactive, expired, used-up and demo vouchers in production mode**:
   - **Status**: **NOT FOUND ON THIS BRANCH**. The endpoint `GET /api/vouchers/active` does not exist on `features-batch-1`. It was introduced on `features-batch-2` under commit `91b8cd4`.
6. **Analytics totals match the fixture data**:
   - **Status**: **NOT FOUND ON THIS BRANCH**. Analytics routes (`/api/analytics`), models, controllers, and tests do not exist on `features-batch-1`.
7. **A customer gets 403 on voucher management and analytics**:
   - **Voucher Management**: **PROVEN**. Exact test: `Manager Voucher Management (CRUD & RBAC) > rejects regular customer access to manager voucher routes (RBAC)` (`server/tests/vouchers.test.js:302`) sends customer JWT to `GET /api/vouchers` and expects `403`.
   - **Analytics**: **NOT FOUND ON THIS BRANCH** (Analytics was introduced in Batch 2).

---

### 2. Static Analysis & Build Verification

- **Node Syntax Check (`node --check`)**:
  - Command: `node --check` executed recursively across all `.js` files in `server/` (excluding `node_modules`).
  - Output: **0 errors**. All 34 server files passed syntax validation.
- **Linter (`npm run lint`)**:
  - Engine: ESLint 9 (`eslint-config-expo`).
  - Output: **0 errors, 78 warnings** (warnings consist of React Compiler memoization notices and impure `Date.now()` during render).
- **Android Production Bundle Export (`expo export --platform android`)**:
  - Command: `node ./node_modules/expo/bin/cli export --platform android`
  - Output: **0 errors**. Bundled 1,061 modules in 15,135ms. Generated Hermes bytecode bundle `_expo/static/js/android/index-98f36a6d812321b66a49e62ac259d9d7.hbc` (2.9 MB) and 54 font/icon assets.

---

### 3. Repository Search: Hardcoded Vouchers & Fake Data

Full repository scan across `src/`, `server/`, `docs/`, `seeds`, and `src/config/brand.js`:

#### A. Leftover Fixed Voucher Codes

| Voucher Code | File Path | Line | Snippet / Context |
|---|---|:---:|---|
| `WELCOME10` | `src/reducers/cartReducer.js` | 8 | `WELCOME10: 10, // 10% Off` in `PROMO_CODES` |
| `WELCOME10` | `src/screens/Menu/menuStyles.js` | 47 | `code: 'WELCOME10', description: 'Welcome Sanctuary Gift...'` in `DEALS_FOR_YOU` |
| `WELCOME10` | `src/screens/Cart/VoucherSection.js` | 65 | `placeholder="Enter voucher (e.g. WELCOME10)"` |
| `WELCOME10` | `src/screens/Cart/VoucherSection.js` | 90 | `['WELCOME10 (10%)', 'FEAST20 (20%)', 'AURA30 (30%)'].map(...)` |
| `WELCOME10` | `src/screens/Cart/CartEmptyState.js` | 49 | `onPress={() => onApplyPromo('WELCOME10')}` |
| `WELCOME10` | `src/screens/Cart/CartEmptyState.js` | 57 | `Voucher WELCOME10 (10% off) ready for checkout.` |
| `WELCOME10` | `server/controllers/orderController.js` | 130 | `WELCOME10: 10,` in fallback `LEGACY_PROMO_CODES` |
| `FEAST20` | `src/reducers/cartReducer.js` | 9 | `FEAST20: 20, // 20% Off` in `PROMO_CODES` |
| `FEAST20` | `src/screens/Menu/menuStyles.js` | 37 | `code: 'FEAST20', description: 'Artisan Feast Celebration...'` |
| `FEAST20` | `src/screens/Cart/VoucherSection.js` | 90 | `FEAST20 (20%)` in suggestion chips |
| `FEAST20` | `server/controllers/orderController.js` | 131 | `FEAST20: 20,` in fallback `LEGACY_PROMO_CODES` |
| `AURA30` | `src/reducers/cartReducer.js` | 12 | `AURA30: 30, // 30% Off` in `PROMO_CODES` |
| `AURA30` | `src/screens/Cart/VoucherSection.js` | 90 | `AURA30 (30%)` in suggestion chips |
| `AURA30` | `server/controllers/orderController.js` | 134 | `AURA30: 30,` in fallback `LEGACY_PROMO_CODES` |
| `CHEF15` / Chef's Tasting | `src/screens/Menu/menuStyles.js` | 32–34 | `code: 'CHEF15', description: "Chef's Tasting Reserve Special on culinary orders"` |
| `CHEF15` | `src/reducers/cartReducer.js` | 16 | `CHEF15: 15, // 15% Chef Special` in `PROMO_CODES` |
| `CHEF15` | `server/controllers/orderController.js` | 138 | `CHEF15: 15,` in fallback `LEGACY_PROMO_CODES` |
| `GOURMET30` | `src/screens/Menu/menuStyles.js` | 42 | `code: 'GOURMET30', description: "VIP Chef's Privilege on curated trays"` |
| `SAVE20` | `designs/stitch/.../code.html` | 195 | HTML prototype mockup banner only (not in app runtime) |
| `brand.js` | `src/config/brand.js` | — | **CLEAN**: Zero hardcoded promo codes found |

#### B. Hardcoded Rating Numbers & Mock Reviews

| Category | File Path | Line | Finding |
|---|---|:---:|---|
| Hardcoded Rating | `src/context/MenuContext.js` | 152 | `rating: 4.9` hardcoded when a manager adds a new dish via `addMenuItem()` |
| Hardcoded Ratings | `server/seed.js` | 88, 100, 112, 124, 161, 173, 185, 197, 210, 222, 247, 259, 271, 283 | Seed catalog dishes hardcoded with `rating: 4.9`, `4.8`, `4.7`, `4.6` |
| Fake Review Text | `src/` | — | **CLEAN**: Zero fake review text found in client screens; all reviews load dynamically from `/api/menu/:id/reviews` |

---

### 4. Implementation Status of Specific Milestone Tasks

1. **Phase 1 Item 6 (Developer Tooling & Scripts)**: **FINISHED**. ESLint 9, Prettier, `npm run lint`, `npm run format`, and `npm run check` scripts operational.
2. **Phase 1 Item 7 (Free-Stack Production Plan)**: **FINISHED**. Documented in `docs/FREE_STACK.md` covering Render free tier, MongoDB Atlas free tier, Expo Go/EAS, Unsplash CDN, and Cloudinary fallback.
3. **Phase 1 Item 8 (Final Check & Regression Baseline)**: **FINISHED for Batch 1**. 53/53 tests pass, `node --check` 0 errors, Android bundle builds cleanly.
4. **The Deals Row Fix**: **NOT FINISHED ON THIS BRANCH**. The Deals row still renders static `DEALS_FOR_YOU` from `src/screens/Menu/menuStyles.js`. The fix replacing it with `GET /api/vouchers/active` is on `features-batch-2`.
5. **Docs & PROJECT_LOG.md Entries**:
   - **Reviews**: **FINISHED**. Logged in `PROJECT_LOG.md:138` (`[2026-10-23] - Feat: Verified Patron Dish Reviews...`); schema in `DATABASE.md`.
   - **Vouchers**: **FINISHED**. Logged in `PROJECT_LOG.md:79` (`[2026-10-23] - Feat: Promotional Coupon & Voucher Engine...`); schema in `DATABASE.md`.
   - **Analytics**: **NOT FINISHED ON THIS BRANCH**. Analytics code and project log entries exist only on `features-batch-2`.

---

## PART B: Audit of the Feature Document Claims

### Feature Verification Matrix (Document Part 1)

| # | Feature Name | Implementing Code | Test That Proves It | Verdict | Evidence |
|:---:|---|---|---|:---:|---|
| 1 | Guest & Staff Authentication | `server/controllers/authController.js` (`register`, `login`, `createStaffAccount`) | `vouchers.test.js:302` (RBAC) | **PARTLY** | Email auth & RBAC verified; phone signup breaks due to regex conflict. |
| 2 | Branch & Outlet Selector | `src/config/brand.js` (`outlets`), `src/context/BranchContext.js` | `vouchers.test.js:213` (branch gating) | **VERIFIED** | Lahore & Islamabad branch switcher filters catalog and enforces voucher branch rules. |
| 3 | Dynamic Menu & Dish Catalog | `server/controllers/menuController.js`, `src/context/MenuContext.js` | `reviews.test.js:220` (`GET /api/menu/:id/reviews`) | **PARTLY** | Catalog loads from DB, but Deals ticker uses hardcoded `DEALS_FOR_YOU` on this branch. |
| 4 | Cart, Discounts & Folio Billing | `src/reducers/cartReducer.js`, `server/controllers/orderController.js` | `vouchers.test.js:254` (subtotal, voucher, service charge, tax) | **VERIFIED** | Server recomputes folio breakdown (subtotal - discount + 5% service + 15% tax). |
| 5 | Table Reservation Engine | `server/controllers/reservationController.js`, `src/screens/Reservation/` | *Manual verification in UI* | **PARTLY** | 3-step booking wizard and cancellation implemented, but 0 automated Jest tests exist. |
| 6 | Live Order Dispatch & Status Tracking | `server/controllers/orderController.js`, `src/screens/OrderTracking/` | `notifications.test.js:231` (order status change trigger) | **PARTLY** | Stepper works, but cancel window is 10m (doc claims 5m) and polling is 10s (doc claims 6s). |
| 7 | Verified Reviews & Reputation System | `server/services/reviewService.js`, `server/models/Review.js` | `reviews.test.js:133-344` (all 13 tests) | **VERIFIED** | Fully proven: atomic sync, served order requirement, duplicate block, manager reply. |
| 8 | VIP Loyalty & Rewards Tier Program | `server/services/loyaltyService.js`, `server/models/LoyaltyTransaction.js` | `loyalty.test.js:77-227` (all 13 tests) | **VERIFIED** | Tiers (Bronze/Silver/Gold/Platinum), 1 pt = Rs. 1 redemption, 50% cap, atomic earn/deduct proven. |
| 9 | In-App Notification Center | `server/services/notificationService.js`, `src/hooks/useNotifications.js` | `notifications.test.js:80-300` (all 10 tests) | **PARTLY** | In-app notification center verified; push gateway claim is unproven/unimplemented in batch 1. |
| 10 | Restaurant Manager Dashboard | `src/screens/Manager/ManagerDashboardScreen.js` (Orders, Reviews, Vouchers) | `vouchers.test.js:294-375`, `reviews.test.js:290-315` | **PARTLY** | Orders, Reviews, and Vouchers tabs verified; Analytics Overview tab is missing from batch 1. |
| 11 | Code Quality & Technical Health | `src/theme/theme.js`, `server/server.js`, `package.json` | 53 Jest tests passing | **PARTLY** | Dark/Light mode verified; test suite has 53 tests in 4 suites (not 67 in 6 suites). |

---

### Answers to Mandatory Specific Questions

#### (1) The real cancel window and real polling interval in code versus the document and older docs
- **Cancel Window**:
  - **In Code**: **10 minutes**. Defined in `server/config/constants.js:12` (`const CANCEL_WINDOW_MINUTES = 10;`) and `src/screens/OrderTracking/trackingStyles.js:4` (`export const CANCEL_WINDOW_MINUTES = 10;`).
  - **In Document**: Claims **5 minutes**.
  - **In Older Docs**: Stated **10 minutes** (`docs/academic/VIVA_NOTES.md:158`).
  - **Conclusion**: The document claim of 5 minutes is **wrong**; the active codebase enforces 10 minutes.
- **Polling Interval**:
  - **In Code**: **10 seconds** for order tracking (`src/screens/OrderTracking/OrderTrackingScreen.js:123`), **20 seconds** for notifications (`src/hooks/useNotifications.js:89`).
  - **In Document**: Claims **6 seconds**.
  - **In Older Docs**: Stated **10 seconds**.
  - **Conclusion**: The 6-second claim applies to Batch 2 (commit `f86b8ff`). On Batch 1, real polling is 10s and 20s.

#### (2) Does registration really block every email domain except gmail.com, and where? Is that rule also applied to staff, phone signup and profile edits?
- **Public Customer Registration**: **YES, strictly blocked**.
  - Client: `src/screens/Login/LoginScreen.js:141` (`!vals.email.trim().toLowerCase().endsWith('@gmail.com')`).
  - Server Controller: `server/controllers/authController.js:53` (`!cleanEmail.endsWith('@gmail.com')`).
  - Database Schema: `server/models/User.js:17` (`match: [/^[a-zA-Z0-9_.+-]+@gmail\.com$/]`).
- **Staff Creation (`POST /api/auth/staff`)**: **PARTLY**.
  - The controller `createStaffAccount` (`server/controllers/authController.js:316`) only checks `EMAIL_REGEX` and does not check `.endsWith('@gmail.com')`. However, `User.create` invokes the Mongoose schema validator which rejects non-Gmail addresses with an unhandled 500 error instead of a 400 error.
- **Phone Signup (`POST /api/auth/phone/verify-otp`)**: **CRITICAL BUG**.
  - In `server/controllers/authController.js:510`, phone signup auto-provisions `autoEmail = '${normalizedPhone}@customer.aura.pk'`.
  - Because `User.js` enforces `/^[a-zA-Z0-9_.+-]+@gmail\.com$/`, any customer attempting to sign up via Phone OTP will crash on `User.create` with a Mongoose `ValidationError: Please provide a valid Gmail address (@gmail.com)`.
- **Profile Edits (`PUT /api/auth/profile`)**: **YES, strictly blocked**.
  - Client: `src/screens/ProfileScreen.js:118`.
  - Server: `server/controllers/authController.js:180` rejects with 400.

#### (3) Where is the auth token stored on the phone?
- **Storage Type**: **Plain AsyncStorage** (with in-memory dictionary fallback).
- **Implementation**: `src/utils/safeStorage.js` wraps `@react-native-async-storage/async-storage` (`window.localStorage` on Web).
- **SecureStore Usage**: `expo-secure-store` is **not installed** and not used. Tokens are stored unencrypted in app sandbox storage.

#### (4) Loyalty: earning rate, tier multipliers, redemption rules, atomic execution, concurrency, and cancellations
- **Earning Rate**: 1 base point per Rs. 100 net spend (subtotal minus voucher discount minus loyalty discount) on orders that reach status `Served` (`server/services/loyaltyService.js:217`).
- **Tier Multipliers**:
  - Bronze (0–499 lifetime pts): `1.0x`
  - Silver (500–1,499 lifetime pts): `1.05x` (5% bonus)
  - Gold (1,500–3,999 lifetime pts): `1.10x` (10% bonus)
  - Platinum (4,000+ lifetime pts): `1.15x` (15% bonus)
- **Redemption Rule**: 1 point = Rs. 1 discount; minimum redemption is 50 points; capped at a maximum of 50% of the food subtotal (`server/services/loyaltyService.js:140`).
- **Atomic Operations**:
  - Earning: `User.findByIdAndUpdate` with `$inc: { loyaltyPoints: totalPointsEarned, lifetimePoints: totalPointsEarned }`.
  - Deducting: `User.findOneAndUpdate({ _id: userId, loyaltyPoints: { $gte: points } }, { $inc: { loyaltyPoints: -points } })`.
- **Can two orders spend the same points concurrently?**: **NO**. The query filter `loyaltyPoints: { $gte: points }` combined with MongoDB's atomic document locking ensures that if two requests arrive simultaneously, the second one matches 0 documents, receives `null`, and fails with 400 (`'Could not redeem points: insufficient balance or concurrent modification'`).
- **Are points returned on cancellation?**: **NO (DATA LOSS RISK)**. Neither customer cancellation (`orderController.js:294`) nor manager cancellation (`orderController.js:316`) calls any loyalty refund logic. Redeemed points are permanently lost.
- **Tests That Prove Loyalty**: All 13 tests in `server/tests/loyalty.test.js`, specifically:
  - `rejects redemption under 50 points with 400`
  - `rejects redemption exceeding 50% of food subtotal with 400`
  - `deducts points from user balance and applies discount to order`
  - `awards loyalty points when manager marks order as Served and upgrades tier`
  - `does not duplicate points if awardOrderPoints is called again (idempotent)`

#### (5) Push: Are push tokens saved, was a real push ever sent, and what does the app need to receive one?
- **Push Tokens Saved?**: **NO**. `server/models/User.js` has no `pushToken` field.
- **Was a Real Push Ever Sent?**: **NO**. Notifications in Batch 1 are 100% database documents polled via HTTP.
- **Requirements for Real Push on a Physical Device**:
  1. `expo-notifications` and `expo-device` installed.
  2. Standalone or custom development build (`eas build`), as push notifications are restricted in Expo Go SDK 52+.
  3. EAS Project ID configured in `app.json`.
  4. Runtime permission requests (`Notifications.requestPermissionsAsync()`).
  5. Backend integration with Expo Push API (`https://exp.host/--/api/v2/push/send`).

#### (6) Where are uploaded dish photos stored on the Render deployment and do they survive a redeploy or restart?
- **Storage Location**: Local server disk inside `server/uploads/` via `multer.diskStorage` (`server/controllers/uploadController.js:38`).
- **Do they survive a redeploy or restart?**: **NO**. Render free-tier instances run on ephemeral containers. All files written to `server/uploads/` are completely erased whenever the service sleeps, restarts, or redeploys, leaving broken images in the app.

#### (7) Notifications: Which events create a notification, and are they created on the server inside the same action?
- **Events That Create Notifications**:
  1. **Order Status Changes**: Manager advancing order to Preparing, Ready, Served, or Cancelled (`orderController.js:320, 351`). *(Note: Customer self-cancellation does NOT dispatch a notification)*.
  2. **Manager Review Replies**: Manager replying to a customer's dish review (`reviewService.js:222`).
  3. **Loyalty Points Credited**: Order reaching status `Served` (`loyaltyService.js:271`).
  4. **Loyalty Tier Upgrades**: Crossing lifetime point thresholds (`loyaltyService.js:277`).
- **Are they created inside the same action?**: **YES**. They are dispatched synchronously (with `await`) within the controller/service method during the HTTP transaction, wrapped in `try...catch` so notification errors do not abort the parent action.

#### (8) The Render deployment: Environment variables, server URL resolution, and free service sleeping
- **Required Environment Variables (Names Only)**:
  - `PORT`
  - `NODE_ENV`
  - `MONGO_URI`
  - `JWT_SECRET`
  - `CORS_ORIGINS`
- **How the App Gets Server URL**:
  - Hardcoded in `src/api/client.js:18`:
    `export const BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'https://aura-app-49n0.onrender.com';`
- **Is Free Service Sleeping Handled?**:
  - **PARTLY**. `src/api/client.js:99` sets a 45-second `AbortController` timeout to allow the 30–50s Render cold-start wake-up.
  - **Shortcoming**: If the request exceeds 45s, it throws a generic error `"Cannot reach server. Check your Wi-Fi and try again."` There is no automatic retry, no exponential backoff, and no user-facing "Waking up server..." status banner.

#### (9) The test count per suite versus the document's 67 tests in 6 suites
- **Document Claim**: 67 tests across 6 Jest suites.
- **Actual Codebase on `features-batch-1`**: **53 tests across 4 suites**:
  1. `notifications.test.js`: 10 tests
  2. `vouchers.test.js`: 17 tests
  3. `reviews.test.js`: 13 tests
  4. `loyalty.test.js`: 13 tests
- **Discrepancy**: The document describes the state after Batch 2 (where `analytics.test.js` [8 tests] and `noHardcodedVouchers.test.js` [6 tests] were added, totalling 67 tests).

---

### Statements in the Document That Are Wrong, Unproven or Risky

| Document Statement | Reality in Codebase | Risk Level | File Reference |
|---|---|:---:|---|
| "5-Minute Cancellation Window" | Code enforces a **10-minute** window | Medium | `server/config/constants.js:12`, `src/screens/OrderTracking/trackingStyles.js:4` |
| "6-second live polling interval" | Order polling is **10 seconds**; notification polling is **20 seconds** in Batch 1 | Low | `src/screens/OrderTracking/OrderTrackingScreen.js:123`, `src/hooks/useNotifications.js:89` |
| "Push Notification Gateway" | **No push tokens, no Expo Push SDK, no native push**. In-app database notifications only | High | `server/models/User.js`, `package.json` |
| "Deals For You Ticker: live vouchers fetched from MongoDB" | Deals row renders static array `DEALS_FOR_YOU` | Medium | `src/screens/Menu/menuStyles.js:30-51` |
| "67/67 tests passing across 6 Jest suites" | Only **53 tests across 4 suites** exist on Batch 1 | Medium | `server/tests/` |
| "Business Analytics: Revenue, AOV, Hourly Rush Bar Chart" | Analytics endpoints and screens do not exist on Batch 1 | Medium | `server/routes/`, `server/controllers/` |
| "Cloud storage for uploaded images" | Uploaded photos are stored on **local ephemeral container disk** (`server/uploads/`) and deleted on restart | High | `server/controllers/uploadController.js:29` |
| "Plain English copy across entire app" | Obscure terms like "Patron" and "Culinary Tray" remain throughout Batch 1 | Low | `src/`, `server/` |

---

### Prioritised Top 10 Bugs or Gaps a Customer Could Meet

1. **Phone OTP Registration Crashes on Validation**
   - **File**: `server/controllers/authController.js:510` & `server/models/User.js:17`
   - **Impact**: Any user registering via SMS OTP is assigned email `${phone}@customer.aura.pk`, which fails Mongoose regex validation `/^[a-zA-Z0-9_.+-]+@gmail\.com$/` with a 500 crash.
2. **Permanent Loyalty Points Loss on Order Cancellation**
   - **File**: `server/controllers/orderController.js:293-305, 316-325`
   - **Impact**: If a customer cancels an order or a manager cancels it, the redeemed points are never credited back.
3. **Uploaded Dish Images Vanish on Render Free Tier Spin-Down**
   - **File**: `server/controllers/uploadController.js:29-45`
   - **Impact**: Dish photos uploaded by managers are stored in `server/uploads/` on ephemeral disks; redeployments or container sleep wipe all images, rendering broken images to customers.
4. **Menu Screen Deals Ticker Shows Hardcoded/Stale Codes**
   - **File**: `src/screens/Menu/menuStyles.js:30-51`
   - **Impact**: Customers see `CHEF15`, `FEAST20`, and `GOURMET30` which may not match database voucher definitions or availability.
5. **Cold-Start Request Abort Without Auto-Retry**
   - **File**: `src/api/client.js:60-63, 98-101`
   - **Impact**: When Render backend sleeps, requests exceeding 45s fail with a generic Wi-Fi warning rather than an automatic retry or informative loading banner.
6. **Customer Self-Cancellation Dispatches No Notification**
   - **File**: `server/controllers/orderController.js:293-305`
   - **Impact**: Customer cancellation omits `notifyOrderStatus(order)`, leaving the in-app notification feed without a cancellation confirmation entry.
7. **Discrepancy Between Claimed and Actual Cancel Window**
   - **File**: `src/screens/OrderTracking/OrderTrackingScreen.js:141`
   - **Impact**: UI and documentation advertise a 5-minute cancellation limit while the app allows cancellation for 10 minutes.
8. **Auth Token Stored in Unencrypted Plain AsyncStorage**
   - **File**: `src/utils/safeStorage.js:17` & `src/context/AuthContext.js:73`
   - **Impact**: JWT auth tokens are accessible in plain text on rooted or compromised mobile devices without hardware-backed keystore protection.
9. **Hardcoded Default Rating on Menu Item Creation**
   - **File**: `src/context/MenuContext.js:152`
   - **Impact**: When managers add a new dish, it is created with hardcoded `rating: 4.9` instead of starting at 0 unrated.
10. **Staff Account Creation Vulnerability to Invalid Domains**
    - **File**: `server/controllers/authController.js:316`
    - **Impact**: Entering a non-Gmail address for staff bypasses controller validation and causes an unhandled 500 error from Mongoose instead of a clean 400 response.
