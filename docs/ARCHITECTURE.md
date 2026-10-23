# Technical Architecture Document

A comprehensive architectural specification of the **AURA Restaurant Mobile Application**, covering frontend structure, backend REST APIs, state management, security, and data flow.

---

## 1. System Overview & Technology Stack

The platform is designed with a decoupled client-server architecture consisting of a cross-platform mobile frontend and a high-throughput RESTful backend.

```text
┌────────────────────────────────────────────────────────┐
│               React Native / Expo Mobile App           │
│  (Navigation, Component-Driven UI, Context Providers)  │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON (JWT Auth)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Express.js REST API Server               │
│      (Auth, Menu, Orders, Reservations, Tables)        │
└──────────────────────────┬─────────────────────────────┘
                           │ Mongoose ODM Driver
                           ▼
┌────────────────────────────────────────────────────────┐
│               MongoDB NoSQL Database                   │
│      (Collections: users, menuitems, orders, etc.)     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Mobile Architecture

### A. Core Design Philosophy
- **Component-Driven Design (CDD)**: Reusable atomic components located in `src/components/ui/` (`Button`, `Card`, `Input`, `PhoneInput`, `SegmentedControl`, `FilterTabs`, `TabBar`, etc.).
- **Strict Tokenized Theme Engine**: Centralized tokens in `src/theme/theme.js` supporting dynamic switching between light and dark modes with zero hardcoded hex values in screens.
- **Resilient Offline Storage (`safeStorage`)**: Web, iOS, and Android compatible wrapper over `@react-native-async-storage/async-storage` preventing crashes on storage permission blocks.

### B. Global State Management (Context API)

The application utilizes a distributed Context API architecture avoiding heavy third-party state libraries while ensuring predictable state propagation:

| Context Provider | Responsibility & State |
| :--- | :--- |
| **`ThemeContext`** | Manages `isDark` boolean, light/dark color palettes, typography tokens, elevation shadows, and theme persistence. |
| **`AuthContext`** | Stores authenticated `user` session, JWT token, role (`customer` / `manager` / `staff`), login/signup/logout, and profile update actions. |
| **`BranchContext`** | Manages selected branch/outlet (`lhr_gulberg`, `isb_f7`), branch metadata, branch switching modal, safe storage persistence (`@aura_selected_branch_id`), and dynamic multi-branch capability flags. |
| **`MenuContext`** | Manages live menu items catalog, category filtering, search queries, favourites, price edits, and dish availability toggles. |
| **`CartContext`** | Handles tray items, incremental steppers, promotional vouchers, financial computations (subtotal, service charge, sales tax), and persistence. |
| **`OrdersContext`** | Manages customer orders, order placement, real-time status polling (10s intervals), and order cancellation. |

### C. Config-Driven Multi-Branch Architecture
- **Declarative Outlets Specification**: Configured centrally in `src/config/brand.js`. Outlets can be activated or deactivated via `isActive: boolean`. If only one outlet remains active, the UI seamlessly collapses into a single-city boutique mode without code modifications.
- **Persistent Branch Selection**: Customer preferences are saved across app restarts using `BranchContext` and `safeStorage` (`@aura_selected_branch_id`).
- **Contextual UI Integration**: Interactive `BranchChip` components in header zones (`MenuScreen`, `ReservationScreen`), enabling patrons to switch dining outlets with a tap.
- **Traceable Order & Booking Metadata**: Orders and reservations carry immutable branch metadata (`branchId`, `branchName`, `branchCity`) for kitchen routing.
- **Executive Supervision & Filtering**: The Manager Dashboard provides outlet filter pills (`All Outlets`, `📍 Lahore`, `📍 Islamabad`) alongside location badges on order cards, enabling regional kitchen oversight.

### D. Modular Screen Architecture

All screens exceeding ~600 lines have been decomposed into focused sub-module folders. Each folder owns its own styles, sub-components, and an `index.js` re-export bridge so `AppNavigator.js` requires **zero changes**.

| Screen Module | Folder | Sub-components |
| :--- | :--- | :--- |
| **Menu** | `src/screens/Menu/` | `menuStyles.js`, `HeroCarousel`, `CategoryRow`, `OrderAgainRow`, `DealsSection`, `TopRatedRow`, `FilterSheet`, `DishGrid`, `MenuScreen`, `index.js` |
| **Reservation** | `src/screens/Reservation/` | `reservationStyles.js`, `DateRow`, `PartyStepper`, `ZonePicker`, `SlotGrid`, `BookingForm`, `BookTabContent`, `ConfirmSheet`, `SuccessSheet`, `MyBookingsList`, `ReservationScreen`, `index.js` |
| **Manager** | `src/screens/Manager/` | `managerStyles.js`, `OrderItemCard`, `ReservationCard`, `MenuItemCard`, `OverviewTab`, `OrdersTab`, `ReservationsTab`, `MenuStockTab`, `TeamTab`, `ReviewsTab`, `ReviewReplyModal`, `reviewsTabStyles.js`, `AddDishModal`, `EditDishModal`, `ManagerDashboardScreen`, `index.js` |
| **Login** | `src/screens/Login/` | `loginStyles.js`, `BrandCanopy`, `EmailPasswordForm`, `PhoneOtpStep`, `NameEntryStep`, `GuestBrowseFooter`, `LoginScreen`, `index.js` |
| **Cart** | `src/screens/Cart/` | `cartStyles.js`, `EmptyClocheIllustration`, `CartEmptyState`, `CartItemCard`, `VoucherSection`, `BillSummary`, `FloatingCartFooter`, `CartScreen`, `index.js` |
| **OrderTracking** | `src/screens/OrderTracking/` | `trackingStyles.js`, `trackingHelpers.js`, `ActiveOrderHero`, `PastOrderCard`, `TrackingEmptyState`, `OrderTrackingScreen`, `index.js` |

Root bridge files (`src/screens/CartScreen.js`, `src/screens/OrderTrackingScreen.js`, etc.) each contain a single `export { default } from './Folder/Screen'` so all navigator imports remain unchanged.

---

## 3. Navigation Hierarchy (`AppNavigator.js`)

Navigation is structured using **React Navigation v7** with a Native Stack root and a custom Bottom Tab Navigator for authenticated customers:

```text
Root Stack Navigator
├── Splash (Brand cloche & flame animation, first-launch check)
├── Onboarding (Parallax slides, stretching pill indicator)
├── Login (Hero drift, animated login & OTP verification)
├── CustomerApp (Custom Bottom Tab Navigator)
│   ├── Menu (Catalog browsing, hero carousel, deals, filter sheet)
│   ├── Reservations (Table booking, time slot picker, My Bookings)
│   ├── Cart (Culinary tray, price breakdown, promo code)
│   ├── TrackTab (Order stepper progression, live kitchen status)
│   └── Profile (Stitch variant 2 profile, dietary preferences, edit info)
├── OrderSummary (Checkout fulfillment, dine-in/takeaway, payment settlement)
├── OrderPlaced (Success confirmation, cloche animations, receipt)
└── ManagerDashboard (Executive overview, live KPI cards, order & table management)
```

---

## 4. Backend REST API Architecture (`server/`)

The backend is built with Express.js using a modular controller-route-model architecture. For detailed Mongoose collections, field validations, indexes, and seed hygiene, see [docs/DATABASE.md](file:///docs/DATABASE.md).

### Endpoints Directory

| Resource | Method | Endpoint | Access Level | Description |
| :--- | :---: | :--- | :---: | :--- |
| **Auth** | `POST` | `/api/auth/register` | Public | Customer registration with hashed password. |
| | `POST` | `/api/auth/login` | Public | Credentials authentication, returns JWT token. |
| | `POST` | `/api/auth/phone/send-otp` | Public | Generates 6-digit cryptographic OTP (30s cooldown, printed to server console). |
| | `POST` | `/api/auth/phone/verify-otp` | Public | Verifies 6-digit OTP (max 3 attempts) and returns JWT session token. |
| | `GET` | `/api/auth/profile` | Authenticated | Fetches current user profile. |
| | `PUT` | `/api/auth/profile` | Authenticated | Updates name, phone, email, and preferences. |
| | `GET` | `/api/auth/staff` | Manager | Fetches staff accounts list. |
| | `POST` | `/api/auth/register-staff` | Manager | Registers new staff/floor team account. |
| | `PATCH` | `/api/auth/staff/:id/status` | Manager | Activates or deactivates staff account. |
| | `PATCH` | `/api/auth/staff/:id/demote` | Manager | Demotes manager to customer account. |
| **Menu** | `GET` | `/api/menu` | Public | Retrieves all active menu dishes. |
| | `POST` | `/api/menu` | Manager | Creates a new culinary menu item. |
| | `PUT` | `/api/menu/:id` | Manager | Updates price, description, and details. |
| | `PATCH` | `/api/menu/:id/availability` | Manager/Staff | Toggles In Stock / Sold Out status. |
| **Tables** | `GET` | `/api/tables` | Public | Lists all restaurant tables with zone & capacity. |
| **Reservations** | `GET` | `/api/reservations/my` | Authenticated | Customer's table reservations. |
| | `POST` | `/api/reservations` | Authenticated | Creates booking with collision verification and branch tag. |
| | `PATCH` | `/api/reservations/:id` | Authenticated | Cancels or confirms reservation. |
| | `GET` | `/api/reservations` | Manager | Fetches all restaurant reservations. |
| **Orders** | `GET` | `/api/orders/my` | Authenticated | Customer's order receipts and history. |
| | `POST` | `/api/orders` | Authenticated | Submits new dining order with server price calculation & branch association. |
| | `GET` | `/api/orders` | Manager/Staff | Fetches all active kitchen orders (filterable by branch). |
| | `PATCH` | `/api/orders/:id/status` | Manager/Staff | Updates status (Pending ➔ Preparing ➔ Ready ➔ Served). |
| | `PATCH` | `/api/orders/:id/cancel` | Authenticated | Cancels order while in Pending state. |
| **Reviews** | `GET` | `/api/menu/:id/reviews` | Public | Paginated verified reviews and rating stats for a dish. |
| | `POST` | `/api/reviews` | Authenticated | Submits rating and tasting notes for dish from a served order. |
| | `GET` | `/api/reviews` | Manager | Paginated patron reviews across all dishes. |
| | `GET` | `/api/reviews/my` | Authenticated | Current user's submitted dish reviews. |
| | `PATCH` | `/api/reviews/:id` | Authenticated | Updates review rating/comment (owner only, within 24h). |
| | `PATCH` | `/api/reviews/:id/reply` | Manager | Official executive chef / manager reply to review. |
| | `DELETE` | `/api/reviews/:id` | Authenticated/Manager | Deletes review and recalculates dish rating aggregates. |

---

## 5. Security & Data Integrity

1. **Password Hashing**: Cryptographic salting and hashing utilizing `bcryptjs` with a work factor of 10. Passwords are never stored or logged in plain text.
2. **Stateless JWT Tokens**: Authentication tokens signed with HMAC SHA-256 containing user ID and role claims with configurable expiration.
3. **Role-Based Access Control (RBAC)**: Middleware enforcing role constraints (`protect` for authenticated users, `authorize('manager')` for administrative actions).
4. **Collision Handling**: Backend reservation routes enforce atomic checks ensuring tables are not double-booked for overlapping time slots.
5. **Pakistani Phone Normalization**: Input validation enforcing standard Pakistani mobile patterns (`03XX-XXXXXXX` / `+923XXXXXXXXX`).
6. **Cryptographic 6-Digit OTP**: Phone authentication generates a high-entropy 6-digit integer (`crypto.randomInt(100000, 1000000)`), stored in a volatile in-memory Map with a 5-minute TTL, 30-second resend rate limit, and strict invalidation after 3 failed attempts.
7. **Simulated SMS Security Isolation**: OTP codes print strictly to the development server console and are never sent in API JSON payloads, preventing inspection by malicious network sniffers.
8. **Multi-Branch Data Integrity**: Every order and reservation embeds immutable branch identifiers (`branchId`, `branchName`, `branchCity`), ensuring accurate kitchen fulfillment and preventing cross-city order misrouting.

---

## 6. Layers and Known Violations

### Layer Rules

**App side**:
- Screens and components **must only** consume React Contexts, hooks, and utils — never call `fetch` or `apiClient` directly.
- Contexts and hooks own all data fetching and network side-effects.
- All HTTP communication must flow through `src/api/client.js`.

**Server side**:
- **Routes** (`server/routes/`): Pure URL → middleware/controller mappings. No business logic.
- **Controllers** (`server/controllers/`): Thin — parse request, call logic, send response. Business rules live here today and should migrate to `server/services/` over time.
- **Models** (`server/models/`): Own schemas, validation, defaults, indexes.
- **Middleware** (`server/middleware/`): Auth, RBAC, security headers, upload handling, rate limiting.
- **Config** (`server/config/`): DB connection, environment constants.

### Known Violations (ordered by risk)

#### HIGH — Screens calling `apiClient` directly (bypasses context layer)

| # | File | Lines | What it does | Fix plan |
|---|------|-------|--------------|----------|
| 1 | `src/screens/Manager/ManagerDashboardScreen.js` | L20, L175, L298, L323, L337 | Directly calls `apiClient` for reservation actions, staff registration, staff status toggle, and staff demotion | Move staff CRUD and reservation-action logic into a `useStaff` hook and extend `useReservation` hook; screen only calls hook methods |
| 2 | `src/screens/OrderTracking/OrderTrackingScreen.js` | L13, L174 | Fallback `apiClient` call for order cancellation when `cancelOrder` context method is missing | Remove fallback — always use `cancelOrder` from `OrdersContext`; ensure context provides the method |

#### MEDIUM — Util bypassing `apiClient` for HTTP

| # | File | Lines | What it does | Fix plan |
|---|------|-------|--------------|----------|
| 3 | `src/utils/imageUpload.js` | L20, L76, L98 | Uses raw `fetch` for multipart image upload and imports `BASE_URL`/`TOKEN_KEY` from `api/client` | Add a `uploadFormData` method to `apiClient` supporting multipart/form-data, then call it from `imageUpload.js` |

#### MEDIUM — Screen importing API internals

| # | File | Lines | What it does | Fix plan |
|---|------|-------|--------------|----------|
| 4 | `src/screens/SplashScreen.js` | L33 | Imports `TOKEN_KEY` constant from `api/client` for direct storage key lookup | Move `TOKEN_KEY` to a shared constants file (e.g. `src/config/keys.js`) or use `AuthContext` to check auth state |

#### LOW — Hardcoded hex colors in screens (should use theme tokens)

| # | File | Approximate count | Fix plan |
|---|------|--------------------|----------|
| 5 | `src/screens/SplashScreen.js` | ~16 hardcoded hex values | Extract splash-specific palette into theme tokens or a `splashColors` constant object |
| 6 | `src/screens/ProfileScreen.js` | ~20 hardcoded hex values | Replace with `colors.*` from `useTheme()` |
| 7 | `src/screens/Reservation/MyBookingsList.js` | ~8 hardcoded hex values | Replace with semantic status colors from theme |
| 8 | `src/screens/Reservation/reservationStyles.js` | ~4 hardcoded hex values | Replace with theme tokens |
| 9 | `src/screens/Reservation/ZonePicker.js` | 1 (`#FFFFFF`) | Replace with `colors.onPrimary` or equivalent |
| 10 | `src/screens/Reservation/ConfirmSheet.js` | 1 (`#FFFFFF`) | Replace with theme token |
| 11 | `src/screens/Reservation/BookingForm.js` | 1 (`#FFFFFF`) | Replace with theme token |
| 12 | `src/screens/Reservation/SuccessSheet.js` | 1 hardcoded `'AURA'` fallback | Replace with `brand.appName` from `src/config/brand.js` |

#### INFO — File size violations (~400 line threshold)

| # | File | Lines | Fix plan |
|---|------|-------|----------|
| 13 | `src/screens/SplashScreen.js` | 1023 | Decompose into `src/screens/Splash/` folder with sub-components (animations, cloche, text reveal) |
| 14 | `src/screens/ProfileScreen.js` | 1061 | Decompose into `src/screens/Profile/` folder |
| 15 | `src/screens/Menu/MenuScreen.js` | 895 | Extract more sub-components from existing modular folder |
| 16 | `src/screens/Menu/menuStyles.js` | 861 | Split into per-component style files |
| 17 | `src/screens/OrderSummaryScreen.js` | 812 | Decompose into `src/screens/OrderSummary/` folder |
| 18 | `src/screens/Manager/ManagerDashboardScreen.js` | 660 | Further decompose tab logic into sub-components |
| 19 | `src/screens/OrderPlacedScreen.js` | 579 | Decompose into `src/screens/OrderPlaced/` folder |
| 20 | `src/screens/Login/LoginScreen.js` | 535 | Extract more sub-components from existing modular folder |
| 21 | `src/screens/Cart/cartStyles.js` | 521 | Split into per-component style files |
| 22 | `src/screens/Reservation/reservationStyles.js` | 506 | Split into per-component style files |
| 23 | `src/screens/OnboardingScreen.js` | 453 | Decompose into `src/screens/Onboarding/` folder |
| 24 | `src/screens/Manager/managerStyles.js` | 438 | Split into per-tab style files |
| 25 | `src/components/ui/OnboardingSlide.js` | 430 | Extract animation logic into a helper |
| 26 | `server/controllers/authController.js` | 533 | Extract OTP logic and staff management into `server/services/authService.js` |

#### INFO — Missing `server/services/` layer

- No `server/services/` directory exists. All business logic (OTP generation, collision checks, price recalculation, staff management) lives directly in controllers.
- **Fix plan**: Gradually extract domain logic from controllers into service modules (`authService.js`, `orderService.js`, `reservationService.js`). Controllers become thin HTTP adapters.

### Server Routes Assessment

All 6 route files (`authRoutes.js`, `menuRoutes.js`, `orderRoutes.js`, `reservationRoutes.js`, `tableRoutes.js`, `uploadRoutes.js`) are **clean** — pure URL → middleware → controller mappings with zero inline business logic.

### Contexts and Hooks Assessment

`AuthContext`, `MenuContext`, `OrdersContext`, `CartContext`, `useReservation`, and `useApi` correctly own their data fetching via `apiClient`. No violations in the context/hook layer.
