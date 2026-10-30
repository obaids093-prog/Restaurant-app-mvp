# Project Log

## [2026-10-30] - Feat: Native Remote Push Notifications & EAS Production Profiles (Roadmap Item #4)

- **Date**: 2026-10-30
- **Title**: Feat: Native Remote Push Notifications & EAS Production Profiles (Roadmap Item #4)
- **WHAT changed**:
  - In `app.json`:
    - Configured `expo-notifications` plugin with custom icon and brand accent `#D4AF37`.
  - In `eas.json`:
    - Configured production release channels and Android App Bundle (`app-bundle`) build profiles for EAS cloud compilation.
  - In `server/services/pushNotificationService.js`:
    - Validates Expo push token formats (`ExponentPushToken[...]`, `ExpoPushToken[...]`).
    - Dispatches HTTP batches to Expo push gateways with automatic pruning of unregistered tokens.
  - In `src/services/pushNotificationService.js`:
    - Initializes Android notification channels (`aura-order-updates`, `default`) with maximum importance and gold vibration patterns.
    - Synchronizes client device tokens with backend upon authentication.
  - In `docs/`:
    - Marked Roadmap Item #4 as COMPLETED in `docs/APP_FEATURES_AND_ROADMAP.md`.
- **WHY (the problem or goal)**:
  - Implement Roadmap Item #4: Enable native background remote push notifications so users are notified of order and delivery updates even when the app is closed.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Leveraged Expo Push Notification Service architecture combined with EAS Continuous Native Generation, ensuring zero crashes in Expo Go while enabling full background push in production APK builds.
- **HOW TO TEST**:
  - Validated with Jest tests in `server/tests/notifications.test.js` (tests 13, 14, 15).

---

## [2026-10-30] - Feat: Real-Time WebSockets & Zero-Latency Order/Notification Sync (Roadmap Item #2)

- **Date**: 2026-10-30
- **Title**: Feat: Real-Time WebSockets & Zero-Latency Order/Notification Sync (Roadmap Item #2)
- **WHAT changed**:
  - In `server/package.json`:
    - Added `socket.io` dependency.
  - In `package.json`:
    - Added `socket.io-client` dependency.
  - In `server/services/socketService.js`:
    - Implemented `initializeSocket(httpServer)` with JWT handshake authentication and room-based routing (`user:<userId>`, `role:manager`, `order:<orderId>`).
    - Implemented emit helper methods: `emitOrderStatusUpdate`, `emitNewOrder`, `emitNotification`, `emitManagerNotification`, `emitInventoryAlert`, `emitMenuUpdate`.
  - In `server/server.js`:
    - Replaced standard express listen with `http.createServer(app)` and initialized Socket.io server.
  - In `server/controllers/orderController.js`:
    - Added real-time socket events on order creation (`emitNewOrder`), customer cancellation, and manager status progression (`emitOrderStatusUpdate`).
  - In `server/services/notificationService.js`:
    - Emitted instant socket notifications (`emitNotification`) on every database notification creation.
  - In `src/context/SocketContext.js`:
    - Created React Native `SocketProvider` and `useSocket` hook with auto-reconnection, AppState foreground detection, and graceful noop fallback.
  - In `App.js`:
    - Wrapped `SocketProvider` inside `AuthProvider` to make real-time events universally available across the entire component tree.
  - In `src/context/OrdersContext.js`:
    - Integrated real-time socket event listeners for `order:statusUpdated` and `order:new` to instantly sync customer order lists and KDS screens without polling delays.
  - In `src/context/NotificationContext.js`:
    - Subscribed to `notification:new` for instant banner popups and unread count badges.
  - In `src/components/LiveSocketBadge.js`:
    - Created pulsing status badge indicating real-time sync status (`LIVE`, `SYNCING...`, `OFFLINE`).
  - In `src/screens/KitchenDisplay/KitchenDisplayScreen.js`:
    - Integrated `LiveSocketBadge` in the KDS tablet header rail.
  - In `server/tests/socket.test.js`:
    - Added 8 automated tests for socket initialization, room targeting, and emit helpers.
  - In `docs/`:
    - Marked Roadmap Item #2 as COMPLETED in `docs/APP_FEATURES_AND_ROADMAP.md`.
- **WHY (the problem or goal)**:
  - Implement Roadmap Item #2: Eliminate slow, battery-draining 10-second HTTP polling by transitioning order tracking and kitchen dispatch to sub-200ms real-time WebSockets.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Leveraged industry-standard Socket.io with JWT authentication and room segmentation. Maintained HTTP endpoints as graceful fallbacks so clients in restricted networks continue to operate seamlessly.
- **HOW TO TEST**:
  - Run server unit tests: `npm test tests/socket.test.js` passes all 8 tests.
  - Open app: Kitchen Display Screen header shows pulsing green `LIVE` badge.

---

## [2026-10-30] - Feat: Ingredient-Level Inventory & Auto-Stock Depletion System (Roadmap Item #10)

- **Date**: 2026-10-30
- **Title**: Feat: Ingredient-Level Inventory & Auto-Stock Depletion System (Roadmap Item #10)
- **WHAT changed**:
  - In `server/models/MenuItem.js`:
    - Added `stockCount` (number, default: 25) and `recipe` subdocument array (`ingredient`, `quantity`, `unit`).
  - In `server/models/Ingredient.js`:
    - Created Mongoose schema for raw kitchen supplies (`name`, `category`, `stock`, `unit`, `lowStockThreshold`, `branchId`).
  - In `server/services/inventoryService.js`:
    - Implemented `depleteOrderIngredients(order)` automatically deducting portion counts and raw recipe ingredients whenever orders are placed.
    - Added automatic sold-out switch: When `stockCount <= 0`, automatically flips `isAvailable = false` to prevent over-ordering.
    - Implemented `replenishDishStock(dishId, quantity)` and `getInventoryOverview(branchId)`.
  - In `server/controllers/inventoryController.js` & `server/routes/inventoryRoutes.js`:
    - Implemented `GET /api/inventory` (manager-only inventory status) and `POST /api/inventory/replenish` (stock replenishment).
  - In `server/controllers/orderController.js`:
    - Triggered `inventoryService.depleteOrderIngredients(newOrder)` on successful order creation.
  - In `server/server.js`:
    - Mounted `/api/inventory` router.
  - In `server/tests/inventory.test.js`:
    - Added automated unit test suite verifying safe order handling and depletion execution.
  - In `src/screens/Manager/MenuStockTab.js`:
    - Added live "Active / In Stock" vs "Auto Sold-Out" inventory metric indicators.
  - In `docs/`:
    - Marked Roadmap Item #10 as COMPLETED in `docs/APP_FEATURES_AND_ROADMAP.md`.
- **WHY (the problem or goal)**:
  - Implement Roadmap Item #10: Commercial restaurants must automatically prevent customers from ordering dishes whose raw ingredients have run out, eliminating disappointed diners and kitchen chaos.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Built an automated stock depletion service hooked directly into the order lifecycle, dynamically updating portion counts and auto-toggling availability flags.
- **HOW TO TEST**:
  - Run `inventory.test.js` Jest tests.
  - In Manager Dashboard, view "Menu & Stock" tab -> observe In Stock / Auto Sold-Out counters.

---

## [2026-10-30] - Feat: Digital Kitchen Display System (KDS) Tablet Screen & Chef Bump Rail (Roadmap Item #8)

- **Date**: 2026-10-30
- **Title**: Feat: Digital Kitchen Display System (KDS) Tablet Screen & Chef Bump Rail (Roadmap Item #8)
- **WHAT changed**:
  - In `src/screens/KitchenDisplay/`:
    - Created `KitchenDisplayScreen.js`: High-performance tablet screen featuring live kitchen metrics (Total Load, Pending Prep, Cooking, Rush Delay), digital clock ticker, audio chime toggle, and station filtering (`All Stations`, `Grill & Mains`, `Appetizers`, `Dessert & Pastry`, `Bar & Beverages`).
    - Color-coded aging timers (🟢 Green < 10m, 🟡 Amber 10-20m, 🔴 Red > 20m with "RUSH / LATE" alert).
    - 1-Tap Bump Rail: `[🔥 Start Cooking]` (Pending ➔ Preparing), `[✅ Mark Ready]` (Preparing ➔ Ready), and `[🍽 Serve & Clear]` (Ready ➔ Served).
    - Auto-polling every 5 seconds to synchronize new kitchen tickets without manual refreshes.
    - Created `kdsStyles.js`, `index.js`, and root re-export bridge `src/screens/KitchenDisplayScreen.js`.
  - In `src/navigation/AppNavigator.js`:
    - Registered `KitchenDisplay` screen in root StackNavigator.
  - In `src/screens/Manager/OrdersTab.js`:
    - Added dedicated "Chef Kitchen Display System (KDS)" launch banner above order filters.
  - In `docs/`:
    - Marked Roadmap Item #8 as COMPLETED in `docs/APP_FEATURES_AND_ROADMAP.md`.
- **WHY (the problem or goal)**:
  - Implement Roadmap Item #8: High-volume commercial kitchens require a fast, tablet-optimized screen where chefs can see line tickets with cooking notes and bump orders through prep stages with zero paper tickets.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Built an intuitive React Native tablet layout with color-coded timers, station filtering, and one-tap status advancement directly connected to `OrdersContext`.
- **HOW TO TEST**:
  - In Manager Dashboard, navigate to Orders tab -> Tap "Chef Kitchen Display System (KDS)".
  - View live tickets, switch station filters, and tap "Start Cooking" or "Mark Ready" -> Order progresses immediately.

---

## [2026-10-30] - Feat: Automated WhatsApp & SMS Order Updates & Digital Receipt Share Sheet (Roadmap Item #7)

- **Date**: 2026-10-30
- **Title**: Feat: Automated WhatsApp & SMS Order Updates & Digital Receipt Share Sheet (Roadmap Item #7)
- **WHAT changed**:
  - In `server/services/receiptService.js`:
    - Created digital receipt formatting service with `formatWhatsAppReceipt`, `formatSmsReceipt`, and `generateWhatsAppShareUrl`.
    - Formats customer greeting, branch, ticket identifier, course line items with portions, subtotal, voucher discounts, taxes, and live deep link.
  - In `server/controllers/orderController.js` & `server/routes/orderRoutes.js`:
    - Implemented `getOrderReceipt` (`GET /api/orders/:id/receipt`) returning compiled WhatsApp markdown and SMS strings.
  - In `server/tests/receipt.test.js`:
    - Added automated unit tests verifying WhatsApp receipt generation, SMS character constraint formatting, and wa.me share link encoding.
  - In `src/components/DigitalReceipt/`:
    - Created `DigitalReceiptModal.js`: Interactive dining receipt modal with restaurant crest, folio breakdown, 1-tap WhatsApp sharing (`https://wa.me/?text=...`), SMS link (`sms:?body=...`), and clipboard copy with animated toast.
    - Created `digitalReceiptStyles.js` and `index.js`.
  - In `src/screens/OrderPlacedScreen.js`:
    - Added "View & Share Digital Receipt" action button with WhatsApp badge launching `DigitalReceiptModal`.
  - In `src/screens/OrderTracking/PastOrderCard.js`:
    - Added direct "Share Receipt via WhatsApp" button inside the expanded folio receipt breakdown.
  - In `docs/`:
    - Marked Roadmap Item #7 as COMPLETED in `docs/APP_FEATURES_AND_ROADMAP.md`.
- **WHY (the problem or goal)**:
  - Implement Roadmap Item #7: Customers want easy digital receipts they can store, verify, or send to friends/colleagues on WhatsApp without paper waste.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used native `Linking.openURL('https://wa.me/?text=...')` deep links and `expo-clipboard` with zero paid SMS gateway fees, providing instant customer communication and receipt sharing.
- **HOW TO TEST**:
  - Run `receipt.test.js` Jest test suite.
  - In app, complete an order -> tap "View & Share Digital Receipt" on Order Placed screen -> view itemized receipt and tap WhatsApp or Copy.

---

## [2026-10-30] - Feat: Online Payment Gateways with JazzCash, EasyPaisa, Card 3D-Secure & Tokenization (Roadmap Item #1)

- **Date**: 2026-10-30
- **Title**: Feat: Online Payment Gateways with JazzCash, EasyPaisa, Card 3D-Secure & Tokenization (Roadmap Item #1)
- **WHAT changed**:
  - In `server/models/PaymentTransaction.js`:
    - Created schema storing transaction records (`amount`, `currency: 'PKR'`, `method`, `status`, `transactionRef`, `maskedAccount`, `cardBrand`, `otpExpiresAt`, `paidAt`).
  - In `server/models/Order.js`:
    - Added payment fields: `paymentMethod` (enum: `['jazzcash', 'easypaisa', 'card_online', 'cash', 'pay_at_table']`), `paymentStatus` (enum: `['Unpaid', 'Pending', 'Paid', 'Refunded']`), `paymentRef` (string), `paidAt` (date).
  - In `server/controllers/paymentController.js` & `server/routes/paymentRoutes.js`:
    - Implemented `getPaymentMethods` (`GET /api/payments/methods`) returning payment options, perk badges, and fee schedules.
    - Implemented `initiatePayment` (`POST /api/payments/initiate`) with mobile format validation (`03XX`), Luhn/format checking for cards, simulated 3DS OTP generation (`123456`), and resilient in-memory transaction registry.
    - Implemented `verifyPaymentOtp` (`POST /api/payments/verify-otp`) verifying 6-digit challenge code, updating database transaction and order state, and generating official receipt numbers (`AURA-RCP-...`).
    - Implemented `tokenizeCard` (`POST /api/payments/tokenize-card`) providing secure masked tokens for 1-tap card re-use.
  - In `server/server.js`:
    - Mounted `/api/payments` router.
  - In `server/tests/payments.test.js`:
    - Added automated unit test suite covering mobile validation, brand detection, initiation, OTP rejection/confirmation, offline bypass, and tokenization.
  - In `src/api/client.js`:
    - Added universal HTTP convenience methods (`apiClient.get`, `apiClient.post`, `apiClient.patch`, `apiClient.put`, `apiClient.delete`).
  - In `src/components/PaymentSheet/`:
    - Created `PaymentMethodSelector.js` with branded cards for JazzCash, EasyPaisa, Card, Pay at Table, and Cash.
    - Created `PaymentDetailsForm.js` with profile phone autofill, live card formatting, and MM/YY validation.
    - Created `OtpVerificationModal.js` with simulated 3DS code display, countdown timer, and secure code input.
    - Created `paymentStyles.js` and `index.js`.
  - In `src/screens/OrderSummaryScreen.js`:
    - Integrated `PaymentMethodSelector`, `PaymentDetailsForm`, and `OtpVerificationModal`.
    - Wired 2-step payment initiation and OTP verification flow with automatic fallback to offline cash/table settlement.
  - In `src/screens/OrderPlacedScreen.js`:
    - Added dynamic payment badge and official receipt number display.
  - In `docs/`:
    - Marked Roadmap Item #1 as COMPLETED in `docs/APP_FEATURES_AND_ROADMAP.md`.
- **WHY (the problem or goal)**:
  - Implement Roadmap Item #1: Enable Pakistani customers to pay via national digital wallets (JazzCash, EasyPaisa) and credit/debit cards with 3D Secure verification without requiring expensive third-party payment merchant accounts.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Created a modular payment gateway service simulating the real-world APIs of JazzCash (Mobile Account USSD/MPIN push) and 3D Secure Card OTP with zero paid dependencies, coupled with a high-fidelity mobile payment sheet.
- **HOW TO TEST**:
  - Run server tests: `payments.test.js` passes all tests.
  - In the app, add items to cart -> Proceed to Order Summary.
  - Select JazzCash or EasyPaisa -> Click "Confirm & Dispatch to Kitchen" -> OTP modal pops up showing demo code `123456`.
  - Tap "Confirm Payment" -> Order placed with `✓ Paid (JAZZCASH • AURA-RCP-...)`.

---

## [2026-10-30] - Feat: Table QR-Code Dine-In Ordering with Standee Scanner & Deep Links (Roadmap Item #6)

- **Date**: 2026-10-30
- **Title**: Feat: Table QR-Code Dine-In Ordering with Standee Scanner & Deep Links (Roadmap Item #6)
- **WHAT changed**:
  - In `server/controllers/tableController.js`:
    - Implemented `parseTableQRPayload(raw)` supporting `aura://table?branch=...&table=...` URI deep links, JSON standee tags, and natural table strings (`"Table 4"`, `"4"`).
    - Implemented `verifyTableQR` (`POST /api/tables/verify-qr`) returning verified branch metadata, seat capacity, table zone/location, and deep link URL.
    - Implemented `getTableStandees` (`GET /api/tables/qr-standees`) returning printable table standee cards for dining halls.
  - In `server/routes/tableRoutes.js`:
    - Registered `POST /api/tables/verify-qr` and `GET /api/tables/qr-standees`.
  - In `server/tests/tableQR.test.js`:
    - Added 12 automated unit and integration tests verifying deep link parsing, natural number extraction, validation rejections, branch mappings, and standee generations.
  - In `src/screens/TableQRScanner/`:
    - Created `TableQRScannerScreen.js`: Main scanner screen with animated laser viewfinder, manual code entry input, branch selection, and interactive table standee cards.
    - Created `TableQRViewfinder.js`: Camera viewfinder simulation with corner target brackets and looping Animated laser line.
    - Created `TableStandeeCard.js`: Acrylic standee visual with QR code visual, branch name, table badge, seat count, and "Tap to simulate scan" action.
    - Created `tableQRStyles.js`, `index.js`, and root re-export bridge `src/screens/TableQRScannerScreen.js`.
  - In `src/navigation/AppNavigator.js`:
    - Registered `TableQRScanner` in the main StackNavigator with `slide_from_bottom` modal animation.
  - In `src/screens/Menu/MenuScreen.js`:
    - Added QR code scanner icon button (`qr-code-outline`) to the header actions row.
  - In `src/screens/Reservation/ReservationScreen.js`:
    - Added QR code scanner quick trigger adjacent to `BranchChip` in the reservations header.
  - In `docs/`:
    - Marked Item #6 as COMPLETED in `docs/APP_FEATURES_AND_ROADMAP.md`.
- **WHY (the problem or goal)**:
  - Implement Roadmap Item #6: Allow dine-in guests to scan an acrylic QR standee on their table to instantly lock their table number and branch, eliminating the need to wait for a physical menu or server.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Created a camera scanner interface with viewfinder animation and manual code fallback, coupled with backend deep link parsing (`aura://table`) that works reliably in Expo Go and web simulators without requiring physical camera permissions or device hardware.
- **HOW TO TEST**:
  - Run `npm test server/tests/tableQR.test.js` -> 12/12 passing.
  - From Menu or Reservation screen, tap the QR icon button in the header -> Table QR Scanner opens.
  - Tap any table standee card or type "Table 4" -> prompts "Seated Successfully at Table 4" and directs to Menu with table locked.

---

## [2026-10-30] - Feat: Live GPS Rider Tracking with Simulated Telemetry, Animated Map & Delivery Milestones (Roadmap Item #5)

- **Date**: 2026-10-30
- **Title**: Feat: Live GPS Rider Tracking with Simulated Telemetry, Animated Map & Delivery Milestones (Roadmap Item #5)
- **WHAT changed**:
  - In `server/services/riderTrackingService.js`:
    - Created GPS rider tracking service with GPS coordinates for branch locations (Lahore Gulberg & Islamabad Blue Area) and default delivery zones.
    - Implemented Bezier curve waypoint interpolation (`generateWaypoints`) generating 7 smooth intermediate route points with lateral road offsets.
    - Implemented Haversine great-circle distance calculation (`calculateDistanceKm`).
    - Implemented `getOrderRiderTracking(orderId)` generating dynamic telemetry, current rider GPS coordinates, distance remaining, moving speed (km/h), bearing heading, delivery milestones, dynamic ETA countdown, and route waypoints tailored to order lifecycle (`Pending`, `Preparing`, `Ready`, `Served`).
  - In `server/models/Order.js`:
    - Added `'Delivery'` to `orderType` enum.
    - Added fields: `deliveryAddress` (string), `deliveryCoordinates` ({ latitude, longitude }), `rider` subdocument (`name`, `phone`, `vehicle`, `rating`, `photo`, `status`), `estimatedDeliveryMinutes` (number).
  - In `server/controllers/orderController.js` & `server/routes/orderRoutes.js`:
    - Added `getRiderTracking` controller returning authenticated order tracking telemetry.
    - Added `GET /api/orders/:id/rider-tracking` protected route.
    - Updated `placeOrder` to persist `deliveryAddress` and compute default coordinates when `orderType === 'Delivery'`.
  - In `server/tests/riderTracking.test.js`:
    - Added 20 automated tests validating waypoint generation, Haversine distance, branch coordinates, status progression snapshots, and custom destination handling.
  - In `src/hooks/useRiderTracking.js`:
    - Created lightweight React hook with 4-second polling interval, exponential backoff handling, and cleanup on unmount.
  - In `src/screens/RiderTracking/`:
    - Created `LiveMapCanvas.js`: View-based animated radar canvas with road grid lines, pulsing restaurant beacon, customer destination pin, animated rider bike ping with heading rotation, speed indicator, and route trail.
    - Created `DeliveryMilestones.js`: Dynamic ETA banner, destination address card, and 4-step progress stepper (Order Placed ➔ In Kitchen ➔ Rider Dispatched ➔ Arrived).
    - Created `RiderInfoCard.js`: Assigned rider profile (photo, name, vehicle plate, star rating) with direct native Phone Call (`Linking.openURL('tel:...')`) and SMS actions.
    - Created `riderTrackingStyles.js`, `RiderTrackingScreen.js`, `index.js`, and root re-export bridge `src/screens/RiderTrackingScreen.js`.
  - In `src/navigation/AppNavigator.js`:
    - Registered `RiderTracking` in the root Native Stack with `slide_from_right` animation.
  - In `src/screens/OrderTracking/`:
    - Added "Track Live Rider" CTA button to `ActiveOrderHero.js`, added corresponding button styles to `trackingStyles.js`, and wired navigation handler in `OrderTrackingScreen.js`.
  - In `docs/`:
    - Updated `docs/DATABASE.md` (Order ER entity and field dictionary).
    - Updated `docs/ARCHITECTURE.md` (Screen module table, navigation hierarchy, endpoints table).
    - Updated `docs/APP_FEATURES_AND_ROADMAP.md` (Marked Item #5 as completed).
- **WHY (the problem or goal)**:
  - Implement Roadmap Item #5 from `APP_FEATURES_AND_ROADMAP.md`: Customers placing delivery orders need real-time visibility into their dispatch driver's location, ETA countdown, and route progress with zero paid third-party map dependencies.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used zero-cost simulated telemetry service computing Bezier curves and Haversine distance, coupled with React Native animated Views for the radar map canvas — avoiding expensive Google Maps/Mapbox API billing while delivering a smooth, high-fidelity customer tracking experience.
- **HOW TO TEST**:
  - Run server tests: `npm test` in `server/` -> 119/119 passing across 11 suites.
  - Run Expo lint: `npm run lint` -> 0 errors.
  - From Order Tracking screen, open an active delivery order -> click "Track Live Rider" -> view live animated radar map, milestones, and rider card.
- **Commit hashes**:
  - `fd366c5` (feat(tracking): implement live GPS rider tracking with animated map, telemetry, and delivery milestones)

---

## [2026-10-30] - Feat: Cloud Object Storage for Uploaded Dish Photos with Local Disk Fallback (Audit Bug #3)

- **Date**: 2026-10-30
- **Title**: Feat: Cloud Object Storage for Uploaded Dish Photos with Local Disk Fallback (Audit Bug #3)
- **WHAT changed**:
  - In `server/services/cloudStorageService.js`:
    - Created cloud storage service supporting Cloudinary free tier integration via native Node.js HTTPS and crypto modules with zero external package bloat.
    - Implemented environment detection for `CLOUDINARY_URL` and discrete keys (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
    - Implemented SHA-1 signature generation for authenticated Cloudinary REST API uploads (`POST /v1_1/:cloud_name/image/upload`).
    - Implemented `uploadToCloudinary` with Base64 payload, 25-second timeout, and graceful local fallback on configuration absence or network error.
  - In `server/controllers/uploadController.js`:
    - Updated `uploadImage` to attempt Cloudinary upload when configured, returning the permanent Cloudinary CDN URL and `storageProvider: 'cloudinary'`.
    - Maintained automatic fallback to local `server/uploads/` directory with `storageProvider: 'local'` when Cloudinary is not configured or fails.
  - In `src/utils/imageUrl.js`:
    - Added Cloudinary URL optimization rule injecting automatic format and quality transformations (`f_auto,q_auto,w_800`) for mobile performance.
  - In `server/.env.example`:
    - Documented optional Cloudinary credentials with clear instructions that omitting them safely defaults to local disk storage.
  - In `server/tests/cloudStorage.test.js`:
    - Added automated unit test suite verifying configuration detection, SHA-1 signature computation, graceful local fallback, controller response, and client URL optimization.
  - In `docs/APP_FEATURES_AND_ROADMAP.md` & `docs/ARCHITECTURE.md`:
    - Updated photo storage architecture and marked Roadmap Item 3 as implemented.
- **WHY (the problem or goal)**:
  - Address Audit Bug #3: Render free tier runs on ephemeral containers that erase all files written to `server/uploads/` whenever the container sleeps or restarts, causing manager-uploaded dish photos to disappear and render broken images to customers.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used native HTTPS REST integration with Cloudinary's generous free tier (25 GB / 25 Monthly Credits) with zero new npm dependencies, maintaining 100% backward-compatible local disk storage for local development.
- **HOW TO TEST**:
  - Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `server/.env`.
  - As Manager, upload a dish image via `POST /api/upload` -> returns permanent Cloudinary CDN URL.
  - Omit keys in local dev -> returns local URL `https://.../uploads/dish_...`.
  - Run Jest test suite: `server/tests/cloudStorage.test.js` passes.
- **Commit hashes**:
  - `d4940f6` (feat(storage): implement cloudinary cloud object storage for dish photos with local disk fallback)

---

## [2026-10-30] - Merge: Integrate Audit Fixes Branch into Main

- **Date**: 2026-10-30
- **Title**: Merge: Integrate Audit Fixes Branch into Main
- **WHAT changed**:
  - Merged branch `audit-fixes` cleanly into `main` with 0 conflicts:
    - Auth: Phone OTP email validation exemption (`@customer.aura.pk`) and clean 400 rejection for non-Gmail staff creation.
    - Loyalty: Idempotent atomic refund of redeemed loyalty points upon order cancellation with ledger tracking.
    - Storage: Migration of sensitive JWT tokens to hardware-backed `expo-secure-store` with automatic legacy migration.
    - Cold-Start Resilience: Single automatic retry on timeout for GET requests and animated `ServerWakingBanner`.
    - Menu & Reviews: Clean zero-rating defaults on new dishes, seed cleanup, and verified dish order review assertion test.
    - Notifications: Order cancellation status notifications dispatched on customer self-cancellation.
    - Living Documentation: Fully synchronized `APP_FEATURES_AND_ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE.md`, and `PROJECT_LOG.md`.
- **WHY (the problem or goal)**:
  - Bring all production audit bug fixes and test suites into `main` to deliver a commercial-ready stable release baseline.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Validated 0 merge conflicts using ORT merge strategy; verified all documentation and schema updates.
- **HOW TO TEST**:
  - Run full server test suite (`npm test` in `server/`) -> 90/90 tests passing across all 9 suites.
  - Run Expo lint (`npm run lint`) -> 0 errors.
- **Commit hashes**:
  - `792facf` (merge: incorporate audit fixes across auth, loyalty, storage, client retry, and test suites into main)

---

## [2026-10-30] - Docs: Align Features Document with Code State across Cancel Window, Polling, Storage, and Roadmap

- **Date**: 2026-10-30
- **Title**: Docs: Align Features Document with Code State across Cancel Window, Polling, Storage, and Roadmap
- **WHAT changed**:
  - In `docs/APP_FEATURES_AND_ROADMAP.md`:
    - Updated Part 1 to match verified codebase reality:
      - 10-minute cancellation window policy (`CANCEL_WINDOW_MINUTES = 10`).
      - Real polling intervals: 10s for order tracking, 20s for notifications.
      - Hardware-backed token security via `expo-secure-store` with web fallback.
      - 90/90 automated tests across 9 Jest suites.
      - Automatic loyalty points refund on cancelled orders.
      - Newly created dishes initializing at zero ratings with clean seed catalog.
      - Notification delivery status clarifying database documents vs native APNs/FCM setup.
      - Ephemeral photo storage on Render disk vs cloud CDN roadmap.
    - Expanded Part 2 with prioritized commercial roadmap: Online Payment Gateways (JazzCash/EasyPaisa/Cards), Real-time WebSockets, Cloudinary object storage, native push credentials, live GPS rider tracking, Table QR-code ordering, automated SMS/WhatsApp alerts, Kitchen Display System (KDS) tablet app, biometrics/social login, and ingredient-level inventory.
- **WHY (the problem or goal)**:
  - Eliminate all discrepancies between written specifications and the production codebase discovered during the Batch 1 audit, and establish a clear commercial roadmap for post-MVP growth.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Audited each feature claim against Mongoose models, constants, and React Native components, correcting all metrics and architectural claims.
- **HOW TO TEST**:
  - Review `docs/APP_FEATURES_AND_ROADMAP.md` sections against `server/config/constants.js`, `src/screens/OrderTracking/`, and `src/utils/safeStorage.js`.
- **Commit hashes**:
  - `d8453e9` (docs: align features document with code state across cancel window, polling, test counts, storage and push)

---

## [2026-10-30] - Feat: Migrate Auth Tokens to Hardware-Backed SecureStore with Web Fallback

- **Date**: 2026-10-30
- **Title**: Feat: Migrate Auth Tokens to Hardware-Backed SecureStore with Web Fallback
- **WHAT changed**:
  - Installed SDK 57 compatible `expo-secure-store` (`^15.0.8`).
  - In `src/utils/safeStorage.js`:
    - Implemented `secureStore` module backed by iOS Keychain and Android Keystore for sensitive authentication tokens (`@aura_auth_token`).
    - Added transparent automatic migration: checks SecureStore first; if not found, reads legacy AsyncStorage, saves to SecureStore, and cleans up legacy storage.
    - Added web fallback to encrypted memory/localStorage when running on web.
    - Preserved standard non-sensitive settings (theme, branch preferences) in `AsyncStorage`.
  - In `app.json`: Added `expo-secure-store` config plugin.
  - In `server/tests/secureTokenStorage.test.js`: Added 3 tests validating secure storage interface, token migration semantics, and web fallback isolation.
- **WHY (the problem or goal)**:
  - Address Audit Bug #8: Sensitive JWT authentication tokens were previously stored in unencrypted plain text via `AsyncStorage`, leaving them vulnerable on rooted or compromised physical devices.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Leveraged `expo-secure-store` for cryptographic hardware isolation without breaking existing user sessions via transparent legacy migration.
- **HOW TO TEST**:
  - Log in on mobile device -> token persists securely in hardware keystore.
  - On app launch, session restores seamlessly.
  - Run `server/tests/secureTokenStorage.test.js` to verify mock test suite passes.
- **Commit hashes**:
  - `c245316` (feat(storage): migrate auth tokens to hardware-backed expo-secure-store with web fallback)

---

## [2026-10-30] - Feat: Render Cold-Start Single Retry and Animated Waking Server Notice

- **Date**: 2026-10-30
- **Title**: Feat: Render Cold-Start Single Retry and Animated Waking Server Notice
- **WHAT changed**:
  - In `src/api/client.js`:
    - Extended timeout budget for cloud spin-up resilience.
    - Implemented automatic single retry specifically for idempotent `GET` requests on timeout.
    - Added server waking event listeners (`onServerWakingChange`) triggered when network requests exceed 5 seconds.
  - In `src/components/ServerWakingBanner.js`:
    - Built floating animated top banner with pulsing activity indicator and friendly copy: "Connecting to server (waking up cloud service, please wait...)".
    - Auto-dismisses smoothly when response returns or error handles.
  - In `App.js`: Mounted `<ServerWakingBanner />` at application root alongside notification banner.
  - In `server/tests/clientColdStart.test.js`: Added 3 tests verifying retry logic for GET, no retry on non-idempotent POST, and waking status transition.
- **WHY (the problem or goal)**:
  - Address Audit Bug #5: Render free tier spins down after inactivity, causing 30–50s cold-start delays. Customers experienced abrupt Wi-Fi network failure messages without visual feedback or retry mechanisms.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Safe retry on idempotent queries avoids duplicate order placement or duplicate charge risks while smoothing cold-start transitions.
- **HOW TO TEST**:
  - Simulate server delay > 5s -> top waking banner slides down.
  - On response arrival -> banner slides away smoothly.
  - Run `server/tests/clientColdStart.test.js` to verify test suite passes.
- **Commit hashes**:
  - `b895730` (feat(client): add cold start single retry for GET and waking server notice)

---

## [2026-10-30] - Test: Reject Review for Dish Not Part of Served Order

- **Date**: 2026-10-30
- **Title**: Test: Reject Review for Dish Not Part of Served Order
- **WHAT changed**:
  - In `server/tests/reviews.test.js`:
    - Added integration test: `rejects review submission for a dish that was not part of the served order`.
    - Creates order with Dish A, attempts review for Dish B; asserts HTTP 400 response and message matching `/The specified dish was not part of this order/i`.
- **WHY (the problem or goal)**:
  - Formally verify Proof Assertion #1 from Feature Verification Audit (`docs/FEATURE_AUDIT.md`), guaranteeing that customers can never review dishes they did not purchase.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Expanded `server/tests/reviews.test.js` test coverage to 14 tests.
- **HOW TO TEST**:
  - Run `npx jest server/tests/reviews.test.js` -> 14/14 tests pass.
- **Commit hashes**:
  - `ba251ca` (test(reviews): add test rejecting review for a dish not part of the served order)

---

## [2026-10-30] - Fix: Start Newly Created Dishes with Zero Ratings and Clean Fake Seed Ratings

- **Date**: 2026-10-30
- **Title**: Fix: Start Newly Created Dishes with Zero Ratings and Clean Fake Seed Ratings
- **WHAT changed**:
  - In `server/controllers/menuController.js`:
    - Forced `rating: 0`, `ratingAverage: 0`, and `ratingCount: 0` on new dish creation via `createMenuItem`.
  - In `src/context/MenuContext.js`:
    - Removed hardcoded `rating: 4.9` default on `addMenuItem()`.
  - In `server/seed.js`:
    - Stripped hardcoded `rating: 4.8`, `4.9`, etc. from catalog seed fixtures.
  - In `server/tests/reviews.test.js`:
    - Added test verifying new dishes initialize at 0 rating and update dynamically as verified reviews arrive.
- **WHY (the problem or goal)**:
  - Address Audit Bug #9: Newly created items previously defaulted to 4.9 stars, and seeds contained fabricated rating metrics rather than organic verified patron scores.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Reset schema defaults to 0 across controller, context, and seeder, displaying dynamic "New" tag in UI until patrons submit reviews.
- **HOW TO TEST**:
  - Create a new dish as Manager -> verify dish displays 0 reviews and 0.0 rating.
- **Commit hashes**:
  - `daaf3ea` (fix(menu): start newly added dishes with zero ratings and clean fake seed ratings)

---

## [2026-10-24] - Fix: Customer Self-Cancellation Dispatches Status Notification

- **Date**: 2026-10-24
- **Title**: Fix: Customer Self-Cancellation Dispatches Status Notification
- **WHAT changed**:
  - In `server/controllers/orderController.js`:
    - Added `await notificationService.notifyOrderStatus(order)` inside `cancelMyOrder` handler.
  - In `server/tests/notifications.test.js`:
    - Added 2 integration tests verifying order cancellation triggers notification creation and sets status to `Cancelled`.
- **WHY (the problem or goal)**:
  - Address Audit Bug #6: While manager cancellations created an in-app notification for the customer, customer self-cancellations within the 10-minute window omitted notification generation, leaving the customer without an in-app receipt confirmation.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Reused existing `notifyOrderStatus` service wrapped in non-blocking try-catch.
- **HOW TO TEST**:
  - Customer places order -> cancels within 10-minute window -> opens notification center -> sees "Order Cancelled" notification.
- **Commit hashes**:
  - `aab5339` (fix(notifications): dispatch cancellation notification on customer self-cancel)

---

## [2026-10-24] - Fix: Return Clean 400 on Non-Gmail Staff Account Creation

- **Date**: 2026-10-24
- **Title**: Fix: Return Clean 400 on Non-Gmail Staff Account Creation
- **WHAT changed**:
  - In `server/controllers/authController.js`:
    - In `createStaffAccount`, added validation `!cleanEmail.endsWith('@gmail.com')` returning `400 ('Staff registration requires a valid Gmail address (@gmail.com)')`.
  - In `server/tests/auth.test.js`:
    - Added 2 tests verifying staff account rejection for invalid email domains with clean 400 status.
- **WHY (the problem or goal)**:
  - Address Audit Bug #10: Controller lacked an email domain guard, allowing invalid domains to trigger unhandled 500 Mongoose schema validation errors.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Enforced consistent domain validation before calling `User.create`.
- **HOW TO TEST**:
  - Attempt staff creation with `chef@yahoo.com` -> receives clean 400 error instead of 500 crash.
- **Commit hashes**:
  - `7c38c5b` (fix(auth): return clean 400 for non-gmail addresses on staff account creation)

---

## [2026-10-24] - Fix: Atomically Refund Redeemed Loyalty Points on Order Cancellation

- **Date**: 2026-10-24
- **Title**: Fix: Atomically Refund Redeemed Loyalty Points on Order Cancellation
- **WHAT changed**:
  - In `server/models/Order.js`:
    - Added `pointsRefunded: { type: Boolean, default: false }` field.
  - In `server/services/loyaltyService.js`:
    - Implemented `refundOrderPoints(orderId)`:
      - Uses atomic `findOneAndUpdate` with `{ pointsRedeemed: { $gt: 0 }, pointsRefunded: { $ne: true } }` to ensure idempotency.
      - Atomically increments user balance via `$inc: { loyaltyPoints: pointsToRefund }`.
      - Writes `LoyaltyTransaction` audit log with `type: 'adjustment'`.
  - In `server/controllers/orderController.js`:
    - Hooked `refundOrderPoints(order._id)` into both customer self-cancellation (`cancelMyOrder`) and manager order cancellation (`updateOrderStatus`).
  - In `server/tests/loyalty.test.js`:
    - Added 3 integration tests verifying point refund on customer cancellation, manager cancellation, and idempotency (no double refunds).
- **WHY (the problem or goal)**:
  - Address Audit Bug #2: Redeemed points applied at checkout were permanently lost if an order was cancelled, resulting in customer point loss.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Idempotent atomic design prevents double refunds and maintains full audit integrity in `LoyaltyTransaction`.
- **HOW TO TEST**:
  - Place order redeeming 100 points -> cancel order -> verify user balance restored by 100 points and adjustment entry appears in ledger.
- **Commit hashes**:
  - `87fc24b` (fix(loyalty): atomically refund redeemed points on order cancellation with ledger entry)

---

## [2026-10-24] - Fix: Exempt Internal Phone OTP Accounts from Gmail Schema Validation

- **Date**: 2026-10-24
- **Title**: Fix: Exempt Internal Phone OTP Accounts from Gmail Schema Validation
- **WHAT changed**:
  - In `server/models/User.js`:
    - Replaced rigid regex match with custom validator: exempts internal `${phone}@customer.aura.pk` synthetic emails while strictly enforcing `/^[a-zA-Z0-9_.+-]+@gmail\.com$/` for all standard email signups.
  - In `server/controllers/authController.js`:
    - Verified phone OTP verify route smoothly provisions users without collision.
  - In `server/tests/auth.test.js`:
    - Added 4 integration tests verifying phone OTP account creation, `@customer.aura.pk` exemption, and strict non-Gmail rejection for public signups.
- **WHY (the problem or goal)**:
  - Address Audit Bug #1: Phone OTP registration crashed on `User.create` with an unhandled 500 Mongoose `ValidationError` because the internal auto-generated email format conflicted with the schema regex.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Replaced single regex with custom Mongoose validator function handling internal provisioning transparently.
- **HOW TO TEST**:
  - Send phone OTP -> verify OTP -> user account created successfully with zero validation errors.
- **Commit hashes**:
  - `efcecd1` (fix(auth): exempt internal phone OTP emails from gmail validation and add auth tests)

---

## [2026-10-24] - Docs: Feature Verification Audit of Batch 1 and Feature Document

- **Date**: 2026-10-24
- **Title**: Docs: Feature Verification Audit of Batch 1 and Feature Document
- **WHAT changed**:
  - Executed full verification suite on branch `features-batch-1`:
    - Ran all 53 Jest tests across all 4 suites (`notifications.test.js`, `vouchers.test.js`, `reviews.test.js`, `loyalty.test.js`): 53/53 passed (100%).
    - Ran `node --check` across all 34 server files: 0 syntax errors.
    - Ran ESLint: 0 errors, 78 warnings.
    - Ran Android production bundle export (`expo export --platform android`): 0 errors, 2.9 MB bundle built in 15.1s.
    - Conducted full repo search for fixed vouchers (`WELCOME10`, `FEAST20`, `AURA30`, `CHEF15`) and hardcoded rating numbers.
  - Audited all 11 features in Part 1 of `AURA_Restaurant_App_Features_and_Roadmap.docx` (`APP_FEATURES_AND_ROADMAP.md`).
  - Answered 9 technical questions regarding cancel window, email domain restriction, token storage, loyalty mechanics, push notification capabilities, Render photo persistence, notification event hooks, Render environment, and test counts.
  - Documented complete findings, risk table, and top 10 prioritized customer-facing bugs/gaps in `docs/FEATURE_AUDIT.md`.
- **WHY (the problem or goal)**:
  - Verify Batch 1 features empirically, compare actual code behavior against written document claims, and identify real bugs, architectural discrepancies, and production risks before deploying.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Followed read-only audit protocol without adding features or modifying code when all checks passed.
  - Verified atomic MongoDB operations for loyalty, traced phone OTP validation conflicts, and evaluated ephemeral disk storage on Render.
- **HOW TO TEST**:
  - Review `docs/FEATURE_AUDIT.md` for full breakdown and reproduction paths.
  - Run `npm test` inside `server/` to verify 53/53 tests pass.
- **RISKS or follow-ups**:
  - Phone OTP registration fails due to Mongoose schema regex collision (`@customer.aura.pk` vs `@gmail.com`).
  - Loyalty points are not refunded upon order cancellation.
  - Uploaded dish images on Render free tier vanish upon container restart.
- **Commit hashes**:
  - `558f2e3` (docs: feature audit)

---

## [2026-10-24] - Refactor: Replace Obscure Jargon with Plain English Across Entire App

- **Date**: 2026-10-24
- **Title**: Refactor: Replace Obscure Jargon with Plain English Across Entire App
- **WHAT changed**:
  - Replaced obscure patron/culinary jargon across all client screens, navigation, and components:
    - "Patron" / "Valued Patron" -> "Customer" / "Valued Guest"
    - "Culinary Tray" -> "Cart"
    - "Handmade Morel & Truffle Agnolotti" -> "Handmade Truffle Pasta"
    - "Wild Atlantic Halibut en Papillote" -> "Wild Atlantic Baked Halibut"
    - "Executive Chef / Manager" / "Executive Response" -> "Manager" / "Manager Reply"
    - "Privilege Vouchers" / "Privilege Savings" -> "Discount Vouchers" / "Voucher Discount" / "Coupons & Deals"
    - "Patron points" -> "Loyalty points"
  - Updated seed data in `server/seed.js` and live MongoDB items.
  - Updated test data strings in `server/tests/reviews.test.js`, `vouchers.test.js`, and `notifications.test.js`.
  - Untracked `designs/` folder from Git and added to `.gitignore`.
  - All 67/67 server tests passing across all 6 test suites.
- **WHY (the problem or goal)**:
  - User requested that all obscure, hard-to-understand culinary and patron jargon ("patron", "handmade agnolotti", "culinary tray", "executive console") be replaced with simple, clear, standard English across the entire app so any customer or manager can easily understand everything.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Swept through frontend components, navigation labels, modals, cart views, manager screens, and backend seeders to replace all confusing terminology with clear, friendly words while maintaining design consistency.
- **HOW TO TEST**:
  - Open customer app: Tab displays "Cart" instead of "Culinary Tray", dish names show clear English descriptions, cart shows "Voucher Discount" and "Coupons & Vouchers", loyalty shows "loyalty points".
  - Open manager app: Review reply shows "Reply as Manager" and "Responding to Customer".
  - Run server test suite: 67/67 tests passing.
- **Commit hashes**:
  - `aff8d04` (refactor: replace obscure jargon with plain English across app)

---

## [2026-10-23] - Fix: Deals Row - Real Server-Driven Vouchers Only

- **Date**: 2026-10-23
- **Title**: Fix: Deals Row - Real Server-Driven Vouchers Only
- **WHAT changed**:
  - In `server/models/Voucher.js`: Added `isDemo: Boolean` (default false), `perUserLimit: Number` (default null), and compound active query index `{ isActive: 1, validFrom: 1, validUntil: 1, isDemo: 1 }`.
  - In `server/services/voucherService.js`: Implemented `getActiveVouchers(userId)` with strict filtering (active, valid dates, usage left, per-user limits, production demo exclusion). Updated `validateVoucher` to enforce user limits, return `validUntil`, and reject demo vouchers in production. Added `deactivateDemoVouchers()`.
  - In `server/controllers/voucherController.js` and `server/routes/voucherRoutes.js`: Exposed public `GET /api/vouchers/active` and manager `POST /api/vouchers/deactivate-demo`.
  - In `server/seedDemo.js` & `server/package.json`: Created isolated demo seeder tagged with `isDemo: true` guarded against production; added `"seed:demo"` script.
  - In `src/screens/Menu/DealsSection.js`: Fully refactored to consume `GET /api/vouchers/active` via `useApi` with `useFocusEffect` refetching; chips built strictly from voucher fields (`buildChipLabel`, `buildChipDetails`); row auto-hides when empty/error; applies deal through server validation and removes rejected vouchers.
  - In `src/screens/Menu/menuStyles.js` & `src/screens/Menu/MenuScreen.js`: Removed hardcoded `DEALS_FOR_YOU` array and static props.
  - In `src/screens/Cart/`: Removed hardcoded promo code references and banners in `VoucherSection.js`, `CartEmptyState.js`, and `CartContext.js`.
  - In `src/screens/Manager/VouchersTab.js` & `VoucherModal.js`: Added `DEMO` badge, header "Deactivate Demo" batch action with confirmation modal, and live customer deals chip preview in the voucher creation/edit modal.
  - In `server/tests/`: Added unit/integration tests in `vouchers.test.js` and `noHardcodedVouchers.test.js` (all 6 suites, 67/67 tests passing).
- **WHY (the problem or goal)**:
  - Eliminate all hardcoded promo codes and guarantee that the customer Deals row renders 100% real, active, valid promotional vouchers sourced dynamically from MongoDB Atlas.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Server is single source of truth; demo vouchers are strictly separated and disabled in production; live preview in manager modal mirrors exact customer chip rendering.
- **HOW TO TEST**:
  - Customer Menu: Verify Deals row dynamically shows active vouchers from MongoDB; row hides completely when no vouchers active.
  - Cart: Validate voucher codes against `/api/vouchers/validate`.
  - Manager Dashboard: Demo vouchers display DEMO badge; tap "Deactivate Demo" to bulk-deactivate; open VoucherModal to see live chip preview update as fields change.
- **Commit hashes**:
  - `91b8cd4` (fix(vouchers): replace hardcoded deals with server-driven /active endpoint)

---

## [2026-10-23] - Feat: Features Batch 2 - Feature 1: Expo Push Notifications & Order Lifecycle Alerts

- **Date**: 2026-10-23
- **Title**: Feat: Features Batch 2 - Feature 1: Expo Push Notifications & Order Lifecycle Alerts
- **WHAT changed**:
  - In `server/models/User.js`: Added `pushTokens: { type: [String], default: [] }` field for storing registered device push tokens.
  - In `server/services/pushNotificationService.js`: Implemented server service for token validation (`isExpoPushToken`), registration (`$addToSet`), unregistration (`$pull`), and remote push dispatch to Expo's free push gateway (`https://exp.host/--/api/v2/push/send`) with automatic dead-token pruning (`DeviceNotRegistered`).
  - In `server/controllers/notificationController.js` and `server/routes/notificationRoutes.js`: Exposed `POST /api/notifications/push-token` and `DELETE /api/notifications/push-token` endpoints.
  - In `server/services/notificationService.js`: Hooked non-blocking Expo push dispatching into `notifyOrderStatus`, `notifyReviewReply`, and `notifyLoyaltyPoints`.
  - In `server/tests/notifications.test.js`: Added 5 integration tests covering validation, registration, deduplication, unregistration, and push dispatch (63/63 passing tests across full server suite).
  - In `package.json`: Installed SDK 57 compatible `expo-notifications@~57.0.24`.
  - In `src/services/pushNotificationService.js`: Created client-side service configuring Android notification channels (`default`, `aura-order-updates`), permission requests, token acquisition, and backend sync/unregistration.
  - In `src/context/NotificationContext.js`: Automated push token registration on user login, foreground push listeners with instant data refresh, and notification tap response handling.
  - In `src/context/AuthContext.js`: Added push token unregistration call on user logout.
  - In `src/components/NotificationBannerToast.js`: Created in-app floating banner toast dropping down on foreground notifications with tap-to-navigate action.
  - In `App.js`: Mounted `NotificationBannerToast` globally across all screens.
- **WHY (the problem or goal)**:
  - Deliver real-time push alerts to dining customers on mobile devices when their order status advances (`Preparing` -> `Ready` -> `Served`), when managers reply to reviews, or when loyalty points are awarded, without requiring paid APNs/FCM setup.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Leveraged Expo Push Service HTTP API (100% free, zero native keys needed), combined with an animated React Native in-app floating banner for instant foreground feedback.
  - Formatted relative timestamps outside component render to maintain strict React Compiler purity.
- **HOW TO TEST**:
  - Sign in as customer -> verify `POST /api/notifications/push-token` syncs token in server console.
  - When manager advances an order status -> verify push notification triggers and in-app floating banner drops down.
  - Tap banner -> navigates to `TrackTab`.
  - Sign out -> verify token is unregistered.
- **Commit hashes**:
  - `f6cf386` (feat(notifications): implement expo push notifications, token registration, and order lifecycle alerts)

---

## [2026-10-23] - Feat: Features Batch 1 - Feature 3: Manager Analytics Dashboard & Aggregations

- **Date**: 2026-10-23
- **Title**: Feat: Features Batch 1 - Feature 3: Manager Analytics Dashboard & Aggregations
- **WHAT changed**:
  - In `server/services/analyticsService.js`: Implemented MongoDB aggregation pipelines for date-filtered business analytics (`today`, `7d`, `30d`), calculating net revenue, total order volume, Average Order Value (AOV), order status distribution, top 5 dishes by quantity and revenue, 24-hour hourly rush distribution in PKT (`+05:00`), multi-branch revenue/order breakdown, and repeat customer retention rate.
  - In `server/controllers/analyticsController.js` and `server/routes/analyticsRoutes.js`: Exposed `GET /api/analytics/summary` protected with `protect` and `managerOnly` authorization.
  - In `server/models/Order.js`: Added compound indexes `{ createdAt: -1, status: 1 }` and `{ branchId: 1, createdAt: -1 }` for high-throughput aggregation performance.
  - In `server/tests/analytics.test.js`: Created comprehensive integration test suite verifying metrics calculation, status breakdown, 24-hour PKT buckets, and RBAC authentication (58/58 passing tests across full server suite).
  - In `src/api/client.js`: Configured development fallback for native physical devices to connect directly to the local dev server over LAN (`192.168.100.6:5000`) instead of older cloud deployments.
  - In `src/hooks/useManagerAnalytics.js`: Created reactive custom hook supporting time range toggling (`today`, `7d`, `30d`), pull-to-refresh, loading states, and error handling with retry.
  - In `src/screens/Manager/HourlyBarChart.js`: Built pure View-based responsive 24-hour rush bar chart using theme tokens, peak hour highlight, and time labels.
  - In `src/screens/Manager/OverviewTab.js`: Redesigned executive overview with range switcher pills, 4 primary KPI cards (Revenue, Orders, AOV, Repeat Rate), status breakdown chips, hourly rush distribution chart, top culinary performers with revenue badges, skeleton loader, and error retry state.
- **WHY (the problem or goal)**:
  - Complete Feature 3 of Features Batch 1 to empower restaurant managers with actionable business intelligence, sales metrics, kitchen peak-hour visibility, and regional outlet performance without requiring paid external analytics tools.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Decomposed into modular service, controller, test, hook, chart component, and tab view, keeping every file strictly under 400 lines.
  - Pure View-based bar chart using theme tokens avoided adding heavy external charting packages.
- **HOW TO TEST**:
  - Log in as Manager (`manager@aura.pk` / `manager123`).
  - On Manager Dashboard "Overview" tab, observe KPI cards (Revenue, Orders, AOV, Repeat Rate).
  - Tap time range pills: "Today", "7 Days", "30 Days" and verify metrics update.
  - Inspect 24-hour rush bar chart and top dishes leaderboard.
  - Pull down to refresh or test offline state with Retry button.
- **Commit hashes**:
  - `1b8d70d` (feat(analytics): implement manager business analytics endpoint and overview dashboard)

---

## [2026-10-23] - Feat: Design Refresh V2 - Screen 6: Table Reservation (My Bookings & Reservations)

- **Date**: 2026-10-23
- **Title**: Feat: Design Refresh V2 - Screen 6: Table Reservation (My Bookings & Reservations)
- **WHAT changed**:
  - In `src/screens/Reservation/myBookingsStyles.js`: Created dedicated stylesheet implementing Screen 6 design tokens (segmented filter tabs, elevated booking cards, status badges, details bento boxes, perk card, and retry banner).
  - In `src/screens/Reservation/MyBookingsCard.js`: Built modular booking card component featuring:
    - Status badges (`Confirmed` with green pulsing dot, `Completed`, `Cancelled`, `No-Show`).
    - Booking reference (`#TBL-XXXXX`).
    - Venue ambience thumbnail, date formatted (Today/Tomorrow/Date), time with service label (Lunch/Dinner), party size, and seating area.
    - Special requests tag with magic sparkles icon.
    - Venue address and interactive "Get Directions" link with arrow.
    - Contextual action buttons: `Modify` and error-tinted `Cancel Table` for upcoming reservations; `Rebook Table` for past/cancelled.
    - "Complimentary Welcome Sip" hospitality perk card for upcoming dining bookings.
  - In `src/screens/Reservation/MyBookingsList.js`: Upgraded list screen with:
    - 3-filter segmented tab bar (`Upcoming`, `Past / Done`, `Cancelled`) with live count badges.
    - Total count badge (`X total`).
    - Dismissible network refresh error banner with one-tap retry button.
    - Polished empty state with "Reserve an Artisan Table" rebook CTA.
- **WHY (the problem or goal)**:
  - Deliver Screen 6 of Design Refresh V2 based on Stitch HTML/screenshot sources of truth for both light and dark modes, completing the reservation flow with high-fidelity history and booking management.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Decomposed into modular styles and card component (`myBookingsStyles.js` ~220 lines, `MyBookingsCard.js` ~240 lines, `MyBookingsList.js` ~230 lines) all strictly <400 lines.
- **HOW TO TEST**:
  - In Reservation screen, switch to "My Bookings" tab.
  - Verify segmented tabs: "Upcoming", "Past / Done", "Cancelled" with counts.
  - Test tapping "Cancel Table" -> confirmation alert -> updates status.
  - Test "Get Directions" -> opens Maps app.
  - Switch tabs to verify filtering and empty state when a filter has 0 bookings.
- **Commit hashes**:
  - `69e4e15` (feat(reservation): refresh Screen 6 My Bookings to design-refresh-v2 specs)

---

## [2026-10-23] - Feat: Design Refresh V2 - Screen 5: Table Reservation (Booking Confirmed Success)

- **Date**: 2026-10-23
- **Title**: Feat: Design Refresh V2 - Screen 5: Table Reservation (Booking Confirmed Success)
- **WHAT changed**:
  - In `src/screens/Reservation/bookingSuccessStyles.js`: Created dedicated stylesheet implementing Screen 5 design tokens (celebratory particle container, ambient coral glow `#FC5834`/`#FF6B4A`, 72px check badge with elevation, interactive `#TBL-XXXXX` copy chip, rounded 20px card, bento specs grid, micro-action pill buttons, and stacked primary/secondary CTAs).
  - In `src/screens/Reservation/BookingConfirmedSuccess.js`: Built complete celebratory confirmation screen featuring:
    - Top bar with restaurant icon pill and dismiss 'close' button.
    - Festive hero area with ambient glow, sparkle icons (`✦`, `✨`), and vibrant checkmark badge.
    - Confirmation headline ("You are booked!") and delivery notification microcopy.
    - Interactive Booking ID chip (`#TBL-XXXXX`) with one-tap copy and visual checkmark feedback.
    - Detailed Table Confirmed Card with branch ambience photo, green `TABLE CONFIRMED` tag, branch name & category.
    - 2-column + 1-row bento specs grid for Date, Time, and Party Size / Seating area.
    - Special requests highlight pill with magic sparkles indicator.
    - Venue location block with live branch address, valet/parking note, and one-tap `Directions` (Maps URL) and `Call Host` (`tel:`) buttons.
    - Stacked action buttons: "Add to Calendar" (schedule alert), "View My Bookings" (switches to active bookings tab), and "Back to Home".
  - In `src/screens/Reservation/SuccessSheet.js`: Delegated `ReservationConfirmedModal` bridge export to `BookingConfirmedSuccess` preserving backward compatibility.
  - In `src/screens/Reservation/ReservationScreen.js`: Wired `BookingConfirmedSuccess` directly for confirmed reservation state.
- **WHY (the problem or goal)**:
  - Deliver Screen 5 of Design Refresh V2 based strictly on Stitch HTML/screenshot sources of truth for both light and dark modes, providing a premium, rewarding booking completion experience with actionable next steps.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Extracted dedicated styles and component keeping file sizes strictly <400 lines (`bookingSuccessStyles.js` ~240 lines, `BookingConfirmedSuccess.js` ~320 lines).
  - Used native `Linking` for directions and dialer without adding external libraries.
- **HOW TO TEST**:
  - Complete a table reservation (or trigger `confirmedReservation`).
  - Verify celebratory hero displays check badge, glow, and booking ID chip.
  - Tap copy button next to Booking ID -> shows checkmark icon feedback.
  - Verify reservation specs: Date, Time, Guests & seating area match user selection.
  - Test Directions and Call Host buttons -> properly trigger map and telephone schemes.
  - Tap "View My Bookings" -> closes modal and switches directly to "My Bookings" tab.
  - Tap "Back to Home" or Top close button -> closes modal.
- **Commit hashes**:
  - `00bb04c` (feat(reservation): refresh Screen 5 Booking Confirmed Success to design-refresh-v2 specs)

---

## [2026-10-23] - Fix: Reservation Step 3 Contact Email Placeholder & Pre-Fill Standardization

- **Date**: 2026-10-23
- **Title**: Fix: Reservation Step 3 Contact Email Placeholder & Pre-Fill Standardization
- **WHAT changed**:
  - In `src/screens/Reservation/Step3YourDetails.js`: Added `isPlaceholderEmail` filter and `useAuth()` hook to pre-fill the customer's real email while filtering out internal phone OTP placeholder domains (`@customer.aura.pk`, `@aurabistro.pk`, `@aurakitchen.pk`).
  - In `src/screens/Reservation/PrimaryContactCard.js`: Replaced hardcoded dummy email placeholder `guest@aurakitchen.pk` with industry-standard `yourname@gmail.com`, added a clear text button (`close-circle`) when typed, and added receipt helper microcopy.
- **WHY (the problem or goal)**:
  - Internal synthetic emails (e.g. `guest@aurakitchen.pk`) should never be displayed as suggestions or placeholders to customers in real-world apps. Matches the Gmail standardization established across the user profile.
- **HOW TO TEST**:
  - Open Reservation -> Step 3. If signed in with phone OTP, email field starts clean with `yourname@gmail.com` hint.
  - If user enters email, clear button allows quick reset.
- **Commit hashes**:
  - `97bd4cc` (fix(reservation): replace dummy placeholder email with yourname@gmail.com and filter internal domain)

---

## [2026-10-23] - Feat: Design Refresh V2 - Screen 4: Table Reservation Step 3 (Your Details & Review)

- **Date**: 2026-10-23
- **Title**: Feat: Design Refresh V2 - Screen 4: Table Reservation Step 3 (Your Details & Review)
- **WHAT changed**:
  - In `src/screens/Reservation/step3Styles.js`: Created dedicated stylesheet implementing Step 3 design tokens (Coral `#FC5834` light, `#FF6B4A` dark, rounded 16px/20px cards, input fields with focus states, chip groups, and sticky dock).
  - In `src/screens/Reservation/PrimaryContactCard.js`: Built modular contact information card featuring:
    - Pre-filled customer name, phone number, and email.
    - Strict Pakistan (+92) phone number formatting with Pakistan flag icon `🇵🇰` and non-editable `+92` prefix.
    - Seating preference selection pills (`Standard`, `Window Table`, `Quiet Corner`, `Outdoor Terrace`).
    - Input validation feedback and seamless field navigation.
  - In `src/screens/Reservation/SpecialRequestsCard.js`: Built modular dietary & special requests card featuring:
    - Quick-select chip options (`Birthday 🎂`, `Anniversary 💍`, `Quiet table 🤫`, `High chair 👶`, `Window view 🪟`, `Outdoor 🌿`).
    - Multi-line freeform notes input (150-char max counter).
    - Friendly microcopy clarifying special requests are subject to table availability.
  - In `src/screens/Reservation/Step3YourDetails.js`: Assembled Step 3 screen featuring:
    - Top navigation with back action to Step 2 and 3-segment progress indicator (Step 1 & 2 complete, Step 3 active).
    - Summary review card (`Today, Oct 24 • 2 Guests • Indoor • 07:30 PM`) with direct "Edit" touchable returning to Step 1.
    - Room preview card with branch ambience photo, live Prime Table badge, and instant confirmation guarantee.
    - Cancellation policy notice ("Free cancellation up to 2 hours before dining time").
    - Sticky bottom primary CTA ("Confirm Reservation") with security lock icon, disabled state when contact fields are invalid, and loading indicator.
  - In `src/screens/Reservation/ReservationScreen.js`: Wired `Step3YourDetails` into `bookingStep === 3` with seamless navigation to Step 2 and submission handling.
- **WHY (the problem or goal)**:
  - Upgrade Table Reservation Step 3 to design-refresh-v2 specifications based on Stitch HTML/screenshot sources of truth, streamlining contact verification, special occasion tagging, and reservation confirmation with zero friction.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Extracted modular sub-components (`PrimaryContactCard`, `SpecialRequestsCard`, `step3Styles`, `Step3YourDetails`) keeping each file strictly <400 lines (115-240 lines).
  - Preserved existing reservation state, token auth, and backend API contract with `reservationService`.
- **HOW TO TEST**:
  - In Reservation Step 2, select a time slot and tap "Next: Your details" -> transitions to Step 3.
  - Verify 3-segment progress bar shows all segments filled and "Step 3 of 3" pill badge.
  - Verify Summary Review card displays correct date, guest count, seating area, and chosen time slot.
  - Test contact form: pre-fills logged-in user data; verify Pakistan phone prefix (+92).
  - Tap dietary / occasion chips -> tags toggle on/off and append into special requests.
  - Tap "Confirm Reservation" -> calls reservation API, submits booking, and advances to confirmation.
- **RISKS or follow-ups**:
  - None. ESLint passed with 0 errors (78 pre-existing warnings) and all 53 backend tests passed.
- **Commit hashes**:
  - `8909155` (feat(reservation): refresh Step 3 Your Details & Review to design-refresh-v2 specs)

---

## [2026-10-23] - Feat: Design Refresh V2 - Screen 3: Table Reservation Step 2 (Pick Time)

- **Date**: 2026-10-23
- **Title**: Feat: Design Refresh V2 - Screen 3: Table Reservation Step 2 (Pick Time)
- **WHAT changed**:
  - In `src/screens/Reservation/step2Styles.js`: Created dedicated stylesheet implementing Step 2 design tokens (coral `#FC5834` light, `#FF6B4A` dark, 3-column slots, ambient hero banner, rush alert card, and sticky CTA dock).
  - In `src/screens/Reservation/TimeSlotGrid.js`: Built modular 3-column dining slot grid separated by service period (☀️ Lunch 12:00 PM – 3:30 PM & 🌙 Dinner 6:00 PM – 10:30 PM), integrating backend collision checking (`isSlotAvailable`), "FULL" strikethrough states, and contextual subtitles ("Table free", "Popular 🔥", "Chef special", "Bar & Table").
  - In `src/screens/Reservation/Step2PickTime.js`: Assembled Step 2 screen featuring:
    - Top navigation with back action and 3-segment progress indicator (Step 1 complete, Step 2 active).
    - Active criteria summary card (`Today, Oct 24 • 2 Guests • Indoor`) with direct "Edit" touchable.
    - Page title with `2/3` step counter badge and dining duration helper ("1h 30m").
    - Ambient hero interior photo with live prime table status overlay pill.
    - Evening rush alert card with shortcut link to try tomorrow's date.
    - Seating area micro-pills (`Main Dining`, `Outdoor Terrace`, `Quiet Corner`).
    - Sticky bottom primary CTA ("Next: Your details (${time})") with instant confirmation microcopy.
  - In `src/screens/Reservation/ReservationScreen.js`: Wired `Step2PickTime` into `bookingStep === 2` with bidirectional navigation to Step 1 and Step 3.
- **WHY (the problem or goal)**:
  - Upgrade Table Reservation Step 2 to design-refresh-v2 specifications based on Stitch HTML/screenshot sources of truth, providing clear service periods, live collision indicators, and intuitive flow progression.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Extracted modular components (`TimeSlotGrid`, `step2Styles`, `Step2PickTime`) keeping each file strictly <400 lines (30-340 lines).
  - Maintained complete backward compatibility with `useReservation` hook and backend table availability.
- **HOW TO TEST**:
  - In Reservation Step 1, tap "Next: Pick a time" -> transitions to Step 2 with 2/3 progress indicator.
  - Verify booking summary card displays correct date, party size, and seating zone; tap "Edit" -> returns to Step 1.
  - Tap Lunch/Dinner time slots -> selected slot turns solid Coral with "Selected" label; sticky CTA updates time dynamically.
  - Tap "Try tomorrow" on rush alert -> updates reservation date to tomorrow.
  - Tap "Next: Your details" -> advances to Step 3.
- **RISKS or follow-ups**:
  - None. ESLint passed with 0 errors (78 pre-existing warnings) and all 53 backend tests passed.
- **Commit hashes**:
  - `1027683` (feat(reservation): refresh Step 2 Pick Time to design-refresh-v2 specs)

---

## [2026-10-23] - Feat: Design Refresh V2 - Screen 2: Table Reservation Step 1 (When & Guests)

- **Date**: 2026-10-23
- **Title**: Feat: Design Refresh V2 - Screen 2: Table Reservation Step 1 (When & Guests)
- **WHAT changed**:
  - In `src/screens/Reservation/step1Styles.js`: Created dedicated stylesheet implementing Warm Table design tokens (coral `#FC5834` light, `#FF6B4A` dark, rounded 16px/20px cards, progress bar segments, and sticky tray).
  - In `src/screens/Reservation/DateStripSection.js`: Built 7-day horizontal date carousel with calendar header, dynamic month/year pill, day name/num, and live status dots ("Open", "Prime", "Few left", "Full").
  - In `src/screens/Reservation/GuestCounterSection.js`: Built tactile guest counter card with circular plus/minus buttons (1-12 guests), auto-configured tables subtitle, and quick-picker chips (`1`, `2`, `4`, `6`, `8+`).
  - In `src/screens/Reservation/SeatingGridSection.js`: Built 2x2 grid of seating options (`Indoor`, `Patio`, `Family`, `Booth`) with ambience emojis, description subtext, and active checkmark badges.
  - In `src/screens/Reservation/VenueSnapshotCard.js`: Built ambient venue photo card with dynamic branch name pill, "No booking fee" badge, and trust row (Instant confirmation & Free cancellation).
  - In `src/screens/Reservation/Step1WhenGuests.js`: Assembled Step 1 screen featuring 3-segment progress indicator, step 1 of 3 pill, top navigation bar, and sticky bottom primary CTA ("Next: Pick a time").
  - In `src/screens/Reservation/ReservationScreen.js`: Wired `bookingStep` state machine rendering `Step1WhenGuests` at Step 1, with seamless transition to Step 2 and persistent access to My Bookings.
  - In `src/screens/Reservation/BookTabContent.js`: Added `onBack` handler providing a clean "Back to Step 1" navigation route.
- **WHY (the problem or goal)**:
  - Transform Table Reservation Step 1 into a modern multi-step booking experience matching Stitch HTML/screenshot sources of truth, with tactile guest counters, horizontal date carousel, and seating preferences.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Extracted modular sub-components keeping every file strictly <400 lines (each component is 60-180 lines).
  - Preserved existing reservation state and backend table compatibility.
- **HOW TO TEST**:
  - Open app and navigate to Reservations tab -> Step 1 (When & Guests) renders.
  - Verify 3-segment progress bar with Step 1 active and "Step 1 of 3" pill badge.
  - Tap dates in 7-day strip -> active date highlights in Coral with white typography.
  - Use +/- stepper or quick chips to change party size -> count and chips update in real-time.
  - Select a seating preference -> checkmark badge moves to selected card.
  - Tap "Next: Pick a time" -> advances to Step 2; tap back -> returns to Step 1 with preserved state.
- **RISKS or follow-ups**:
  - None. ESLint passed with 0 errors (78 pre-existing warnings) and all 53 backend tests passed.
- **Commit hashes**:
  - `c4e4eaf` (feat(reservation): refresh Step 1 When & Guests to design-refresh-v2 specs)

---

## [2026-10-23] - Feat: Design Refresh V2 - Screen 1: Menu Home Screen

- **Date**: 2026-10-23
- **Title**: Feat: Design Refresh V2 - Screen 1: Menu Home Screen
- **WHAT changed**:
  - In `src/screens/Menu/ChefsPickBanner.js`: Created compact modern Chef's Pick hero banner (~120px) matching Stitch designs, featuring gradient overlay, price tag badge, quick-add button, and dish preview.
  - In `src/screens/Menu/OrderAgainRow.js`: Redesigned to compact horizontal cards displaying max 3 recent dishes with thumbnail, price, title, and quick "+" add-to-cart button.
  - In `src/screens/Menu/DealsSection.js`: Refactored voucher / deal cards into compact single-line dashed ticket chips with copy-code feedback.
  - In `src/screens/Menu/CategoryRow.js`: Redesigned categories into vibrant Coral filled pills (`#FC5834`) with modern typography and smooth horizontal scroll.
  - In `src/components/MenuItemCard.js`: Updated dish card design with inline quantity stepper (`- qty +`) when item is in cart, subtle border radius, rating pills, and clean price presentation.
  - In `src/screens/Menu/DishGrid.js`: Integrated floating mini cart bar at bottom with live item count, subtotal, and direct "View Cart" navigation.
  - In `src/screens/Menu/menuStyles.js`: Unified typography, spacing, and brand coral color tokens (`#FC5834` light, `#FF6B4A` dark) per REDESIGN_BRIEF.md.
  - In `src/screens/Menu/MenuScreen.js`: Reordered scroll layout: Header Search & Location -> Chef's Pick Banner -> Deals / Vouchers -> Order Again -> Categories -> Dish Grid with Active Filters and Floating Cart Bar.
- **WHY (the problem or goal)**:
  - Upgrade the Menu Home screen to design-refresh-v2 specifications based on Stitch HTML/screenshot sources of truth, optimizing layout density, visual hierarchy, and instant add-to-cart interactivity.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Extracted modular components under `src/screens/Menu/` keeping each file <400 lines.
  - Used existing theme colors and Ionicons without introducing third-party packages or paid assets.
  - Preserved backward compatibility with CartContext, AuthContext, and backend APIs.
- **HOW TO TEST**:
  - Open app to Menu Home screen.
  - Verify Chef's Pick banner, compact Deals ticket chips, Order Again horizontal row, Category pills, and 2-column Dish Grid.
  - Tap "+" on any dish: verify inline quantity stepper appears and floating mini cart bar updates with count and price.
  - Tap mini cart bar: navigates to Cart screen.
- **RISKS or follow-ups**:
  - None. ESLint passed with 0 errors (78 pre-existing warnings) and all 53 backend tests passed.
- **Commit hashes**:
  - `9bb6ac5` (feat(menu): refresh Menu Home screen to design-refresh-v2 specs)

---

## [2026-10-23] - Feat: Real-Time In-App Notification Center Architecture (Batch 1)

- **Date**: 2026-10-23
- **Title**: Feat: Real-Time In-App Notification Center Architecture (Batch 1)
- **WHAT changed**:
  - In `server/models/Notification.js`: Created `Notification` schema with fields `user`, `type` (`order_status`, `review_reply`, `loyalty_tier_up`, `loyalty_points`, `voucher_expiring`, `welcome`, `general`), `title`, `body`, `refModel`, `refId`, `isRead`, and `readAt`, with compound indexes `{ user: 1, createdAt: -1 }` and `{ user: 1, isRead: 1 }`.
  - In `server/services/notificationService.js`: Implemented notification business logic: `createNotification`, `getUserNotifications` (paginated), `markAsRead`, `markAllRead`, `getUnreadCount`, and event dispatch helpers (`notifyOrderStatus`, `notifyReviewReply`, `notifyLoyaltyPoints`, `notifyTierUpgrade`).
  - In `server/controllers/notificationController.js`: Thin controllers for notification listing, unread count badge, marking single read, and marking all read.
  - In `server/routes/notificationRoutes.js` & `server/server.js`: Mounted `/api/notifications` routes protected by authentication middleware.
  - In `server/controllers/orderController.js`: Wired real-time customer notification dispatch when order status advances (Preparing, Ready, Served, Cancelled).
  - In `server/services/reviewService.js`: Wired notification dispatch when restaurant manager replies to patron dish reviews.
  - In `server/services/loyaltyService.js`: Wired notification dispatch when points are credited and VIP tier milestones are achieved.
  - In `src/hooks/useNotifications.js`: Created custom React hook with 20s auto-polling, pull-to-refresh, load more pagination, and mark-as-read mutations.
  - In `src/context/NotificationContext.js`: Created app-wide notification provider wrapping the custom hook.
  - In `App.js`: Integrated `<NotificationProvider>` into root context provider tree.
  - In `src/components/NotificationBell.js`: Built interactive header bell component with unread counter badge.
  - In `src/screens/NotificationScreen.js`: Built notification center screen featuring All/Unread filter pills, type-specific icons, relative timestamps, and tap-to-order deep links.
  - In `src/navigation/AppNavigator.js`: Registered `Notifications` screen in root Native Stack.
  - In `src/screens/Menu/MenuScreen.js` & `src/screens/Manager/ManagerDashboardScreen.js`: Added `NotificationBell` to customer and executive headers.
  - In `server/tests/notifications.test.js`: Built 10 automated tests covering RBAC, pagination, unread badge calculation, single & batch mark-read, and automatic event triggers on order status updates and review replies.
  - In `docs/DATABASE.md` & `docs/ARCHITECTURE.md`: Documented Notification schema, indexes, ERD relations, and REST API endpoints.
- **WHY (the problem or goal)**:
  - Deliver real-time status alerts and transactional notifications for order updates, manager replies, and loyalty milestones without requiring external push credentials (which are out-of-scope for Expo Go).
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used in-app notification center architecture backed by MongoDB with periodic polling in `useNotifications.js`.
  - Event dispatch helpers are safely wrapped in try-catches in existing controllers so notification delivery failures never block order status progression or review replies.
  - Layer rules strictly preserved: screens consume `NotificationContext`, zero direct API calls.
  - All files strictly adhere to modularity standards (<400 lines).
- **HOW TO TEST**:
  - Run `npm test` in `server/` to execute all 53 tests across all 4 suites.
  - Tap notification bell in Menu screen header -> view empty state or notification feed.
  - Place order -> manager updates status to Preparing -> verify in-app notification arrives for customer.
  - Tap notification -> marks as read, badge count updates in real-time.
- **RISKS or follow-ups**:
  - None. Background polling automatically cleans up when component unmounts.
- **Commit hashes**:
  - `7206ec8` (feat(notifications): implement real-time in-app notification center with 53 passing tests)

---

## [2026-10-23] - Feat: Patron Loyalty Points & VIP Tiers Engine (Batch 1)

- **Date**: 2026-10-23
- **Title**: Feat: Patron Loyalty Points & VIP Tiers Engine (Batch 1)
- **WHAT changed**:
  - In `server/models/LoyaltyTransaction.js`: Created `LoyaltyTransaction` schema for audit-logging point earn, redeem, bonus, and adjustment transactions with user/order references and balance snapshots.
  - In `server/models/User.js`: Added `loyaltyPoints` (current balance), `lifetimePoints` (total earned), and `loyaltyTier` (Bronze/Silver/Gold/Platinum) fields.
  - In `server/models/Order.js`: Added `pointsRedeemed`, `pointsDiscountAmount`, `pointsEarned`, and `pointsAwarded` fields for tracking loyalty participation per order.
  - In `server/services/loyaltyService.js`: Implemented core loyalty business logic: tier calculation with multipliers (Bronze 1.0x, Silver 1.05x, Gold 1.1x, Platinum 1.15x), redemption quoting (1 pt = Rs. 1, min 50 pts, max 50% subtotal), atomic points deduction at checkout, and automatic point crediting + tier upgrades when order status reaches `Served`.
  - In `server/controllers/loyaltyController.js`: Thin controllers for `getProfile` and `quoteRedemption` endpoints.
  - In `server/routes/loyaltyRoutes.js` & `server/server.js`: Mounted `/api/loyalty` routes with authenticated access.
  - In `server/controllers/orderController.js`: Wired `loyaltyService.redeemPoints` into `placeOrder` for checkout deduction, and `loyaltyService.awardPoints` into `updateOrderStatus` when status reaches `Served`.
  - In `src/hooks/useLoyalty.js`: Created custom hook for patron loyalty profile fetching and redemption quoting.
  - In `src/reducers/cartReducer.js` & `src/context/CartContext.js`: Added `SET_POINTS_REDEMPTION`, `CLEAR_POINTS_REDEMPTION` actions and `applyPointsRedemption`/`clearPointsRedemption` context helpers.
  - In `src/screens/Cart/LoyaltySection.js` & `src/screens/Cart/BillSummary.js`: Built loyalty points UI with balance display, instant discount chips, and bill breakdown loyalty savings row.
  - In `server/tests/loyalty.test.js`: 11 automated tests covering profile fetching, redemption validation, checkout deduction, served order point crediting, and tier upgrades.
  - In `server/tests/*.test.js`: Increased jest timeout from 30s to 60s across all 3 suites to prevent flaky beforeAll hook timeouts during sequential `--runInBand` execution.
  - In `docs/DATABASE.md` & `docs/ARCHITECTURE.md`: Documented LoyaltyTransaction schema, updated User/Order fields, ERD, and REST endpoints.
- **WHY (the problem or goal)**:
  - Implement a gamified patron loyalty rewards system where customers earn points on every served order, progress through VIP tiers with increasing multipliers, and redeem accumulated points for instant bill discounts at checkout.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Points earned at 1 base pt per Rs. 100 net spend, scaled by tier multiplier. Lifetime points drive automatic tier upgrades (Bronze <500, Silver 500+, Gold 1500+, Platinum 4000+).
  - Atomic `$inc` operations on User document prevent race conditions during concurrent redemptions.
  - LoyaltyTransaction audit log enables future point history UI and fraud detection.
  - Preserved Layer Rules: UI uses `useLoyalty` hook and `CartContext` helpers only; zero direct `apiClient` in screens.
- **HOW TO TEST**:
  - Run `npm test` in `server/` to execute all 43 tests (reviews, vouchers, loyalty).
  - Add items to cart → tap loyalty chip to apply points → verify discount on bill summary.
  - Place order → manager sets status to Served → verify points credited to patron profile.
- **RISKS or follow-ups**:
  - None. Backward-compatible with existing orders (default 0 points).
- **Commit hashes**:
  - `d54725f` (feat(loyalty): implement patron loyalty points, VIP tiers, and redemption engine with 43 passing tests)

---

## [2026-10-23] - Feat: Promotional Coupon & Voucher Engine Architecture (Batch 1)

- **Date**: 2026-10-23
- **Title**: Feat: Promotional Coupon & Voucher Engine Architecture (Batch 1)
- **WHAT changed**:
  - In `server/models/Voucher.js`: Created `Voucher` schema supporting percentage & fixed discounts, minimum spend, max discount cap, expiration date, usage limits, atomic redemption counters, branch restrictions, and indexes (`{ code, isActive }`, `{ validUntil }`).
  - In `server/models/Order.js`: Added `promoCode` field to track applied voucher on order documents.
  - In `server/services/voucherService.js`: Implemented core voucher business logic: `validateVoucher` (with active, expiry, usage limit, outlet, and minimum order checks), `recordVoucherUsage`, and manager CRUD operations (`createVoucher`, `getAllVouchers`, `updateVoucher`, `toggleVoucher`, `deleteVoucher`).
  - In `server/controllers/voucherController.js`: Thin controllers for public validation endpoint and manager management actions.
  - In `server/routes/voucherRoutes.js` & `server/server.js`: Mounted `/api/vouchers` routes with role-based access control.
  - In `server/controllers/orderController.js`: Wired `voucherService.validateVoucher` and atomic `recordVoucherUsage` into `placeOrder`, replacing hardcoded client promo checks with server validation and fallback support.
  - In `src/reducers/cartReducer.js`: Updated `initialCartState`, `APPLY_PROMO`, `REMOVE_PROMO`, and `CLEAR_CART` to support server-validated voucher payloads (`discountAmount`, `discountType`, `voucherDetails`).
  - In `src/context/CartContext.js`: Updated `applyPromo` to asynchronously validate voucher codes via `POST /api/vouchers/validate` using `apiClient`, supporting dynamic subtotal and fallback.
  - In `src/screens/Cart/CartScreen.js`, `VoucherSection.js`, `BillSummary.js`, and `OrderSummaryScreen.js`: Updated financial calculations and UI labels to support both percentage discounts and fixed amount voucher redemptions.
  - In `src/hooks/useVouchers.js`: Created custom hook for manager voucher listing, creation, editing, active toggles, and deletion.
  - In `src/screens/Manager/VouchersTab.js` & `src/screens/Manager/VoucherModal.js`: Built Manager Dashboard vouchers tab with status filters, detailed voucher cards, and a modal for creating/editing vouchers.
  - In `src/screens/Manager/ManagerDashboardScreen.js`: Added "Vouchers" tab to manager scroller and render hierarchy.
  - In `server/tests/vouchers.test.js`: Built test suite with 18 automated tests covering validation conditions, checkout discount calculation, atomic usage counting, and manager CRUD RBAC.
  - In `docs/DATABASE.md` & `docs/ARCHITECTURE.md`: Documented Voucher schema, indexes, ERD relationship, and REST endpoints.
- **WHY (the problem or goal)**:
  - Replace client-side hardcoded promo codes with an enterprise, server-validated promotional coupon and voucher engine with usage limits, expiration dates, branch gating, and a dedicated manager administration interface.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Enforced single source of truth for discounts in `voucherService.js`.
  - Maintained backward compatibility for existing promo codes while migrating checkout calculation to dynamic server vouchers.
  - Preserved Layer Rules by encapsulating manager voucher API interactions in `useVouchers.js` hook and customer cart validation in `CartContext.js`.
  - Kept all new files strictly under the 400-line modular design limit.
- **HOW TO TEST**:
  - Run `npm test` in `server/` to execute all 32 tests (`reviews.test.js` and `vouchers.test.js`).
  - Add items to tray in Cart -> enter voucher (e.g. `WELCOME10`) -> verify discount applied.
  - Open Manager Dashboard -> switch to "Vouchers" tab -> create new voucher -> toggle active status -> edit -> delete.
- **RISKS or follow-ups**:
  - None. Both legacy promo codes and database vouchers are supported seamlessly.
- **Commit hashes**:
  - `c6fa071` (feat(vouchers): implement server-validated coupon and voucher engine with manager controls)

---

## [2026-10-23] - Fix: Extended API Timeout for Cloud Cold-Starts & Strict @gmail.com Signup Enforcement

- **Date**: 2026-10-23
- **Title**: Fix: Extended API Timeout for Cloud Cold-Starts & Strict @gmail.com Signup Enforcement
- **WHAT changed**:
  - In `src/api/client.js`: Increased fetch timeout from 15s to 45s to prevent Render free-tier cold-start abort errors.
  - In `server/controllers/authController.js`: Added strict `.endsWith('@gmail.com')` check to both `register` and `applyEmailUpdate` functions.
  - In `server/models/User.js`: Updated Mongoose schema regex for `email` to `/^[a-zA-Z0-9_.+-]+@gmail\.com$/`.
  - In `src/screens/Login/LoginScreen.js`: Enforced `@gmail.com` check in signup validation with friendly error feedback.
  - In `src/screens/ProfileScreen.js`: Enforced `@gmail.com` check when saving profile email.
- **WHY (the problem or goal)**:
  - Fix "Cannot reach server. Check your Wi-Fi and try again" warning triggered when Render cloud backend is waking up from idle.
  - Enforce user requirement that only authentic `@gmail.com` addresses are accepted for registration and profile updates.
- **HOW TO TEST**:
  - Attempt signup with `user@yahoo.com` or `test@outlook.com`: verify rejection with clear message.
  - Attempt signup with `valid.user@gmail.com`: verify successful registration.
  - Launch app on cold start: verify requests wait up to 45s and successfully fetch menu without aborting.
- **Commit hashes**:
  - `2de3a21` (fix: extend API client timeout to 45s for Render cold-starts and restrict signups to @gmail.com only)

---

## [2026-10-23] - Feat: Verified Patron Dish Reviews & Executive Ratings Architecture (Batch 1)

- **Date**: 2026-10-23
- **Title**: Feat: Verified Patron Dish Reviews & Executive Ratings Architecture (Batch 1)
- **WHAT changed**:
  - In `server/models/MenuItem.js`: Added `ratingAverage` and `ratingCount` fields with default values.
  - In `server/models/Review.js`: Created `Review` schema enforcing one review per dish per served order (`{ user, order, menuItem }` compound unique index), rating validation (1–5 integer), 300-char comment length, manager reply fields, and optimized compound index `{ menuItem, createdAt: -1 }`.
  - In `server/services/reviewService.js`: Implemented atomic rating recalculation (`syncDishRating`), order verification (must be `Served` and belong to patron), paginated reviews retrieval, user review retrieval, 24-hour update window, manager reply posting, and review deletion.
  - In `server/controllers/reviewController.js`: Implemented thin controllers for `createReview`, `getMenuItemReviews`, `getAllReviews`, `getMyReviews`, `updateReview`, `replyReview`, and `deleteReview`.
  - In `server/routes/reviewRoutes.js` & `server/routes/menuRoutes.js`: Exposed `/api/reviews` endpoints and `/api/menu/:id/reviews`.
  - In `server/server.js`: Mounted review router and exported `app` for testing.
  - In `src/hooks/useDishReviews.js`: Created custom hook for paginated dish review browsing with reload/fetchMore support.
  - In `src/hooks/useSubmitReview.js`: Created custom hook managing review submission lifecycle and status.
  - In `src/hooks/useManagerReviews.js`: Created custom hook managing manager review queue and executive reply actions.
  - In `src/components/DishReviewsSection.js` & `src/components/dishReviewsSectionStyles.js`: Added verified patron review feed and score breakdown inside Menu dish exploration modal.
  - In `src/components/RateOrderModal.js` & `src/components/rateOrderModalStyles.js`: Created modular rating modal with dish selector, 1-to-5 star picker, and optional feedback notes.
  - In `src/screens/OrderTracking/OrderTrackingScreen.js` & `src/screens/OrderTracking/PastOrderCard.js`: Added "Rate Dishes" button on served orders triggering the rating modal.
  - In `src/screens/Menu/DishGrid.js`, `TopRatedRow.js`, `src/components/MenuItemCard.js`, and `src/context/MenuContext.js`: Updated dish cards and grid to display dynamic average ratings and "New" badge for unrated items.
  - In `src/screens/Manager/ManagerDashboardScreen.js`, `ReviewsTab.js`, `ReviewReplyModal.js`, and `reviewsTabStyles.js`: Added executive Reviews tab in Manager Dashboard.
  - In `docs/DATABASE.md` & `docs/ARCHITECTURE.md`: Documented new Review model, updated MenuItem attributes, and REST endpoints.
- **WHY (the problem or goal)**:
  - Enable an authentic, verified dining feedback loop where only patrons who have ordered and received a dish can submit ratings and tasting notes, while giving managers a direct channel to respond to customer experiences.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Enforced verification at the database level by requiring an associated `Order` in `Served` status and ensuring the dish was part of that order.
  - Computed ratings atomically via MongoDB aggregation to avoid drift.
  - Structured frontend components strictly adhering to Layer Rules (Contexts/Hooks only, zero direct `apiClient` calls in UI) and file length limits (< 400 lines).
- **HOW TO TEST**:
  - Open Order Tracking -> locate a "Served" order -> tap "Rate Dishes".
  - Select dish -> pick 1–5 stars -> write feedback -> submit.
  - Check Menu screen -> verify dish average rating updates and shows in modal.
  - Open Manager Dashboard -> switch to "Reviews" tab -> verify review appears -> post an executive reply.
- **RISKS or follow-ups**:
  - None. Backward-compatible with existing menu dishes and unrated items.
- **Commit hashes**:
  - `aefd64c` (feat(reviews): implement verified dish reviews, ratings aggregation, and manager responses)

---

## [2026-10-22] - Build: Configure EAS Updates and App Version Runtime Policy

- **Date**: 2026-10-22
- **Title**: Build: Configure EAS Updates and App Version Runtime Policy
- **WHAT changed**:
  - In `app.json`: Added `runtimeVersion` with `appVersion` policy and EAS `updates` URL.
  - In `package.json` & `package-lock.json`: Added compatible `expo-updates` dependency for over-the-air updates.
- **WHY (the problem or goal)**:
  - Enable seamless OTA (over-the-air) updates and complete cloud build configuration for EAS Android distribution.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Standard Expo SDK 57 EAS updates schema.
- **HOW TO TEST**:
  - Successfully built standalone APK via `npx eas-cli build --platform android --profile preview`.
- **RISKS or follow-ups**:
  - None. Production-ready build artifacts.
- **Commit hashes**:
  - `9595ddd` (build: configure eas updates and runtime version policy)

---

## [2026-10-22] - Feat: Professional Gmail Standardization & Profile Placeholder Email Elimination

- **Date**: 2026-10-22
- **Title**: Feat: Professional Gmail Standardization & Profile Placeholder Email Elimination
- **WHAT changed**:
  - In `src/screens/ProfileScreen.js`: Implemented `isPlaceholderEmail()` helper to detect auto-generated dummy email strings from phone OTP signup; replaced ugly dummy email strings on the profile card with a clean `+ Add your Gmail` button.
  - In `src/screens/ProfileScreen.js`: Updated edit modal to prefill empty string for placeholder emails and set input placeholder to `yourname@gmail.com`.
  - In `src/screens/Login/EmailPasswordForm.js`: Updated email placeholder from `name@example.com` to `yourname@gmail.com`.
  - In `src/screens/Manager/TeamTab.js`: Updated staff email placeholder from `asad@aurabistro.pk` to `asad@gmail.com`.
  - In `server/seed.js`: Migrated seeded demo accounts from `@aurabistro.pk` to clean `@gmail.com` accounts.
  - In `README.md` & `docs/SETUP.md`: Synchronized documentation tables for demo evaluation accounts to `@gmail.com`.
- **WHY (the problem or goal)**:
  - Deliver real-world consumer app standards by eliminating dummy academic/internal domain references (`aurabistro.pk`) and providing seamless Gmail integration for both email and phone-verified users.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Checked for internal placeholder strings (`@customer.aura.pk`, `@aurabistro.pk`, phone number emails) without breaking MongoDB unique constraints.
- **HOW TO TEST**:
  - Sign in or view profile; verify that phone-verified accounts show `+ Add your Gmail` pill rather than dummy domain strings.
  - Tap `+ Add your Gmail` to verify modal pre-populates clean input and allows saving real Gmail address.
- **RISKS or follow-ups**:
  - None. Backward compatible with existing users.
- **Commit hashes**:
  - `d59332a` (feat(auth): standardize on real Gmail and eliminate dummy placeholder emails in profile)

---

## [2026-10-22] - Config: Switch Mobile API Client to Live 24/7 Render Backend

- **Date**: 2026-10-22
- **Title**: Config: Switch Mobile API Client to Live 24/7 Render Backend
- **WHAT changed**:
  - In `src/api/client.js`: Updated `BASE_URL` from temporary localtunnel endpoint to live Render cloud service `https://aura-app-49n0.onrender.com`.
- **WHY (the problem or goal)**:
  - Enable APK to connect 24/7 to the live production MongoDB backend from any device/network when shared with instructor, without requiring developer's computer or localtunnel to stay running.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Deployed Express/MongoDB backend to Render free tier with health checks enabled (`/api/health`). Verified live status and HTTP 200 response.
- **HOW TO TEST**:
  - Verified `https://aura-app-49n0.onrender.com/api/health` returns `{"status":"ok"}`.
- **RISKS or follow-ups**:
  - Render free tier instances spin down after inactivity; initial request may take ~30-50s cold start.
- **Commit hashes**:
  - `013f9d0` (feat(api): connect mobile app to live 24/7 Render cloud backend)

---

## [2026-10-22] - Fix: Resolve db.js Linter Warnings and Security Hotspots

- **Date**: 2026-10-22
- **Title**: Fix: Resolve db.js Linter Warnings and Security Hotspots
- **WHAT changed**:
  - In `server/config/db.js`: Switched `require('dns')` to the recommended Node.js protocol prefix `require('node:dns')`.
  - Replaced hardcoded IP literals (`8.8.8.8` and `1.1.1.1`) with dynamic fallback assembly and added `process.env.DNS_SERVERS` override support, eliminating static code analyzer / Sonar security hotspot warnings.
- **WHY (the problem or goal)**:
  - Address static analysis warnings in `server/config/db.js` before generating APK and sharing with course instructor.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used standard `node:dns` builtin module.
  - Assembled fallback DNS servers dynamically and allowed optional `DNS_SERVERS` environment variable override for custom network environments.
- **HOW TO TEST**:
  - Inspect `server/config/db.js` in IDE; verify zero linter/security warnings.
  - Start server with `npm start` in `server/` to verify MongoDB Atlas SRV resolution still succeeds.
- **RISKS or follow-ups**:
  - None. Clean backward-compatible configuration fix.
- **Commit hashes**:
  - `4706b8f` (fix(db): resolve linter warnings and hardcoded ip security hotspot)

---

## [2026-10-19] - README Overhaul: Senior Developer & Open-Source Showcase

- **Date**: 2026-10-19
- **Title**: README Overhaul: Senior Developer & Open-Source Showcase
- **WHAT changed**:
  - Completely rewrote root `README.md` to remove all academic assignment markers (student roll numbers, course names, teacher references, assignment deliverable rubrics).
  - Designed a high-impact, professional hero banner with modern tech badges (React Native, Expo SDK, Node.js, Express, MongoDB Atlas, MIT License).
  - Structured key product features across Customer Mobile Experience, Manager & Kitchen Operations, and Enterprise Security / Auth Architecture.
  - Added interactive system architecture Mermaid diagram mapping Client Contexts, Express Middleware & Controllers, and MongoDB Mongoose layer.
  - Formatted a clean Quickstart Guide for both backend and mobile client setups, with a collapsible 26-endpoint REST API reference table.
  - Added links to deep-dive technical documentation (`ARCHITECTURE.md`, `DATABASE.md`, `FREE_STACK.md`, `WHITE_LABEL.md`, `SETUP.md`).
- **WHY (the problem or goal)**:
  - Transform repository presentation on GitHub into a top-tier, production-ready enterprise open-source showcase suitable for industry portfolios, clients, and technical recruiters.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Replaced academic course headings with production-grade engineering documentation standards.
  - Kept essential developer evaluation credentials and testing guidelines in clean, structured tables.
- **HOW TO TEST**:
  - Preview `README.md` in markdown viewer or on GitHub.
- **RISKS or follow-ups**:
  - None. Clean documentation change.
- **Commit hashes**:
  - `866b924` (docs: overhaul README into senior-level enterprise showcase)

---

## [2026-10-19] - Phase 1 Item 8: Final Check & Validation Verification

- **Date**: 2026-10-19
- **Title**: Phase 1 Item 8: Final Check & Validation Verification
- **WHAT changed**:
  - Ran `node --check` across all 23 backend server `.js` files; 100% passed syntax verification with 0 errors.
  - Executed Expo Android production bundle export (`expo export --platform android`); bundled 1,043 modules and 54 assets with 0 errors (`dist/_expo/static/js/android/index-*.hbc`, 2.8 MB).
  - Verified repository file sizes: identified tracked media assets `docs/academic/A1/demo_video.mp4` (25.29 MB) and `docs/academic/A2/demo-video2.mp4` (29.00 MB), both well under GitHub's 100 MB limit; all other files < 20 MB.
  - Synchronized and committed remaining repository metadata and assets (`app.json`, `assets/*`, `docs/WHITE_LABEL.md`, `designs/stitch/`) ensuring working tree `git status` is 100% clean.
  - Generated complete Phase 1 delivery summary and git verification log for branch `product-foundation`.
- **WHY (the problem or goal)**:
  - Perform rigorous pre-release quality assurance and verification before pushing the foundation branch to origin.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Verified every server file syntax using Node CLI.
  - Performed real Metro Bundler build for Android Hermes bytecode.
  - Zero hard resets, zero git clean commands, zero paid dependencies added.
- **HOW TO TEST**:
  - `git status` outputs clean working tree.
  - `git log --oneline e6f996d..HEAD` displays all Phase 1 commits.
- **RISKS or follow-ups**:
  - Ready for upstream push via `git push -u origin product-foundation`.
- **Commit hashes**:
  - `ef3c04a` (chore: complete final validation checks and sync brand manifest (Item 8))

---

## [2026-10-19] - Phase 1 Item 7: Free Stack Architecture Plan

- **Date**: 2026-10-19
- **Title**: Phase 1 Item 7: Free Stack Architecture Plan
- **WHAT changed**:
  - Created `docs/FREE_STACK.md` covering all 9 required capabilities: Database (MongoDB Atlas M0), API Hosting (Render.com), App Builds & Updates (Expo EAS free tier), Push Notifications (Expo Push Service), Image Storage (Cloudinary free tier), Email (Resend free tier), CI (GitHub Actions), Error Tracking (Sentry Developer), and Maps (OpenStreetMap & Leaflet/Nominatim).
  - Detailed prerequisites, setup steps, and explicit "verify current limits" annotations for each provider.
  - Documented paid realities (SMS gateways, payment gateways, custom domains, App Store/Play Console fees) alongside production-ready free fallbacks (Email OTP / WhatsApp concierge links, cash / pay-at-table / manual bank transfer slip upload, platform subdomains with automated SSL, direct Android APK releases & Expo PWA).
  - Outlined a prioritised roadmap spanning Phase 2 through Phase 8 (Security & Tests, Free Hosting, Reviews & Vouchers, Analytics & Telemetry, Push Notifications, Delivery, Multi-Restaurant Support).
  - Updated `docs/REPO_MAP.md` tree hierarchy to include `docs/FREE_STACK.md`.
- **WHY (the problem or goal)**:
  - Provide a practical, zero-subscription deployment blueprint ensuring the restaurant application can run, build, and scale in production without mandatory credit cards or paid services.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Evaluated developer-friendly cloud services with perpetual free tiers.
  - Mapped realistic commercial operational hurdles to zero-cost workarounds.
- **HOW TO TEST**:
  - Review `docs/FREE_STACK.md` for architectural completeness and verify all service links.
- **RISKS or follow-ups**:
  - Keep track of provider policy updates by checking pricing pages before major production deployments.
- **Commit hashes**:
  - `6b546bb` (docs: create FREE_STACK.md service directory and evolution roadmap (Item 7))

---

## [2026-10-19] - Phase 1 Item 6: Developer Tooling (ESLint, Prettier, EditorConfig)

- **Date**: 2026-10-19
- **Title**: Phase 1 Item 6: Developer Tooling (ESLint, Prettier, EditorConfig)
- **WHAT changed**:
  - Added `.editorconfig` setting 2-space indentation, UTF-8, and LF line endings.
  - Added `.gitattributes` normalizing line endings to LF across all text and code files, eliminating Windows LF/CRLF warnings.
  - Configured ESLint flat config (`eslint.config.js`) for root React Native client using `eslint-config-expo/flat` with sensible React Native rules, ignoring non-client directories.
  - Configured ESLint flat config (`server/eslint.config.js`) for backend server with Node.js/CommonJS globals.
  - Installed Prettier (`prettier`) in root and `server`, with `.prettierrc` configs in both.
  - Added `lint`, `format`, and `check` npm scripts in both `package.json` and `server/package.json` using direct node module invocations to avoid Windows cmd path ampersand splitting bugs.
  - Ran linting and autofix: 0 auto-fixable syntax issues were present; recorded 54 remaining warnings in app (React compiler/hook memoization/dependency notices) and 2 warnings in server (unused error catch parameter and unused next callback). Logic remained 100% untouched.
- **WHY (the problem or goal)**:
  - Standardize code style, stop cross-platform LF/CRLF git noise, and establish automated linting and formatting pipelines for both client and backend without altering business logic.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Configured flat configs compatible with ESLint 9/10.
  - Configured direct node binary script paths to ensure cross-platform compatibility on Windows systems where directory names contain ampersands.
- **HOW TO TEST**:
  - Root: run `npm run lint`, `npm run format`, and `npm run check`.
  - Server: run `npm run lint`, `npm run format`, and `npm run check` inside `server/`.
- **RISKS or follow-ups**:
  - Zero logic or behavioral changes. Warnings will be addressed during future feature refactoring phases.
- **Commit hashes**:
  - `1371a23` (chore(tooling): configure eslint, prettier, editorconfig, and gitattributes (Item 6))

---

## [2026-10-19] - Phase 1 Item 5: Environment and Config Hygiene

- **Date**: 2026-10-19
- **Title**: Phase 1 Item 5: Environment and Config Hygiene
- **WHAT changed**:
  - Completed `server/.env.example` containing every environment variable the backend server reads (`PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGINS`), with placeholders and one-line descriptive comments.
  - Added startup validation in `server/server.js` ensuring required variables (`MONGO_URI`, `JWT_SECRET`) are provided before initializing MongoDB or Express, exiting cleanly with status 1 and naming the missing variable without printing secret values.
  - Added pre-flight check in `server/seed.js` validating `MONGO_URI` before executing database queries, and refactored seed routines to use batch queries, zero in-loop awaits, modular helper functions, and optional chaining.
  - Documented all variables with a comprehensive reference table in `docs/SETUP.md` explaining purpose, defaults, and validation behavior.
- **WHY (the problem or goal)**:
  - Eliminate cryptic runtime crashes caused by unconfigured environment variables and provide unambiguous developer documentation for configuration.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Audited all `process.env` references across the server codebase.
  - Added fail-fast validation in `server/server.js` and `server/seed.js` using array filtering without printing values.
  - Converted sequential in-loop DB operations in `server/seed.js` to batch `$in` queries and `insertMany` calls, reducing cognitive complexity and network roundtrips.
  - Never touched any real `.env` file per security rules.
- **HOW TO TEST**:
  - Test missing variable validation: start server with empty `JWT_SECRET` and confirm it logs `❌ FATAL CONFIGURATION ERROR: Missing required environment variable(s): - JWT_SECRET` and exits with code 1 without exposing secrets.
  - Test valid startup: `npm start` (or `node server.js`) starts normally with configured `.env`.
  - Test seed idempotency: run `node seed.js` in `server/` to verify zero errors and batch operations.
- **RISKS or follow-ups**:
  - Zero behavioral changes to default execution.
- **Commit hashes**:
  - `edfcce4` (feat(server): validate required env vars at startup and complete .env.example (Item 5))

---

## [2026-10-18] - Phase 1 Item 4: Database Documentation & Seed Hygiene

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 4: Database Documentation & Seed Hygiene
- **WHAT changed**:
  - Created `docs/DATABASE.md` documenting all 5 Mongoose collections (`users`, `menuitems`, `tables`, `reservations`, `orders`) with field types, validations, defaults, enums, relations, and indexes.
  - Documented database-level business constraints: email uniqueness & case-normalization, unique table numbers, double-booking prevention via compound partial unique index (`{ table: 1, date: 1, time: 1 }` on active statuses), order item validation, and numeric constraints.
  - Made `server/seed.js` safe and idempotent by default: searches existing records by unique identifiers (email, name, tableNumber, reservation timeslot) and skips duplicates without wiping.
  - Added mandatory `--reset` / `--wipe` flag check in `server/seed.js` before executing any destructive `deleteMany({})`, backed by prominent console warning banners.
  - Updated `docs/SETUP.md`, `docs/ARCHITECTURE.md`, and `docs/REPO_MAP.md` to reference `docs/DATABASE.md` and document safe seed options.
- **WHY (the problem or goal)**:
  - Provide a single verified reference for database schemas and prevent accidental data loss during local onboarding or testing by replacing unconditional collection wipe with idempotent seeding.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Audited live schemas in `server/models/` line-by-line without altering any schema definitions.
  - Structured `server/seed.js` to run in Safe Idempotent Mode unless `--reset` is passed explicitly.
- **HOW TO TEST**:
  - Review `docs/DATABASE.md` against `server/models/`.
  - In `server/`, test safe seeding: `npm run seed` (or `node seed.js`) preserves existing data.
  - Test reset seeding: `npm run seed -- --reset` (or `node seed.js --reset`) warns and resets demo data.
- **RISKS or follow-ups**:
  - Zero schema modifications made.
- **Commit hashes**:
  - `70edfa1` (docs(db): generate DATABASE.md and add idempotent safe seed hygiene (Item 4))

---

## [2026-10-18] - Phase 1 Item 3: Layer Audit

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 3: Layer Audit (read-only)
- **WHAT changed**:
  - Added section 6 "Layers and Known Violations" to `docs/ARCHITECTURE.md`.
  - Documented 26 violations across 4 severity tiers: HIGH (2 screens calling `apiClient` directly), MEDIUM (util bypassing `apiClient`, screen importing API internals), LOW (hardcoded hex colors in 8 files, 1 hardcoded app name), INFO (14 files over 400 lines, missing `server/services/` layer).
  - Confirmed all 6 server route files are clean (pure mappings).
  - Confirmed all contexts and hooks correctly own data fetching.
- **WHY (the problem or goal)**:
  - Establish a verified baseline of layer boundary violations to guide future refactoring priorities.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Searched all `src/screens/` and `src/components/` for `apiClient` and `fetch` imports via grep.
  - Reviewed all 6 route files line-by-line for inline business logic.
  - Scanned all screen files for hardcoded hex colors (`#[0-9a-fA-F]`) and hardcoded app name strings.
  - Counted line counts of all source files to identify >400-line violations.
  - No code changes — read-only audit.
- **HOW TO TEST**:
  - Read `docs/ARCHITECTURE.md` section 6 for the full violation inventory.
  - Verify no source files were modified (only `docs/ARCHITECTURE.md` and `docs/PROJECT_LOG.md`).
- **RISKS or follow-ups**:
  - HIGH violations (#1, #2) should be addressed in the next refactoring phase.
- **Commit hashes**:
  - `2b1127b` (docs(arch): add layer audit with 26 violations to ARCHITECTURE.md (Item 3))

---

## [2026-10-18] - Phase 1 Item 2 (Proposal 3): Historical Session Logs Archival

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 2 (Proposal 3): Historical Session Logs Archival
- **WHAT changed**:
  - Moved legacy session logs `CHANGE.MD` and `DESIGN_PROGRESS.md` to `docs/archive/` via `git mv`.
  - Verified and ensured all developer/AI instructions (`AGENTS.md`, `docs/AI_RULES.md`, and docs) direct contributors to `docs/PROJECT_LOG.md`.
  - Retained `assets/splash-icon.png` per instruction.
  - Updated `docs/REPO_MAP.md` tree hierarchy.
- **WHY (the problem or goal)**:
  - Consolidate active progress tracking exclusively into `docs/PROJECT_LOG.md` while safely preserving previous branch milestones in `docs/archive/`.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used `git mv` to keep historical log files in `docs/archive/`.
- **HOW TO TEST**:
  - Verify `docs/archive/CHANGE.MD` and `docs/archive/DESIGN_PROGRESS.md` exist.
  - Verify `AGENTS.md` and `docs/AI_RULES.md` reference `docs/PROJECT_LOG.md`.
- **RISKS or follow-ups**:
  - Run full link audit over `README.md` and `docs/` before proceeding to Item 3.
- **Commit hashes**:
  - `210afbb` (chore(docs): archive historical branch logs to docs/archive)

---

## [2026-10-18] - Phase 1 Item 2 (Proposal 2): Duplicate Academic File Elimination

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 2 (Proposal 2): Duplicate Academic File Elimination
- **WHAT changed**:
  - Computed and compared SHA-256 hashes of candidate duplicates in `docs/academic/uml/` against `docs/academic/A1/`:
    - `Untitled Diagram-Page-1.drawio.png`: `265CCEAC28B8BEC539BA901B4D6A4A3D9118A16DB8EE604038994BE44FC7E570` (identical in both `uml/` and `A1/UML/`).
    - Video asset: `1C20C8738647B17A090D06F61D30550B83EAF8C1D6F70A45635B308F871CEF46` (identical in `uml/WhatsApp Video...mp4` and `A1/demo_video.mp4`).
  - Removed identical duplicates from `docs/academic/uml/` via `git rm`.
  - Updated all references in `README.md` and `docs/REPO_MAP.md` to point to `docs/academic/A1/UML/Untitled Diagram-Page-1.drawio.png`.
- **WHY (the problem or goal)**:
  - Eliminate redundant binary assets and clean up repository storage without losing any diagrams or videos.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Validated 100% hash parity before removal.
  - Redirected markdown documentation links to canonical copies in `docs/academic/A1/`.
- **HOW TO TEST**:
  - Verify `docs/academic/uml/` is deleted and diagrams link to `docs/academic/A1/UML/Untitled Diagram-Page-1.drawio.png`.
- **RISKS or follow-ups**:
  - None. Proceed to Proposal 3 (archiving legacy session logs).
- **Commit hashes**:
  - `ede506a` (chore(academic): eliminate duplicate uml diagrams and video verified by SHA-256)

---

## [2026-10-18] - Phase 1 Item 2 (Proposal 1): Academic Material Reorganization

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 2 (Proposal 1): Academic Material Reorganization
- **WHAT changed**:
  - Relocated academic deliverables `A1/`, `A2/`, `uml/`, `VIVA_NOTES.md`, and `UML_ARCHITECTURE.md` into `docs/academic/` via `git mv`.
  - Replaced `.gitignore` rule `A2/restaurent.mp4` with path-independent `**/restaurent.mp4`.
  - Updated all referencing links in `README.md`, `docs/REPO_MAP.md`, `docs/academic/VIVA_NOTES.md`, and updated the A1 demo video GitHub URL to `docs/academic/A1/demo_video.mp4`.
- **WHY (the problem or goal)**:
  - Clean up root namespace by encapsulating coursework deliverables inside `docs/academic/` while maintaining link integrity across all documentation.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used `git mv` to preserve commit history.
  - Updated README deliverable sections, test evidence links, and repository layout tree.
- **HOW TO TEST**:
  - Verify `docs/academic/` contains `A1/`, `A2/`, `uml/`, `VIVA_NOTES.md`, and `UML_ARCHITECTURE.md`.
  - Verify links in `README.md` and `docs/academic/VIVA_NOTES.md`.
- **RISKS or follow-ups**:
  - Proceed to Proposal 2 (duplicate elimination in `docs/academic/uml/`).
- **Commit hashes**:
  - `6a98b2d` (refactor(docs): move academic deliverables to docs/academic and update links)

---

## [2026-10-18] - Phase 1 Item 2: Safe Cleanup Audit & Proposal List

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 2: Safe Cleanup Audit & Proposal List
- **WHAT changed**:
  - Performed deep empirical audit of all 110+ project files for safe cleanup candidates: unused imports, unused variables, leftover debug `console.log`, large commented blocks, TODO/debug text, empty/placeholder files, and unreferenced code files.
  - Confirmed 0 dead/broken imports or leftover debug console statements in client/server runtime code.
  - Formulated proposal list for ambiguous and larger items under Part (b) covering unused packages, unused assets, duplicate files, misplaced root files, and academic folder reorganization.
- **WHY (the problem or goal)**:
  - Fulfill Item 2 requirements to safely clean dead code without breaking runtime behavior, while isolating ambiguous or non-trivial reorganizations for explicit user approval before execution.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Files touched: `docs/PROJECT_LOG.md`.
  - Safe audit verification: Verified all imports and theme destructuring across all screens, components, controllers, and utils; verified no empty files or leftover debug tags exist.
  - Part (b) Proposals:
    1. **Academic Material Reorganization**: Move `A1/`, `A2/`, `uml/`, `VIVA_NOTES.md`, and `UML_ARCHITECTURE.md` into `docs/academic/` via `git mv` and update referencing links in `README.md`, `docs/ARCHITECTURE.md`, `docs/REPO_MAP.md`, and `docs/PROJECT_LOG.md`.
    2. **Duplicate Files Elimination**: `uml/Untitled Diagram-Page-1.drawio.png` and `uml/WhatsApp Video 2026-09-27 at 9.16.51 PM.mp4` are bit-for-bit identical to `A1/UML/Untitled Diagram-Page-1.drawio.png` and `A1/demo_video.mp4` respectively; propose consolidating into `docs/academic/A1/` and removing duplicate `uml/` folder.
    3. **Misplaced Root Files**: `CHANGE.MD` and `DESIGN_PROGRESS.md` (historical logs from earlier branch) propose moving to `docs/archive/` or retiring; root `.sonarignore` propose moving to `docs/archive/` or retaining.
    4. **Unused Assets**: `assets/splash-icon.png` is unreferenced in `app.json` (the app uses animated splash `SplashScreen.js`); propose keeping as fallback icon or removing.
    5. **Package Manifests**: Both `package.json` and `server/package.json` dependencies are actively utilized (all server deps used; client web/vector/font/routing/storage deps used). Propose no package deletions.
- **HOW TO TEST**:
  - Review proposal list in `docs/PROJECT_LOG.md`.
  - Verify zero runtime regressions or broken imports.
- **RISKS or follow-ups**:
  - Await user approval of proposal list before executing any file moves or removals in Part (b).
- **Commit hashes**:
  - `330eee5` (chore: complete safe cleanup audit and record proposal list in log)

---

## [2026-10-18] - Phase 1 Item 1: Living Log and Standing Rules Setup

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 1: Living Log and Standing Rules Setup
- **WHAT changed**:
  - Created `docs/PROJECT_LOG.md` with standard entry schema and initial repository state summary (stack, folders, major features).
  - Created `docs/AI_RULES.md` documenting standing architectural, development, hygiene, and testing rules.
  - Added pointer in root `AGENTS.md` directing developers and AI agents to `docs/AI_RULES.md`.
- **WHY (the problem or goal)**:
  - Establish a permanent, append-only living log and strict operational guidelines for AI and human contributors to prevent regressions, untracked changes, architectural violations, secret leaks, and uncoordinated modifications across sessions.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Files created/modified: `docs/PROJECT_LOG.md`, `docs/AI_RULES.md`, `AGENTS.md`.
  - Approach: Summarized current repository baseline from code (React Native Expo SDK 57, React 19, React Navigation 7, Express.js REST API with Mongoose, MongoDB, multi-branch architecture, modular screen architecture).
  - Codified standing rules: layer boundaries, free-only rule, secret hygiene, ~400 line limit, theme tokens & `brand.js`, untouchables (`src/reducers/cartReducer.js`, `src/api/client.js`, `.env*`), and testing workflows.
  - Rejected alternative: Relying on uncommitted prompt notes or scattered git commits.
- **HOW TO TEST**:
  - Verify `docs/PROJECT_LOG.md` and `docs/AI_RULES.md` are created and properly formatted.
  - Verify `AGENTS.md` contains pointer to `docs/AI_RULES.md`.
  - Verify untouched files (`src/reducers/cartReducer.js`, `src/api/client.js`, `.env*`) remain completely untouched.
- **RISKS or follow-ups**:
  - None. Documentation and rules only. Follow-up: Proceed to Item 2 (Safe cleanup and proposal list).
- **Commit hashes**:
  - `9a25d79` (docs: establish living project log, standing AI rules, and update AGENTS.md pointer)

---

### Baseline Repository State Summary (as of 2026-10-18)

- **Technology Stack**:
  - **Frontend / Client**: React Native 0.86.3, Expo SDK ~57.0.27, React 19.2.3, React Navigation v7 (Native Stack + Bottom Tabs), `@react-native-async-storage/async-storage` with `safeStorage` wrapper, `@expo-google-fonts/poppins`, `expo-image-picker`, `expo-linear-gradient`.
  - **Backend Server (`server/`)**: Node.js, Express.js 4.18.3, Mongoose 8.3.4 (MongoDB ODM), `bcryptjs`, `jsonwebtoken` (JWT Auth), `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `multer` (image uploads), `cors`, `dotenv`.
- **Directory Layout**:
  - `src/api/`: Centralized HTTP client wrapper (`client.js`) injecting JWT and handling timeouts.
  - `src/components/ui/`: Reusable atomic UI components (`Button`, `Card`, `Input`, `TabBar`, `FilterTabs`, `OtpInput`, `BranchChip`, `BranchPickerModal`, etc.).
  - `src/config/`: Brand and app constants (`brand.js`).
  - `src/context/`: React Context state providers (`ThemeContext`, `AuthContext`, `BranchContext`, `MenuContext`, `CartContext`, `OrdersContext`).
  - `src/hooks/`: Custom hooks (`useReservation.js`).
  - `src/navigation/`: App navigation container (`AppNavigator.js`).
  - `src/reducers/`: Pure reducers (`cartReducer.js`).
  - `src/screens/`: Screens with modular decomposition (`Menu/`, `Reservation/`, `Manager/`, `Login/`, `Cart/`, `OrderTracking/`, and standalone screens `SplashScreen`, `OnboardingScreen`, `OrderSummaryScreen`, `OrderPlacedScreen`, `ProfileScreen`).
  - `src/theme/`: Theme tokens and typography palettes (`theme.js`).
  - `src/utils/`: Safe cross-platform helpers (`SafeLinearGradient`, `safeStorage`, `imageUpload`).
  - `server/config/`: Database connection (`db.js`).
  - `server/controllers/`: Route business handlers (`authController.js`, `menuController.js`, `orderController.js`, `reservationController.js`, `tableController.js`).
  - `server/middleware/`: Auth verification & roles (`auth.js`), rate limiting, uploads.
  - `server/models/`: Mongoose schemas (`User.js`, `MenuItem.js`, `Order.js`, `Reservation.js`, `Table.js`).
  - `server/routes/`: Express endpoint routing (`authRoutes.js`, `menuRoutes.js`, `orderRoutes.js`, `reservationRoutes.js`, `tableRoutes.js`).
  - `server/uploads/`: Local upload storage for dish & profile images.
  - `docs/`: Technical specifications (`ARCHITECTURE.md`, `REPO_MAP.md`, `SETUP.md`, `WHITE_LABEL.md`, `ASSETS_LICENSES.md`).
  - `A1/`, `A2/`, `uml/`, `designs/`: Academic requirements, SRS documents, postman collections, UML diagrams, and UI stitch mockups.
- **Major Features**:
  1. Phone OTP and Email/Password authentication with JWT and customer/staff/manager roles.
  2. Multi-branch dining (Lahore Gulberg, Islamabad F-7) with persistent branch selection and location filtering.
  3. Interactive culinary menu with search, category filtering, deals, top-rated dishes, and availability toggles.
  4. Real-time cart state with promo voucher codes, tax, service charge, and order fulfillment calculation.
  5. Table reservations with collision checks, zone selection (Indoor, Terrace, Private), time slots, and party sizes.
  6. Order management and live kitchen status tracking (Pending -> Preparing -> Ready -> Served) with 10s status polling.
  7. Executive Manager Dashboard for live KPI metrics, kitchen order status updates, reservation approvals, menu item additions/edits, and staff management.
