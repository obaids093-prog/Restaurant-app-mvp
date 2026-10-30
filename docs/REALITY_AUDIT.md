# AURA System Reality Audit & Technical Truth Report
**Date:** 2026-10-30  
**Scope:** Honest architectural evaluation of the 10 commercial roadmap features implemented in AURA.  
**Classification Standards:**
- **REAL**: Operates with authentic live backends, real services, and true state transitions.
- **SIMULATED**: Functional software logic and interactive UI, but runs on synthetic/mock data without moving money or tracking physical devices.
- **UNSAFE**: Has vulnerabilities, authentication bypasses, security gaps, or unencrypted sensitive data transmission.

---

## 1. Feature-by-Feature Detailed Reality Audit

### Feature 1: Online Payment Gateways & Digital Wallets
- **Classification:** **SIMULATED & UNSAFE**
- **Evidence:** `server/controllers/paymentController.js` (lines 140–196), `src/components/PaymentSheet/OtpVerificationModal.js`
- **Does real money move?** **No.** Zero financial transactions occur; no bank, JazzCash, EasyPaisa, or Visa gateway API is contacted.
- **Card Data Exposure & Storage:**
  - `cardNumber`, `cardExpiry`, and `cardCvv` are transmitted in plaintext JSON from client to server over HTTP (`req.body`).
  - The server extracts `maskedAccount = •••• •••• •••• ${cleanCard.slice(-4)}` and does **not** persist full PAN or CVV to MongoDB.
  - However, handling raw card PAN and CVV directly in application servers without PCI-DSS tokenization (e.g. Stripe Elements / Payment SDK) is inherently unsafe.
- **OTP Authenticity:** The OTP verification is **fake**. `paymentController.js` hardcodes `otpCode = '123456'`, and the client modal displays this demo code directly to the user.
- **Environment & Demo Labelling:** The modal displays "Simulated 3D Secure", but the endpoint is **not** disabled in `NODE_ENV === 'production'`. A user in production can place confirmed "Paid" orders without spending real money.
- **What a Customer Sees:** An interactive payment sheet, branded JazzCash/EasyPaisa/Card inputs, a 3D Secure modal with demo code `123456`, and an instant "✓ Paid" order confirmation with an official receipt ID.

---

### Feature 2: 1-Tap Social Sign-In (Google & Apple)
- **Classification:** **UNSAFE (CRITICAL AUTHENTICATION BYPASS)**
- **Evidence:** `server/controllers/authController.js` (lines 612–680), `server/routes/authRoutes.js` (line 28), `src/screens/Login/SocialLoginButtons.js`
- **Token Verification:** The server **never verifies** Google or Apple ID tokens. There is zero cryptographic signature verification, audience validation, or expiry check against Google or Apple public JWKS keys.
- **Authentication Bypass / Account Takeover:** Any actor can send a raw HTTP request:
  ```bash
  POST /api/auth/social-login
  Content-Type: application/json
  { "provider": "google", "email": "manager@gmail.com" }
  ```
  The server will find the user with `manager@gmail.com`, immediately generate a signed JWT token, and grant full administrative manager dashboard access without requiring a password or Google OAuth handshake.
- **Required Provider Keys (Names Only):** `GOOGLE_CLIENT_ID`, `APPLE_SERVICE_ID`, `APPLE_TEAM_ID`, and `APPLE_KEY_ID`.
- **What a Customer Sees:** "Continue with Google" and "Continue with Apple" buttons that prompt a simulated 1-tap confirmation modal and log them into the app immediately.

---

### Feature 3: Live GPS Rider Tracking on Map
- **Classification:** **SIMULATED**
- **Evidence:** `server/services/riderTrackingService.js` (lines 46–115), `src/screens/OrderTracking/RiderTrackingMap.js`
- **Data Source:** **100% Generated / Mathematical Simulation.** There is no driver mobile app, no delivery courier, and no live GPS satellite hardware.
- **Courier Telemetry Engine:** `generateWaypoints()` calculates 7 sequential geographic waypoints along a Bezier curve between branch coordinates (Lahore Gulberg or Islamabad Blue Area) and default city coordinates (DHA Lahore / F-7 Islamabad). The courier's live location is interpolated based on elapsed minutes since order creation.
- **What a Customer Sees:** An animated radar map displaying a moving motorcycle icon, pulsating restaurant and home beacons, dynamic speed (km/h), and an ETA countdown that updates every 4 seconds.

---

### Feature 4: Table QR-Code Dine-In Ordering
- **Classification:** **SIMULATED & UNSAFE (FORGERY RISK)**
- **Evidence:** `server/controllers/tableController.js` (lines 20–60), `src/screens/TableQRScanner/TableQRScannerScreen.js`
- **Cryptographic Signing (HMAC):** **None.** The table QR payload is completely unsigned. It contains no HMAC signature, no secret key, and no expiration timestamp.
- **Link Forgery:** Anyone can manually craft an `aura://table?branch=lhr_gulberg&table=42` URL or invoke `POST /api/tables/verify-qr` with arbitrary numbers. The server blindly accepts the table number and locks the diner's session to that table.
- **What a Customer Sees:** A camera scanner with an animated laser viewfinder, acrylic table standee cards ("Table 1", "Table 4"), and a prompt that locks the selected table to their dine-in order.

---

### Feature 5: Native Remote Push Notifications
- **Classification:** **SIMULATED (INFRASTRUCTURE READY, REQUIRES CREDENTIALS)**
- **Evidence:** `server/services/pushNotificationService.js`, `src/services/pushNotificationService.js`, `eas.json`, `app.json`
- **Token Persistence:** Push tokens are safely stored in `User.pushTokens` array in MongoDB.
- **Have real pushes been sent?** **No.** During development and automated tests, dispatches are mocked or no registered physical device tokens are present.
- **What is needed on a real phone?**
  1. A standalone production APK or iOS build created via EAS (`eas build`).
  2. Apple Push Notification Service (APNs) Auth Key (`.p8`) uploaded to Expo EAS credentials.
  3. Google Cloud `google-services.json` and Firebase Cloud Messaging (FCM) credentials configured.
  4. Physical device permission grant from the user.
- **What a Customer Sees:** An animated in-app toast banner (`NotificationBannerToast.js`) appearing on foreground events; closed-app background pushes do not trigger without EAS cloud credentials.

---

### Feature 6: WhatsApp & SMS Digital Receipts
- **Classification:** **REAL (WHATSAPP DEEP LINK) & SIMULATED (SMS)**
- **Evidence:** `server/services/receiptService.js`, `src/components/DigitalReceipt/DigitalReceiptModal.js`
- **Is SMS Real?** **No.** The app triggers `Linking.openURL('sms:?body=...')` which pre-populates the user's phone messaging app. The server does not send automated cellular SMS via Twilio or telco gateways.
- **WhatsApp Integration:** **Real deep link.** Formats the receipt into a markdown string and launches WhatsApp via `https://wa.me/?text=...`.
- **Personal Data Exposure:** The receipt payload includes customer full name, table number, order breakdown, and payment reference (`JC_...` / `CARD_...`). It does **not** expose passwords or full payment card numbers.
- **What a Customer Sees:** A digital receipt sheet with a restaurant crest, course breakdown, tax folio, and buttons to share via WhatsApp or copy to clipboard.

---

### Feature 7: Ingredient-Level Inventory & Auto-Stock Depletion
- **Classification:** **REAL LOGIC, UNSAFE CONCURRENCY & CANCELLATION DEFECT**
- **Evidence:** `server/services/inventoryService.js` (lines 16–70), `server/controllers/orderController.js` (lines 310–360), `server/tests/inventory.test.js`
- **Concurrency & Atomicity:** **Not atomic.** Depletion relies on `findById()` followed by JavaScript arithmetic and `dish.save()`. Under high-concurrency order rushes, simultaneous requests cause read-modify-write race conditions where decrements overwrite each other.
- **Cancellation Restitution:** **Defect.** When an order is cancelled by customer or manager, **stock is never restored**. Cancelled orders permanently deplete kitchen inventory.
- **Can stock go negative?** Dish `stockCount` is bounded by `Math.max(0, ...)`, but raw `Ingredient.stock` uses `$inc: { stock: -reqQty }` without lower bounds; ingredients **can become negative**.
- **Automated Tests:** `inventory.test.js` has only 2 basic unit tests. Concurrency, rollback on cancellation, and zero-floor limits are **not tested**.
- **What a Customer Sees:** Dish stock counters decremented in real time; dishes reaching 0 stock display an "Auto Sold-Out" badge and cannot be added to the cart.

---

### Feature 8: Digital Kitchen Display System (KDS) Tablet Screen
- **Classification:** **REAL**
- **Evidence:** `src/screens/KitchenDisplay/KitchenDisplayScreen.js`, `src/screens/KitchenDisplay/kdsStyles.js`
- **Functionality:** Operates with live MongoDB order records and real-time Socket.io events. Tapping "Bump" advances tickets (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Served`) across database and UI.
- **What a Customer/Staff Sees:** A tablet bump rail with live clock, color-coded aging timers (green < 10m, amber 10-20m, red > 20m), and station filtering.

---

### Feature 9: Real-Time WebSockets (Socket.io)
- **Classification:** **REAL & PARTIALLY UNSAFE (AUTHORIZATION GAP)**
- **Evidence:** `server/services/socketService.js`, `src/context/SocketContext.js`, `src/components/LiveSocketBadge.js`
- **Functionality:** Real WebSocket server attached to HTTP server. Broadcasts order updates, new orders, and notifications with sub-200ms latency.
- **Security Gap:** The socket middleware allows unauthenticated connections, and the `join:role` socket handler allows any client to emit `socket.emit('join:role', 'manager')` to listen to all manager broadcasts and kitchen orders without verifying manager credentials.
- **What a Customer Sees:** Live status transitions on tracking screens without pull-to-refresh; green pulsing "LIVE" indicator on kitchen/manager screens.

---

### Feature 10: Cloud Object Storage for Uploads
- **Classification:** **REAL (WITH LOCAL FALLBACK)**
- **Evidence:** `server/services/cloudStorageService.js`, `server/routes/uploadRoutes.js`
- **Functionality:** Direct integration with Cloudinary API for image uploads and WebP transformations. If API keys are missing, gracefully falls back to local disk storage (`server/uploads/`).
- **What a Customer Sees:** Permanent dish images served via Cloudinary CDN or local backend server.

---

## 2. Test Suite Reality & Missing Suites (Question 8)

### Test Count Discrepancy Explained
- The previous message reported **61 passed tests across 6 suites**.
- **Reason:** The command executed targeted only 6 specific suites:
  `npm test -- tests/socket.test.js tests/inventory.test.js tests/payments.test.js tests/receipt.test.js tests/tableQR.test.js tests/riderTracking.test.js`
- **No suites were deleted.** The repository contains **16 distinct test suites**:

| Suite | Status | Test Count | Description |
|---|---|---|---|
| `payments.test.js` | Included in 61 | 21 | Payment validation, OTP, tokenization |
| `riderTracking.test.js` | Included in 61 | 14 | GPS telemetry, waypoints, ETA calculation |
| `tableQR.test.js` | Included in 61 | 12 | Table QR parsing, standee cards |
| `socket.test.js` | Included in 61 | 8 | WebSocket rooms, emit helpers |
| `receipt.test.js` | Included in 61 | 4 | WhatsApp & SMS formatting |
| `inventory.test.js` | Included in 61 | 2 | Depletion safety checks |
| `auth.test.js` | In repo | 11 | Phone OTP, Gmail rule, social login |
| `notifications.test.js` | In repo | 16 | Push token registration, unread counts |
| `reviews.test.js` | In repo | 13 | Dish reviews, sentiment, ratings |
| `vouchers.test.js` | In repo | 18 | Promo codes, minimum spend, expiry |
| `loyalty.test.js` | In repo | 14 | Points accumulation, tier upgrades |
| `analytics.test.js` | In repo | 10 | Manager metrics, revenue, rush hours |
| `cloudStorage.test.js` | In repo | 6 | Cloudinary upload and local fallback |
| `secureTokenStorage.test.js`| In repo | 3 | SecureStore configuration |
| `clientColdStart.test.js` | In repo | 4 | Server waking banner logic |
| `noHardcodedVouchers.test.js`| In repo | 2 | Schema hygiene checks |
| **Total** | | **158 Tests** | **Full comprehensive test suite** |

---

## 3. Free-Only Rule Compliance (Question 9)

| Service / Dependency | Required Account / Key | Behavior When Absent | Does App Run? |
|---|---|---|---|
| **MongoDB Atlas** | `MONGO_URI` | Server refuses to start (mandatory database) | No |
| **JWT Authentication** | `JWT_SECRET` | Uses fallback development secret | Yes |
| **Cloudinary** | `CLOUDINARY_URL` | Falls back to local disk storage (`server/uploads/`) | **Yes (100% Free)** |
| **Google Maps API** | None (Custom Canvas) | Uses built-in trigonometric Bezier engine | **Yes (100% Free)** |
| **Twilio / SMS Gateway** | None (Native Linking) | Opens device SMS app (`sms:?body=...`) | **Yes (100% Free)** |
| **Google OAuth API** | None configured | Allows mock/direct social login | **Yes (100% Free)** |
| **Apple APNs / FCM Push** | EAS Cloud Credentials | In-app toasts work; background push silent | **Yes (100% Free)** |

---

## 4. Top 10 Security & Reality Risks (Question 10)
*Ranked from most dangerous to least dangerous:*

1. **Full Account Takeover via Unverified Social Login** (`server/controllers/authController.js#L616`)  
   *Risk:* Anyone can post `{ email: "manager@gmail.com" }` to `/api/auth/social-login` and receive a valid JWT token granting instant manager access without verifying signatures or passwords.
2. **Plaintext Credit Card Data Transmission** (`src/screens/OrderSummaryScreen.js`, `server/controllers/paymentController.js#L140`)  
   *Risk:* Full 16-digit card numbers, MM/YY expiry dates, and CVVs are transmitted in plain HTTP requests from the mobile app to Express backend without client-side tokenization.
3. **Hardcoded Payment OTP & Financial Fraud** (`server/controllers/paymentController.js#L180`)  
   *Risk:* OTP is fixed to `123456` and not disabled in production. Anyone can create fraudulent "Paid" orders without spending actual funds.
4. **Unsigned Table QR Code Injection & Spoofing** (`server/controllers/tableController.js#L20`)  
   *Risk:* Table deep links lack HMAC signatures, allowing malicious actors to submit orders to tables occupied by other patrons.
5. **Inventory Concurrency Race Condition** (`server/services/inventoryService.js#L28`)  
   *Risk:* Non-atomic read-modify-write cycles lead to inaccurate inventory counts during simultaneous orders.
6. **No Stock Restitution on Order Cancellation** (`server/controllers/orderController.js#L320`)  
   *Risk:* Cancelled orders permanently consume ingredient portions, causing false "Sold Out" states.
7. **Negative Raw Ingredient Stock Values** (`server/services/inventoryService.js#L51`)  
   *Risk:* Raw ingredient inventory drops below zero without floor checks or restocking alerts.
8. **Unauthorized Socket.io Role Joining** (`server/services/socketService.js#L79`)  
   *Risk:* Any client can emit `join:role('manager')` and intercept kitchen order broadcasts without manager role validation.
9. **Simulated Courier GPS Misrepresentation** (`server/services/riderTrackingService.js#L49`)  
   *Risk:* Customers see a synthetic motorcycle moving across Lahore/Islamabad even if no driver exists.
10. **Silent Remote Push Failure on Backgrounded Apps** (`server/services/pushNotificationService.js`)  
    *Risk:* Background push alerts do not reach real physical devices until Apple APNs and Google FCM certificates are provisioned in EAS.

---

## 5. Summary Classification Matrix

| Feature | Audit Classification | Real Customer Experience | Primary Technical Risk |
|---|---|---|---|
| **Payments** | **SIMULATED & UNSAFE** | Interactive payment sheet, demo OTP `123456`, instant confirmation | Raw CVV transmission; zero money moved |
| **Social Login** | **UNSAFE** | 1-tap modal with instant sign-in | Account takeover via unverified email parameter |
| **Rider Tracking** | **SIMULATED** | Animated radar map with moving bike in Lahore/Islamabad | Simulated data; no physical driver |
| **Table QR** | **SIMULATED & UNSAFE** | Scanner viewfinder and acrylic standee selector | Unsigned URL; table number spoofing |
| **Push Notifications** | **SIMULATED (INFRA READY)** | In-app notification toast | No remote delivery without EAS credentials |
| **WhatsApp Receipts** | **REAL** | Generates prefilled WhatsApp message with order folio | Exposes customer name & payment ref in text |
| **Inventory Depletion** | **REAL LOGIC (UNSAFE)** | Dishes auto-mark "Sold Out" at 0 stock | Race conditions; cancellations never restore stock |
| **Kitchen Display (KDS)** | **REAL** | Tablet screen with aging timers & status bump bar | None |
| **WebSockets (Socket.io)** | **REAL (AUTH GAP)** | Sub-200ms order updates & live status badge | Sockets permit unauthorized `role:manager` room join |
| **Cloud Storage** | **REAL** | Persistent dish images via Cloudinary | None |

---

## 6. Pre-Production Remediation Recommendations

Before deploying this application to any real-world users:
1. **Disable `/api/auth/social-login`** or implement Google `google-auth-library` and Apple JWKS token signature verification.
2. **Remove direct card PAN/CVV input** from `PaymentDetailsForm.js`. Replace with an authorized PCI-compliant SDK (Stripe, JazzCash Mobile SDK, or PayFast).
3. **Guard Simulated Payments**: Wrap simulated payment endpoints with `if (process.env.NODE_ENV === 'production') return res.status(403).json(...)` and add a prominent "DEMO ONLY" banner in the app.
4. **Sign Table QR Codes**: Append an HMAC-SHA256 signature and 1-hour expiry timestamp to table QR codes.
5. **Atomic Inventory**: Refactor dish depletion to `findOneAndUpdate({ _id, stockCount: { $gte: qty } }, { $inc: { stockCount: -qty } })` and implement inventory return in `cancelOrder()`.
6. **Protect Socket Rooms**: Validate `socket._userRole === 'manager'` before granting `socket.join('role:manager')`.
