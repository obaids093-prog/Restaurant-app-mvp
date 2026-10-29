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
- **Photo Storage Architecture**: Uploaded dish photos are stored on local server disk (`server/uploads/`) for development; catalog production images are delivered via Unsplash CDN. Cloud object storage (e.g. Cloudinary/S3) is scheduled for the commercial release.
- **Automated Tests**: 90/90 tests passing across 9 Jest suites (`auth`, `reviews`, `vouchers`, `loyalty`, `notifications`, `analytics`, `noHardcodedVouchers`, `clientColdStart`, `secureTokenStorage`).
- **CI/CD Cloud Deployment**: Render cloud backend automatically syncing with GitHub repository.

---

## PART 2: High-Impact Features to Add (Real-World Commercial Roadmap)

To transform AURA from an academic MVP to an enterprise-grade food & dining application competing with platforms like **Foodpanda**, **McDonald's**, **Starbucks**, and **OpenTable**, the following features are recommended:

### 1. Online Payment Gateways (Priority: CRITICAL)
- **Local Mobile Wallets**: **JazzCash** and **EasyPaisa** SDK/API integration (essential for 80%+ of Pakistani digital food shoppers).
- **Credit / Debit Cards**: Integration with **PayFast**, **Safepay**, or **Stripe** with 3D Secure OTP verification.
- **Saved Cards Tokenization**: Encrypted card tokenization for 1-tap checkout without re-entering card details.

### 2. Real-Time WebSockets / Server-Sent Events (Priority: HIGH)
- **Zero-Latency Updates**: Upgrade 10-second HTTP polling to **Socket.io** or **Supabase Realtime**.
- **Instant Status Sync**: When a chef taps "Ready" in the kitchen, the customer's phone status updates in under 200ms without background battery drain.

### 3. Cloud Object Storage for Uploads (Priority: HIGH)
- **Permanent Asset Storage**: Migrate local disk storage (`server/uploads/`) to **Cloudinary** or **AWS S3 / Cloudflare R2** with automatic WebP image compression.

### 4. Native Remote Push Notifications (Priority: HIGH)
- **EAS Push Credentials**: Configure Apple APNs and Google FCM credentials in EAS build profiles for background push alerts when the app is closed.

### 5. Live GPS Rider Tracking on Map (Priority: HIGH)
- **Interactive Map**: Google Maps / Mapbox screen showing restaurant location, customer address, and animated delivery rider bike icon.
- **Dynamic ETA**: Live Estimated Time of Arrival calculated dynamically based on real-time traffic and distance.

### 6. Table QR-Code Dine-In Ordering (Priority: MEDIUM-HIGH)
- **Camera QR Scanner**: Customers sitting at a restaurant table scan a physical acrylic QR standee on the table.
- **Auto-Locked Table**: The app automatically selects the branch and locks `Table #8`, allowing customers to browse, order, and pay directly from their phones without waiting for a waiter.

### 7. Automated SMS & WhatsApp Order Updates (Priority: MEDIUM)
- **WhatsApp Cloud API / Twilio**: Automatically send order confirmation, preparation alerts, and digital PDF receipts directly to the customer's WhatsApp or SMS.

### 8. Digital Kitchen Display System (KDS) Tablet App (Priority: MEDIUM)
- **Chefs' Tablet View**: Dedicated horizontal landscape mode designed for 10-inch kitchen tablets mounted in the kitchen.
- **Audio Chime & Color Alerts**: Sound chime whenever a new order arrives, with color-coded timers (Green < 10m, Amber 15m, Red > 20m) to ensure fast order fulfillment.

### 9. Social Sign-In & Biometrics (Priority: MEDIUM)
- **1-Tap Social Login**: "Sign in with Google" and "Sign in with Apple".
- **Biometric Security**: FaceID / Fingerprint unlocking for instant access without retyping passwords.

### 10. Ingredient-Level Inventory & Auto-Stock Management (Priority: MEDIUM)
- **Stock Depletion**: Deduct raw ingredients automatically when orders are cooked (e.g. 1 Burger = 1 Bun, 1 Patty, 20g Cheese).
- **Auto Sold-Out**: Automatically switch menu items to "Sold Out" in the customer app when key ingredients reach zero.
