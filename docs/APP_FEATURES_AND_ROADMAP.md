# AURA Restaurant Application: Features Audit & Production Roadmap

> **Document Status**: Comprehensive Technical Audit & Production Roadmap  
> **Application**: AURA Restaurant Mobile App (MVP to Commercial Grade)  
> **Tech Stack**: React Native (Expo SDK 57), Node.js, Express, MongoDB Atlas, Render Cloud  
> **Word Document (.docx)**: Generated and saved at `docs/AURA_Restaurant_App_Features_and_Roadmap.docx`

---

## PART 1: Currently Implemented Features (Properly Working)

### 1. Authentication & User Security
- **Email & Password Authentication**: Restricted strictly to authentic `@gmail.com` accounts to eliminate fake disposable registrations.
- **JWT Token Handling**: Tokens securely stored locally via persistent storage with safe AsyncStorage fallback.
- **Role-Based Access Control (RBAC)**: Clean separation between `customer` and `manager` permissions across APIs and UI screens.
- **Profile Initialization**: Automatic initials avatar generator (e.g. "Farhan Siddiqui" -> "FS") with profile info management.

### 2. Multi-Branch Operations
- **Multiple Outlets Supported**: Branches in Lahore (Gulberg III) and Islamabad (Blue Area).
- **Interactive Branch Picker Modal**: Allows customers and managers to switch branches anytime from the top bar.
- **Branch-Aware Routing**: Menu availability, reservations, and order dispatch are linked to the selected branch.

### 3. Customer Menu & Interactive Food Catalog
- **Modern High-Density Design**: Refreshed to design-refresh-v2 Warm Coral aesthetics.
- **Real-Time Search Bar**: Debounced instant query search matching dish titles, tags, and ingredients.
- **Category Navigation**: Horizontal filter pills (`All`, `Starters`, `Mains`, `Desserts`, `Drinks`).
- **Advanced Dietary Filter Sheet**: Multi-select filters for *Halal*, *Vegetarian*, *Vegan*, *Gluten-Free*, *Dairy-Free*, and *Chef's Special*.
- **Price Range & Sorting**: Price slider and sorting by *Price: Low to High*, *Price: High to Low*, and *Top Rated*.
- **Chef's Pick Compact Banner**: Featured dish hero banner with 1-tap add to cart.
- **Dynamic "Deals For You" Ticker**: Shows live active promotional vouchers fetched directly from MongoDB Atlas (auto-hides when empty).
- **Order Again Carousel**: Shows the customer's previous order history for 1-tap fast reordering.
- **Dish Detail Bottom Sheet**: Expandable dish view with verified customer ratings, full ingredient breakdown, and sold-out badges.
- **Sticky Mini-Cart Bar**: Floats at the bottom with live item counter and subtotal for instant cart access.

### 4. Cart, Discounts & Folio Billing
- **Cart Quantity Stepper**: Smooth item increment, decrement, and removal.
- **Order Fulfillment Selector**: Supports *Dine-In* (with table number), *Takeaway*, and *Curbside*.
- **Special Cooking Instructions**: Dedicated text field for culinary notes and allergy warnings.
- **Promotional Voucher Engine**: Server-side validated coupons (`/api/vouchers/validate`) with percentage or flat Rs. savings.
- **Loyalty Points Redemption**: Instant discount calculator (1 Pt = Rs. 1, up to 50% bill cap).
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
- **5-Minute Cancellation Window**: Countdown timer enforcing kitchen preparation policy before order locks.
- **Direct Restaurant Contact**: 1-tap direct phone call button to restaurant staff.

### 7. Verified Reviews & Reputation System
- **Post-Dining Rating Modal**: 1-to-5 star rating and comment feedback modal after dining.
- **Automated Rating Aggregation**: MongoDB server recalculates dish average rating and review counts.
- **Verified Customer Dish Reviews**: Star distribution bars (5★ to 1★) and customer comments on each dish.
- **Manager Official Replies**: Direct management responses visible on customer reviews.

### 8. VIP Loyalty & Rewards Tier Program
- **4 VIP Tiers**: Bronze (0-499 pts), Silver (500-1499 pts), Gold (1500-2999 pts), Platinum (3000+ pts).
- **Automated Earning**: Earn points on every completed order (1 pt per Rs. 100 spent x tier multiplier).
- **Redemption**: Direct checkout point redemption (1 pt = Rs. 1).
- **Ledger Tracking**: Full `LoyaltyTransaction` audit log.

### 9. In-App Notification Center
- **Notification Bell**: Live unread count badge in top header.
- **Notification Screen**: Dedicated feed with relative timestamps ("2m ago"), read/unread filters, and mark-all-read.
- **Auto-Sliding Toast Banner**: Floating top animated banner toast on new order updates.
- **Push Notification Gateway**: Server integration with Expo Push Notification service.

### 10. Restaurant Manager Operations Dashboard
- **Business Analytics (Overview Tab)**: Real-time revenue, total orders, average order value (AOV), and pending orders.
- **Time Range Switcher**: Filter analytics by *Today*, *Last 7 Days*, and *Last 30 Days*.
- **Hourly Rush Bar Chart**: Visualizes kitchen peak rush hours.
- **Top Dishes Leaderboard**: Ranking top dishes by units sold and revenue share.
- **Live Kitchen Dispatch (Orders Tab)**: Filter orders by status and advance status with 1 tap.
- **Reputation Console (Reviews Tab)**: View all customer reviews with sentiment tags and reply modal.
- **Promotions Manager (Vouchers Tab)**: Create, toggle active status, bulk deactivate demo vouchers, and preview customer ticket chips.

### 11. Code Quality & Technical Health
- **Dark & Light Mode**: Complete theme system with persistent AsyncStorage caching.
- **Plain English Copy**: Replaced all obscure culinary jargon ("patron", "culinary tray", "agnolotti") with standard English ("Customer", "Cart", "Truffle Pasta", "Manager").
- **Automated Tests**: 67/67 tests passing across 6 Jest suites.
- **CI/CD Cloud Deployment**: Render cloud backend automatically syncing with GitHub repository.

---

## PART 2: High-Impact Features to Add (Real-World Commercial Roadmap)

To transform AURA from an academic MVP to an enterprise-grade food & dining application competing with platforms like **Foodpanda**, **McDonald's**, **Starbucks**, and **OpenTable**, the following features are recommended:

### 1. Online Payment Gateways (Priority: CRITICAL)
- **Local Mobile Wallets**: **JazzCash** and **EasyPaisa** SDK/API integration (essential for 80%+ of Pakistani digital food shoppers).
- **Credit / Debit Cards**: Integration with **PayFast**, **Safepay**, or **Stripe** with 3D Secure OTP verification.
- **Saved Cards Tokenization**: Encrypted card tokenization for 1-tap checkout without re-entering card details.

### 2. Real-Time WebSockets / Server-Sent Events (Priority: HIGH)
- **Zero-Latency Updates**: Replace 6-second HTTP polling with **Socket.io** or **Supabase Realtime**.
- **Instant Status Sync**: When a chef taps "Ready" in the kitchen, the customer's phone status updates in under 200ms without background battery drain.

### 3. Live GPS Rider Tracking on Map (Priority: HIGH)
- **Interactive Map**: Google Maps / Mapbox screen showing restaurant location, customer address, and animated delivery rider bike icon.
- **Dynamic ETA**: Live Estimated Time of Arrival calculated dynamically based on real-time traffic and distance.

### 4. Table QR-Code Dine-In Ordering (Priority: MEDIUM-HIGH)
- **Camera QR Scanner**: Customers sitting at a restaurant table scan a physical acrylic QR standee on the table.
- **Auto-Locked Table**: The app automatically selects the branch and locks `Table #8`, allowing customers to browse, order, and pay directly from their phones without waiting for a waiter.

### 5. Automated SMS & WhatsApp Order Updates (Priority: MEDIUM)
- **WhatsApp Cloud API / Twilio**: Automatically send order confirmation, preparation alerts, and digital PDF receipts directly to the customer's WhatsApp or SMS.

### 6. Digital Kitchen Display System (KDS) Tablet App (Priority: MEDIUM)
- **Chefs' Tablet View**: Dedicated horizontal landscape mode designed for 10-inch kitchen tablets mounted in the kitchen.
- **Audio Chime & Color Alerts**: Sound chime whenever a new order arrives, with color-coded timers (Green < 10m, Amber 15m, Red > 20m) to ensure fast order fulfillment.

### 7. Social Sign-In & Biometrics (Priority: MEDIUM)
- **1-Tap Social Login**: "Sign in with Google" and "Sign in with Apple".
- **Biometric Security**: FaceID / Fingerprint unlocking for instant access without retyping passwords.

### 8. Ingredient-Level Inventory & Auto-Stock Management (Priority: MEDIUM)
- **Stock Depletion**: Deduct raw ingredients automatically when orders are cooked (e.g. 1 Burger = 1 Bun, 1 Patty, 20g Cheese).
- **Auto Sold-Out**: Automatically switch menu items to "Sold Out" in the customer app when key ingredients reach zero.

### 9. Multi-Language Switch (English & Urdu) (Priority: NICE-TO-HAVE)
- **Language Toggle**: Simple header toggle to switch between English and Urdu (Nastaliq script) for nationwide audience reach.

### 10. In-App Customer Support Live Chat (Priority: NICE-TO-HAVE)
- **Live Helpdesk**: Integrated in-app live chat (Tawk.to, Crisp, or Zendesk) allowing customers to ask questions regarding dietary allergens or delivery delays.
