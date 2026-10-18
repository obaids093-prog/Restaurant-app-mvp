# DESIGN_PROGRESS.md — AURA Restaurant App Design Refresh

Tracking log for the complete redesign, brand centralisation, and sale-ready preparation of the AURA restaurant mobile app (React Native / Expo, Express, MongoDB) on branch `design-refresh`.

---

## Steps & Screens Progress Table

| Step | Scope / Screen(s) | Status | Commit Hash | Key Deliverables & Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Step 0** | **Read-only Analysis & Planning** | Completed | N/A (read-only) | Code & Stitch inspection, audit of dependencies, progress tracker initialized. |
| **Step 1** | **Theme, Brand Config, Shared UI & TabBar** | Completed | `f1c3c1a` | `src/theme` tokens (light/dark, #121212 background), Poppins font integration, `src/config/brand.js`, UI component library in `src/components/ui`, custom `TabBar`. |
| **Step 2** | **Splash, Onboarding, Login, Signup & OTP** | Completed | `acbc6ea` | Cloche & flame splash with 3D extrusion, steam & sparks, staggered brand letters reveal, safeStorage first-launch flag, reduce-motion fallback; Login with 6s ambient hero drift, 16px slide entrance, 200ms error shake, sliding SegmentedControl pill, button press scale & shimmer loop, 180° theme toggle, useNativeDriver performance and cleanup. |
| **Step 3** | **Menu Home, Filter Sheet & Favourites** | Completed | `5e4429c` | Hero carousel ("Chef's pick") with overlapping search, category pills, "Order again" row, "Deals for you" DealCards, Top rated row, 2-col memoised grid, Filter sheet, device-stored Favourites. |
| **Step 4** | **Tray, Order Summary & Order Placed** | Completed | `0d66c96` | Tray with item stepper & swipe/tap delete, PriceSummary, floating pill, Order Summary with Dine-in/Takeaway & Cash/Pay at table selector, SuccessState screen. |
| **Step 5** | **Order Tracking & Reorder** | Completed | `5483dc5` | OrderStepper timeline, FilterTabs (All/Active/Completed), 10s polling with cleanup, cancel while Pending, Reorder re-adding to cart, empty state. |
| **Step 6** | **Reserve & My Bookings** | Completed | `96adfc7` | Table reservation flow (slots 12:00-22:00 disabled when full, no past date, party 1-12, phone 03XX-XXXXXXX, 1hr ahead), SegmentedControl, FilterTabs (Upcoming/Past/Cancelled), Confirmation modal, Reservation Confirmed sheet, and cancellation confirmation. |
| **Step 7** | **Profile & Edit Profile** | Completed | `91935bc` | Stitch variant 2 profile with initials avatar (ZM), vibrant gradient card, verified phone pill, dietary preferences tags, appearance toggle, and personal info edit modal. |
| **Step 8** | **Manager Console** | Completed | `01e91d8` | Executive overview, live KPI cards (Active Orders, Pending Bookings, Today's Revenue), Orders progression, Reservations management, Menu catalog & pricing, and Team staff accounts. |
| **Step 9** | **Sale-Ready Documentation** | Completed | `eabdebc` | `docs/SETUP.md`, `docs/WHITE_LABEL.md`, `docs/ASSETS_LICENSES.md`, `docs/ARCHITECTURE.md`, `README.md` documentation link list, `LICENSE` review note. |
| **Step 10** | **Full Regression & Verification** | Completed | `04059a6` | 40/40 files present, all imports resolve, Stitch Extras clean, all animations have useNativeDriver, reduce-motion fallback on all animated screens, 12/12 deps present, all screens export default. |
| **Step 11** | **Codebase Pruning, Re-render Loop Fix & Icon Repair** | Completed | `57831f7` | Removed 9 orphaned UI/drawer components and `.gitkeep` placeholders (-1,127 lines). Fixed invalid Ionicons identifiers in OrderSummaryScreen (`restaurant-outline`, `time-outline`). Stabilized MenuContext, OrdersContext, and MenuScreen callbacks with state bailout equality checks to eliminate "Maximum update depth exceeded" infinite loops. |
| **Step 12** | **Multi-Branch Tracking, Reservation Lifecycle, Manager Image Upload & OTP Security** | Completed | — | **Multi-Branch Order/Reservation Tracking**: Added `branchId`, `branchName`, `branchCity` fields to `Order` and `Reservation` MongoDB schemas; backend controllers auto-extract branch metadata on creation; Manager Dashboard gains outlet filter pills (`All Outlets`, `📍 Lahore`, `📍 Islamabad`) with prominent city badges on order/reservation cards. **Smart Reservation Lifecycle**: Past/completed bookings auto-display "Dining Completed • Visited" green badge with "Reserve Again" CTA; cancel button only visible for future active reservations; filter tabs (All, Upcoming, Past, Cancelled) with live count badges. **Manager Dish Image Upload**: Add/Edit Dish modals include "Photo URL" input field + horizontal "Quick Photo Presets" scroller (🥩 Steak, 🍝 Pasta, 🍔 Burger, 🍰 Dessert, 🍹 Mocktail, 🥗 Salad) linking to curated Unsplash images. **6-Digit Cryptographic OTP**: Phone login uses `crypto.randomInt(100000, 1000000)` for high-entropy 6-digit codes with 5-min TTL, 30s resend cooldown, and 3-attempt lockout. **Manager Header Polish**: Renamed "Guest" button to "App View" for customer-perspective preview. |
| **Step 13** | **Structure Cleanup & Code Hygiene** (`cleanup-structure` branch) | Completed | `6a5bcbb` | Modularized 6 oversized screens (Menu, Reservation, Manager, Login, Cart, OrderTracking) into focused sub-folders — each with dedicated styles, sub-components, and an `index.js` bridge preserving `AppNavigator.js` unchanged. Removed dead files (orphaned components, stale duplicates). Eliminated IDE Cognitive Complexity warnings in `PastOrderCard.js` and `OrderTrackingScreen.js`. Replaced hardcoded `#ef4444` error red and `#141211`/`#F8F9FA` background with `colors.error`/`colors.background` theme tokens. Created `docs/REPO_MAP.md`, updated `docs/ARCHITECTURE.md` with Section D (Modular Screen Architecture), and added step-by-step `CHANGE.MD` progress log. Android bundle passes 0 errors throughout (1043 modules). |

---

## Stitch Extras Rule — Omitted & Decorative Elements Audit

In accordance with the **STITCH EXTRAS RULE**, the Stitch reference designs contain various UI elements and numbers that have no backend, API contracts, or real data models in the application. These elements are omitted or strictly kept as non-interactive decoration to prevent showing false or invented data.

| Stitch Element | Screen / Location | Disposition | Rationale & Handling |
| :--- | :--- | :---: | :--- |
| **Loyalty Tier & Visit Counts** (e.g. *"Connoisseur Tier 1"*, *"12 Visits"*) | Customer Profile | **Omitted** | No backend loyalty system exists; showing invented counts violates sale-ready integrity. Displays user's actual name, email, phone, and role. |
| **Station Workload Telemetry** (e.g. *"Hearth & Grill 82%"*, *"Cold Larder 45%"*) | Manager Overview | **Omitted** | No kitchen sensor or POS telemetry backend exists. Replaced with real KPI metrics (Active Orders, Pending Bookings, Today's Revenue) calculated from live collections. |
| **POS Sync / Broadcast / Floor Map** | Manager Overview | **Omitted** | Administrative commands with no backend handler or floor plan graphics. Replaced with live order management & menu controls. |
| **Digital Wallet / Credit Card Gateway** | Order Summary & Checkout | **Omitted** | No online payment processor (Stripe/Paymob) in backend. Payment selector shows only **Cash** and **Pay at table** (UI selection only, not sent to server). |
| **Call Host / Call Concierge** | Reservation Confirmed / Detail | **Omitted / Decorative** | No VoIP telephony service in app. Standard phone link or non-interactive indicator. |
| **Pre-Order Courses to Table** | Reservation Confirmed | **Omitted** | Reservations backend handles table reservations only, not pre-ordering menu items attached to reservations. Customers order directly via Tray. |
| **Add to Calendar** | Reservation Confirmed | **Omitted** | Requires native calendar permissions not configured in Expo Go. Omitted to avoid crashing or dead buttons. |
| **Wine Pairing / 5-Course Pairing Tier** | Menu & Reservation Confirmation | **Omitted** | Menu database categorizes items as Starters, Mains, Desserts, Drinks without wine pairing metadata. |
| **Digital Gate Pass / Fast Valet Pass QR** | Reservation Confirmed | **Omitted** | No parking/valet backend or barcode scanner integration. Real reservation confirmation details (Date, Time, Party size, Table) shown cleanly instead. |
| **Notification Bell with Unread Badge** | Navigation Header & Profile | **Omitted** | No push notification infrastructure or notification inbox endpoint in the backend. |
| **Fictional Revenue Targets / % Achieved** (e.g. *"Target Rs. 450,000"*, *"85% Achieved"*) | Manager Overview | **Omitted** | No target revenue schema exists in DB. Today's Revenue is computed from real completed orders for the day. |

---

## File Inventory & Planned Modifications

### New Files to Create:
- `src/config/brand.js` (Brand identity config: appName, tagline, formatPrice, placeholders, onboarding copy)
- `src/components/ui/Button.js`
- `src/components/ui/Card.js`
- `src/components/ui/Chip.js`
- `src/components/ui/CategoryChip.js`
- `src/components/ui/Input.js`
- `src/components/ui/Badge.js`
- `src/components/ui/SegmentedControl.js`
- `src/components/ui/FilterTabs.js`
- `src/components/ui/Skeleton.js`
- `src/components/ui/EmptyState.js`
- `src/components/ui/SuccessState.js`
- `src/components/ui/PriceSummary.js`
- `src/components/ui/OrderStepper.js`
- `src/components/ui/OtpInput.js`
- `src/components/ui/Switch.js`
- `src/components/ui/TabBar.js`
- `src/components/ui/HeroCard.js`
- `src/components/ui/DealCard.js`
- `src/components/ui/OnboardingSlide.js`
- `src/components/ui/index.js`
- `docs/SETUP.md`
- `docs/WHITE_LABEL.md`
- `docs/ASSETS_LICENSES.md`
- `docs/ARCHITECTURE.md`

### Existing Files to Restyle / Update:
- `src/theme/theme.js` (Token updates: light/dark palettes, typography Poppins, spacing, radius, card shadows)
- `src/navigation/AppNavigator.js` (Custom TabBar integration, smooth screen headers & transitions)
- `src/screens/LoginScreen.js` (Brand HeroCard, SegmentedControl, inputs with icons, OTP modal/view, seeded accounts removed)
- `src/screens/MenuScreen.js` (Hero carousel, search overlap, category circles, Order again row, Deals for you, Top rated, 2-column grid, filter sheet, favourites)
- `src/screens/CartScreen.js` (Restyled tray, item rows with stepper, voucher cards, PriceSummary, floating pill)
- `src/screens/OrderSummaryScreen.js` (Dine-in / Takeaway selector, table number, Cash / Pay at table selector, SuccessState)
- `src/screens/OrderTrackingScreen.js` (OrderStepper, FilterTabs, cancel while Pending, reorder, empty state)
- `src/screens/ReservationScreen.js` (Table reservation with time slot pills, validation feedback, My Bookings tab)
- `src/screens/ProfileScreen.js` (Stitch variant 2 layout with initials avatar, edit profile modal, dark mode toggle)
- `src/screens/ManagerDashboardScreen.js` (Overview KPI cards from real data, Orders, Reservations, Menu, Team restyled)
- `package.json` (`@expo-google-fonts/poppins` dependency addition)
- `README.md` (Short "More documentation" link list added)

---

## Real-World Image Upload Pipeline (KFC / FoodPanda Model)
- Added `POST /api/upload` (Manager-only, 5MB limit, JPEG/PNG/WebP validation via `multer`)
- Static file serving at `/uploads/<filename>` in Express
- `expo-image-picker` integrated in client with 4:3 landscape aspect ratio cropping and 70% quality auto-compression
- Upload helper in `src/utils/imageUpload.js` supporting both web blobs and React Native native file payloads
- Manager Add Dish and Edit Dish modals equipped with "Choose from Device / PC", live thumbnail preview, and presets fallback.
