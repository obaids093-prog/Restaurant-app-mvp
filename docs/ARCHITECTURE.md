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
| **Manager** | `src/screens/Manager/` | `managerStyles.js`, `OrderItemCard`, `ReservationCard`, `MenuItemCard`, `OverviewTab`, `OrdersTab`, `ReservationsTab`, `MenuStockTab`, `TeamTab`, `AddDishModal`, `EditDishModal`, `ManagerDashboardScreen`, `index.js` |
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

The backend is built with Express.js using a modular controller-route-model architecture:

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
