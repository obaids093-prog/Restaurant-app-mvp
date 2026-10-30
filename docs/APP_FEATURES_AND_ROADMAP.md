# AURA Restaurant Application: Features Audit & Production Roadmap

> **Document Status**: Comprehensive Technical Audit & Production Roadmap (Post-Audit Verified)  
> **Application**: AURA Restaurant Mobile App (MVP to Commercial Grade)  
> **Tech Stack**: React Native (Expo SDK 57), Node.js, Express, MongoDB Atlas, Render Cloud  
> **Test Baseline**: 90/90 Automated Tests Passing across 9 Jest Test Suites  

---

## PART 1: Currently Implemented Features (Properly Working)

### 1. Authentication & User Security
- **Email & Password Authentication**: Restricted strictly to authentic `@gmail.com` accounts to eliminate fake disposable registrations.
- **Phone OTP Verification**: Integrated SMS OTP login/registration with internal non-conflicting account provisioning (`@customer.aura.pk`).
- **Hardware-Backed Token Security**: JWT tokens securely stored via `expo-secure-store` (iOS Keychain / Android Keystore) with automatic transparent migration from legacy `AsyncStorage` and web `localStorage` fallback.
- **Role-Based Access Control (RBAC)**: Clean separation between `customer` and `manager` permissions across APIs and UI screens.
- **Profile Initialization**: Automatic initials avatar generator (e.g. "Farhan Siddiqui" -> "FS") with profile info management.

### 2. Multi-Branch Operations
- **Multiple Outlets Supported**: Outlets in Lahore (Gulberg III) and Islamabad (Blue Area).
- **Interactive Branch Picker Modal**: Allows customers and managers to switch branches anytime from the top bar.
- **Branch-Aware Routing**: Menu availability, reservations, and order dispatch are linked to the selected branch.

### 3. Customer Menu & Interactive Food Catalog
- **Modern High-Density Design**: Refreshed to design-refresh-v2 Warm Coral aesthetics.
- **Real-Time Search Bar**: Debounced instant query search matching dish titles, tags, and ingredients.
- **Category Navigation**: Horizontal filter pills (`All`, `Starters`, `Mains`, `Desserts`, `Drinks`).
- **Advanced Dietary Filter Sheet**: Multi-select filters for *Halal*, *Vegetarian*, *Vegan*, *Gluten-Free*, *Dairy-Free*, and *Chef's Special*.
- **Price Range & Sorting**: Price slider and sorting by *Price: Low to High*, *Price: High to Low*, and *Top Rated*.
- **Chef's Pick Compact Banner**: Featured dish hero banner with 1-tap add to cart.
- **Dynamic "Deals For You" Ticker**: Shows live active promotional vouchers fetched directly from MongoDB Atlas `/api/vouchers/active` (auto-hides when empty).
- **Order Again Carousel**: Shows the customer's previous order history for 1-tap fast reordering.
- **Dish Detail Bottom Sheet**: Expandable dish view with verified customer ratings, full ingredient breakdown, and sold-out badges.
- **Sticky Mini-Cart Bar**: Floats at the bottom with live item counter and subtotal for instant cart access.
- **Zero-Rating Default**: Newly created dishes start cleanly with `ratingAverage: 0` and `ratingCount: 0`, displaying a "New" badge until verified customer reviews are submitted.

### 4. Cart, Discounts & Folio Billing
- **Cart Quantity Stepper**: Smooth item increment, decrement, and removal.
- **Order Fulfillment Selector**: Supports *Dine-In* (with table number), *Takeaway*, and *Curbside*.
- **Special Cooking Instructions**: Dedicated text field for culinary notes and allergy warnings.
- **Promotional Voucher Engine**: Server-side validated coupons (`/api/vouchers/validate`) with percentage or flat Rs. savings.
- **Loyalty Points Redemption**: Instant discount calculator (1 Pt = Rs. 1, up to 50% bill cap) with atomic MongoDB balance verification.
- **Cancellation Points Refund**: Automatically and atomically credits redeemed loyalty points back to customer balance if an order is cancelled.
- **Transparent Folio Breakdown**: Subtotal, Voucher Discount, Loyalty Savings, 5% Hospitality Service Charge, 15% Provincial Sales Tax (PRA / GST), and Grand Total.

### 5. Multi-Step Table Reservation Engine
- **Step 1 (When & Guests)**: 7-day horizontal calendar carousel, tactile 1-12 party size stepper, quick chips (`1`, `2`, `4`, `6`, `8+`), and 4 seating zones (*Indoor*, *Patio*, *Family*, *Booth*).
- **Step 2 (Pick Time)**: Lunch and Dinner slot grid with rush-hour occupancy warning badges.
- **Step 3 (Your Details & Review)**: Contact info auto-fill, occasion tags (*Birthday*, *Anniversary*, *Business*), and special requests.
- **Booking Confirmed Screen**: Visual success screen with booking reference code, date/time chips, branch details, and calendar action.
- **My Bookings Screen**: Active and Past reservation tabs with 1-tap cancellation.

### 6. Live Order Dispatch & Status Tracking
- **4-Stage Visual Stepper**: `Placed` -> `Preparing in Kitchen` -> `Ready for Serving` -> `Served / Completed`.
- **Live Dispatch Indicators**: Animated pulse status dot and real-time kitchen elapsed timer.
- **10-Minute Cancellation Window**: Enforces 10-minute kitchen preparation policy (`CANCEL_WINDOW_MINUTES = 10`) before order locks.
- **Polling Intervals**: Live HTTP polling every 10 seconds for order tracking and 20 seconds for notifications.
- **Cancellation Notifications**: Both manager cancellation and customer self-cancellation dispatch immediate in-app order status notifications.
- **Direct Restaurant Contact**: 1-tap direct phone call button to restaurant staff.

### 7. Verified Reviews & Reputation System
- **Verified Order Prerequisite**: Reviews can only be submitted for completed (`Served`) orders by the ordering customer.
- **Item Order Verification**: Rejects review submissions for dishes not included in the customer's order with a strict 400 error.
- **One Review Per Dish**: Prevents duplicate review spam per order and dish.
- **Automated Rating Aggregation**: MongoDB server recalculates dish average rating and review counts atomically.
- **Verified Customer Dish Reviews**: Star distribution bars (5★ to 1★) and customer comments on each dish.
- **Manager Official Replies**: Direct management responses visible on customer reviews with instant customer notifications.

### 8. VIP Loyalty & Rewards Tier Program
- **4 VIP Tiers**: Bronze (0-499 pts), Silver (500-1499 pts), Gold (1500-2999 pts), Platinum (3000+ pts).
- **Automated Earning**: Earn points on every completed order (1 pt per Rs. 100 spent x tier multiplier).
- **Atomic Concurrency Protection**: High-concurrency document locking prevents double-spending loyalty balances.
- **Refund on Cancellation**: Redeemed loyalty points are automatically returned upon order cancellation.
- **Ledger Tracking**: Full `LoyaltyTransaction` audit log.

### 9. In-App Notification Center
- **Notification Bell**: Live unread count badge in top header.
- **Notification Screen**: Dedicated feed with relative timestamps ("2m ago"), read/unread filters, and mark-all-read.
- **Auto-Sliding Toast Banner**: Floating top animated banner toast on new order updates.
- **Notice on Push Architecture**: Notifications currently operate via persistent MongoDB in-app database records polled via HTTP. Remote push gateway endpoints exist; physical push delivery requires an active EAS production build with Apple APNs and Google FCM credentials.

### 10. Restaurant Manager Operations Dashboard
- **Business Analytics (Overview Tab)**: Real-time revenue, total orders, average order value (AOV), and pending orders.
- **Time Range Switcher**: Filter analytics by *Today*, *Last 7 Days*, and *Last 30 Days*.
- **Hourly Rush Bar Chart**: Visualizes kitchen peak rush hours.
- **Top Dishes Leaderboard**: Ranking top dishes by units sold and revenue share.
- **Live Kitchen Dispatch (Orders Tab)**: Filter orders by status and advance status with 1 tap.
- **Reputation Console (Reviews Tab)**: View all customer reviews with sentiment tags and reply modal.
- **Promotions Manager (Vouchers Tab)**: Create, toggle active status, bulk deactivate demo vouchers, and preview customer ticket chips.

### 11. Code Quality & Technical Health
- **Dark & Light Mode**: Complete theme system with persistent theme caching.
- **Cold-Start Resilience**: 45s hard timeout limit, automatic single retry for timed-out GET requests, and animated "Waking up the server, please wait" banner when cold starts exceed 5s.
- **Photo Storage Architecture**: Uploaded dish photos leverage Cloudinary cloud object storage (free tier) with global CDN delivery and automatic WebP/AVIF transformation, while gracefully falling back to local server disk storage (`server/uploads/`) for local development without keys. Catalog images are delivered via Unsplash CDN.
- **Automated Tests**: Comprehensive automated test coverage across 10 Jest test suites (`auth`, `reviews`, `vouchers`, `loyalty`, `notifications`, `analytics`, `noHardcodedVouchers`, `clientColdStart`, `secureTokenStorage`, `cloudStorage`).
- **CI/CD Cloud Deployment**: Render cloud backend automatically syncing with GitHub repository.

---

## PART 2: High-Impact Features to Add (Real-World Commercial Roadmap)

To transform AURA from an academic MVP to an enterprise-grade food & dining application competing with platforms like **Foodpanda**, **McDonald's**, **Starbucks**, and **OpenTable**, the following features are recommended:

### 1. Online Payment Gateways & Digital Wallets (Priority: CRITICAL) — [COMPLETED]
- **Local Mobile Wallets**: Integrated **JazzCash** and **EasyPaisa** simulated payment sessions with 11-digit mobile validation (`03XX`), automatic autofill from profile, and simulated OTP verification.
- **Credit / Debit Cards & 3D-Secure**: Full card checkout supporting **Visa**, **Mastercard**, **Amex**, and **PayPak** with card brand auto-detection, formatted spacing, and interactive 3D Secure OTP verification modal (`OtpVerificationModal`).
- **Saved Cards Tokenization**: Backend tokenization service (`POST /api/payments/tokenize-card`) generating secure, masked token references (`tok_visa_...`) for frictionless 1-tap reorders.
- **Dynamic Settlement**: Unified settlement flow across Dine-in, Takeaway, and Delivery orders with instant digital receipt generation (`AURA-RCP-...`) and order payment state synchronization.

### 2. Real-Time WebSockets / Server-Sent Events (Priority: HIGH) — [COMPLETED]
- **Zero-Latency Updates**: Integrated **Socket.io** (`socketService.js`) with JWT handshake authentication, dedicated room routing (`user:<userId>`, `role:manager`, `order:<orderId>`), and sub-200ms live order status updates.
- **Client Socket Provider & State**: React Native `SocketProvider` and `useSocket` hook with automatic token injection, exponential backoff reconnection, AppState foreground detection, and graceful HTTP fallback.
- **Live Sync & Instant Notifications**: `OrdersContext` listens to `order:statusUpdated` and `order:new` for real-time order lists and KDS bump synchronization. `NotificationContext` displays instant in-app toasts on `notification:new`.
- **Live Connection Badge**: Animated pulsing status badge (`LiveSocketBadge.js`) integrated into Kitchen Display System and management views.
- **Test Coverage**: Comprehensive Jest test suite (`socket.test.js`) validating socket initialization, event emission, room targeting, and error guards.

### 3. Cloud Object Storage for Uploads (STATUS: IMPLEMENTED)
- **Permanent Asset Storage**: `cloudStorageService.js` integrates **Cloudinary** free tier with SHA-1 signing and automated WebP optimization (`f_auto,q_auto,w_800`), with seamless fallback to local disk storage. Dish images persist permanently across Render restarts.

### 4. Native Remote Push Notifications (Priority: HIGH) — [COMPLETED]
- **EAS Push Credentials & Continuous Native Generation**: Configured `expo-notifications` plugin in `app.json` with custom notification icon, brand gold accent (`#D4AF37`), and production build profiles in `eas.json`.
- **Client Push Token Lifecycle**: `pushNotificationService.js` and `NotificationContext.js` request system permissions, initialize high-priority notification channels (`aura-order-updates`, `default`), and automatically sync tokens with the backend on sign-in.
- **Backend Push Dispatch Gateway**: `pushNotificationService.js` dispatches HTTP payload batches to Expo's push service (`https://exp.host/--/api/v2/push/send`), pruning inactive device tokens on `DeviceNotRegistered` error receipts.
- **Automated Tests**: Verified via `server/tests/notifications.test.js` covering token registration, deduplication, user unregistration, and non-blocking delivery.

### 5. Live GPS Rider Tracking on Map (Priority: HIGH) — [COMPLETED]
- **Interactive Map**: Zero-dependency animated SVG/View radar canvas with road grid, pulsing restaurant origin beacon, destination customer pin, live bike rider ping, and breadcrumb route trajectory.
- **Dynamic Telemetry & ETA**: Backend telemetry service (`riderTrackingService.js`) with Bezier waypoint interpolation, Haversine distance, speed calculations, dynamic ETA countdown, and 4-second client polling hook (`useRiderTracking`).
- **Milestone & Rider Card**: 4-step progress stepper (Order Placed ➔ In Kitchen ➔ Rider Dispatched ➔ Arrived), destination address card, and rider profile card with direct Call/SMS actions.

### 6. Table QR-Code Dine-In Ordering (Priority: MEDIUM-HIGH) — [COMPLETED]
- **Camera QR Scanner & Standee Browser**: Integrated `TableQRScannerScreen` featuring simulated viewfinder with animated laser line, manual code input fallback, branch switcher (Lahore Gulberg & Islamabad Blue Area), and interactive acrylic standee browser (`TableStandeeCard`).
- **Auto-Locked Table & Deep Links**: Backend verification (`POST /api/tables/verify-qr`) parses custom URI deep links (`aura://table?branch=...&table=...`), JSON standee tags, and manual table identifiers with zero paid dependencies.
- **Dine-In Menu Routing**: Seamless one-tap transition from physical table scan directly into `MenuScreen` pre-loaded with seated table context. Accessible from both Menu header and Reservation screen.

### 7. Automated SMS & WhatsApp Order Updates & Digital Receipts (Priority: MEDIUM) — [COMPLETED]
- **WhatsApp Share Deep Links & E-Receipts**: Backend receipt service (`receiptService.js`) generates formatted WhatsApp messages with emojis, guest details, course breakdown, tax breakdown, and live tracking links (`GET /api/orders/:id/receipt`).
- **Interactive Share Sheet Modal**: `DigitalReceiptModal` displays a restaurant crest, itemized folio, 1-tap WhatsApp dispatch (`https://wa.me/?text=...`), native SMS link (`sms:?body=...`), and clipboard copy with animated toast.
- **Order Placement & Tracking Integration**: Direct triggers from both `OrderPlacedScreen` and `OrderTrackingScreen` / `PastOrderCard`.

### 8. Digital Kitchen Display System (KDS) Tablet Screen (Priority: MEDIUM) — [COMPLETED]
- **Chef Bump Rail & Tablet UI**: Modular `KitchenDisplayScreen` designed for 10-inch kitchen tablet rails with live digital time ticker, audio chime toggle, and station filters (`All Stations`, `Grill & Mains`, `Appetizers`, `Dessert & Pastry`, `Bar & Beverages`).
- **Color-Coded Aging Timers**: Real-time order age tracking (🟢 Green < 10m on-track, 🟡 Amber 10-20m attention, 🔴 Red > 20m rush delay alert) and load metrics bar.
- **1-Tap Bump Bar**: Direct state transitions (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Served`) synchronized directly with customer tracking via `OrdersContext` and `PATCH /api/orders/:id/status`.
- **Manager Integration**: Direct 1-tap launcher banner integrated in `OrdersTab`.

### 9. Social Sign-In & Biometrics (Priority: MEDIUM)
- **1-Tap Social Login**: "Sign in with Google" and "Sign in with Apple".
- **Biometric Security**: FaceID / Fingerprint unlocking for instant access without retyping passwords.

### 10. Ingredient-Level Inventory & Auto-Stock Management (Priority: MEDIUM) — [COMPLETED]
- **Automatic Stock Depletion**: `inventoryService.js` automatically decrements available portions (`stockCount`) and recipe raw ingredients (`Ingredient` schema) whenever a customer order is placed or cooked.
- **Auto Sold-Out Protection**: When a dish's portion count reaches zero, the system automatically flips `isAvailable = false`, preventing customers from ordering sold-out dishes and avoiding kitchen stockouts.
- **Replenishment & Oversight**: Dedicated inventory endpoints (`GET /api/inventory`, `POST /api/inventory/replenish`) and live inventory metrics badges in Manager `MenuStockTab`.
