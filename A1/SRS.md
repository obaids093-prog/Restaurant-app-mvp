# Software Requirements Specification (SRS)

## Restaurant App MVP (Frontend Only, React Native)

**Document Version:** 2.0.0  
**Academic Term:** Fall 2026  
**Course:** Mobile Application Development (CS-375)  
**Deliverable:** Question 1: Comprehensive System Specification

---

## Executive Summary & Client Interview

To ground the requirements in real-world human experience, a preliminary client self-interview was conducted from both Customer and Restaurant Manager perspectives:

- **The Customer Persona (Zainab Malik, VIP Dining Patron, Lahore):** _"I frequently visit high-end artisan bistros during dinner rushes and special occasions. When planning an evening out, I require instant access to the latest seasonal menu, ingredient details, real-time table booking with immediate seat allocation, and the ability to customize my orders in advance to avoid waiting lines."_
- **The Manager Persona (Chef Farhan Siddiqui, Executive Head Chef & Operations GM):** _"During peak kitchen hours, phone bookings and paper order tickets result in lost notes, table double-bookings, and service delays. We need a live, digitized operational console to supervise incoming kitchen tickets, approve or decline table reservations dynamically, and update dish pricing and availability instantly across all diner screens."_

---

## 1. Introduction

### 1.1. Purpose

This Software Requirements Specification (SRS) details the complete functional and non-functional requirements for the **Restaurant App MVP (AURA: Modern Artisan Kitchen & Botanica)**. The target audience includes academic evaluators, mobile software engineers, UI/UX designers, and quality assurance testers. This specification strictly reflects a frontend-only architecture powered by React Native and Expo SDK, utilizing local state machines and simulated persistence without a physical backend server.

### 1.2. Scope

#### In-Scope Functionalities:

1. **Authentication & Role Authorization:** Dual-mode authentication (Customer & Manager) utilizing mock user registries and session storage. Fully powered by the custom `useForm` hook with instant field validation, 3D flip card animations, and one-touch VIP RFID keycard credentials (`Zainab Malik` & `Chef Farhan Siddiqui`).
2. **Interactive Menu Catalog:** Categorized menu browsing (Starters, Mains, Desserts, Drinks) featuring 16 signature culinary dishes priced in Pakistani Rupees (`Rs.`), simulated network delay (1.5s), pull-to-refresh, dynamic item counting, and "100% Halal Artisan" / "Daily Special" badges.
3. **Optimized Search & Filter Controls:** Real-time text search powered by a custom `useDebounce` hook (400ms delay), recent search suggestion chips, horizontal category filtering, multi-criteria sorting (Price, Name, Recommended), and a 300px threshold "Back to top" floating button.
4. **Adaptive Luxury Theming:** System-wide dark and light mode toggle using custom React Context (`ThemeContext`), instantly transitioning between an **Obsidian Midnight** palette and a **Sunlit Botanical Alabaster** palette with custom 3D shadows and gradients.
5. **Cart & Order Customization:** Pure reducer-driven cart (`cartReducer.js`) supporting all 8 actions: quantity increments/decrements, item removal, dietary instructions, promotional voucher discounts (`AURA10`, `AURA20`, `AURA50`, `SAVE10`, `TASTY20`), and real-time tab badge indicators.
6. **Financial Calculation & Performance Optimization:** Subtotal, service charges (5%), and sales tax (15%) calculated via memoized formulas (`useMemo`); food card re-renders optimized via `React.memo` and stable `useCallback` action references.
7. **Table Reservation System:** Custom hook-based booking pipeline (`useReservation.js`) featuring slot conflict detection (12:00 to 22:00), party capacity checks (1-12 guests), Pakistani phone format validation (`03XX-XXXXXXX`), and reservation cancellations with local storage persistence.
8. **Live Order Progression & Manager Operations:** Dine-in vs. Takeaway checkout, timed status progression (10s Preparing ➔ 20s Ready ➔ 30s Served), live elapsed timer, and a dedicated 3-tab Manager Dashboard for queue management, reservation approvals/declines, and real-time menu CRUD.
9. **Black-Tie VIP Patron Passport:** Dedicated patron profile screen featuring gold-foiled digital membership cards, dining analytics matrix (Visits, Spend, Points), concierge dining preferences, and secure session sign out.

#### Out-of-Scope (Excluded from MVP):

1. **Live Payment Gateway:** No real credit card or third-party payment processing (Stripe, JazzCash, EasyPaisa).
2. **Native Push Notifications:** Apple APNs or Google FCM remote push notification daemons are excluded.
3. **Remote Backend & Persistent Relational Database:** No remote REST/GraphQL microservices, Node.js server, Firebase, or cloud SQL databases.
4. **Hardware Geolocation / GPS Tracking:** Real-time courier dispatch and GPS map rendering are excluded.

### 1.3. Definitions, Acronyms, and Abbreviations

1. **SRS (Software Requirements Specification):** A structured document outlining functional capabilities, constraints, and architecture of a software product.
2. **MVP (Minimum Viable Product):** A version of a software product with sufficient core features to validate requirements and usability.
3. **UML (Unified Modeling Language):** Standardized visual modeling language used to visualize, specify, and document software system artifacts.
4. **React Hook:** Special JavaScript functions (e.g., `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useReducer`) enabling functional components to manage state and lifecycle events.
5. **Context API:** React engine feature facilitating global state propagation across deeply nested component trees without manual prop drilling.
6. **Pure Reducer:** A deterministic function `(state, action) => newState` that calculates subsequent application state without mutating original inputs or causing side effects.
7. **Mock Data:** Localized JSON or JavaScript data structures simulating realistic database entities for standalone frontend development.
8. **FlatList:** A memory-efficient React Native component that virtualizes and renders only currently visible items within large scrollable datasets.
9. **Debounce:** A software design technique that restricts the execution of a computationally expensive task until a specified duration of inactivity has elapsed.
10. **Immutable State:** An architectural paradigm where data objects cannot be modified post-creation; state transitions always yield fresh object references.

---

## 2. Overall Description

### 2.1. User Roles & Personas

| Role                                          | Description                                                                                        | Key Permissions & Goals                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer (Zainab Malik, VIP Patron)**       | Registered dining patron seeking luxury culinary browsing, table booking, and order tracking.      | • Browse categorized menu items and daily specials.<br/>• Search with instant 400ms debouncing and multi-sorting.<br/>• Customize cart items with chef instructions.<br/>• Apply promotional discount vouchers (`AURA10`, `AURA20`, `AURA50`).<br/>• Book and cancel table reservations.<br/>• Place Dine-in / Takeaway orders and monitor live kitchen progress.<br/>• Toggle dark/light luxury UI themes. |
| **Restaurant Manager (Chef Farhan Siddiqui)** | Administrative culinary supervisor overseeing restaurant floor, kitchen throughput, and inventory. | • Access the secured Manager Operations Console.<br/>• Monitor live incoming kitchen orders and advance status stages manually.<br/>• Review pending table reservations, accepting or declining bookings.<br/>• Update item prices, toggle dish availability, and introduce new menu items with instant sync across customer screens.                                                                       |

### 2.2. User Stories

#### Customer User Stories (Derived from Client Meeting / Self-Interview):

1. **US-01 (Menu Discovery):** _As a Customer_, I want to view dishes categorized into Starters, Mains, Desserts, and Drinks with appetizing images and prices in PKR, so that I can quickly decide what to eat.
2. **US-02 (Daily Specials & Halal Certification):** _As a Customer_, I want chef specials and 100% Halal artisan certifications clearly highlighted with distinctive badges, so that I can discover unique seasonal recommendations.
3. **US-03 (Instant Debounced Search):** _As a Customer_, I want a fast search bar powered by `useDebounce` with recent search history chips, so that I can find my favorite meals without keystroke lag.
4. **US-04 (Dietary Customization):** _As a Customer_, I want to attach per-item special instructions (e.g., "Medium Rare", "No Dairy") to dishes in my cart, so that the kitchen prepares my food according to my preferences.
5. **US-05 (Promotional Vouchers):** _As a Customer_, I want to enter promo codes (such as `AURA10` or `AURA20`) during checkout, so that I receive discounts on my total bill.
6. **US-06 (Advance Table Booking):** _As a Customer_, I want to reserve a table for a specific date, hourly slot, and party size with automated capacity validation, so that I don't face waiting lines upon arrival.
7. **US-07 (Live Order Progress):** _As a Customer_, I want to track my order through an automated progress timeline with elapsed seconds, so that I know exactly when my food is preparing, ready, or served.

#### Restaurant Manager User Stories:

8. **US-08 (Kitchen Queue Progression):** _As a Restaurant Manager_, I want a real-time incoming orders dashboard where I can advance kitchen tickets from Pending to Preparing, Ready, and Served, so that order delivery remains synchronized.
9. **US-09 (Reservation Management):** _As a Restaurant Manager_, I want to review incoming dining reservations and explicitly Accept or Decline them based on restaurant floor capacity, so that tables are never overbooked.
10. **US-10 (Live Menu CRUD & Availability):** _As a Restaurant Manager_, I want to adjust menu item prices and toggle out-of-stock items off in real-time, so that customers cannot order unavailable ingredients.
11. **US-11 (Role-Restricted Console):** _As a Restaurant Manager_, I want management tabs to be completely hidden from ordinary diner profiles, so that sensitive administrative actions remain secure.
12. **US-12 (Theme Personalization):** _As a Customer or Manager_, I want to toggle between obsidian dark and porcelain emerald light themes, so that I can comfortably use the app in varying ambient lighting.

---

## 3. Functional Requirements

### Module 1: Authentication & Authorization (`LoginScreen.js`)

- **FR-01:** The system shall toggle between Login and Signup modes using a controlled mode state variable on a single interactive screen with 3D flip card animations.
- **FR-02:** The system shall manage all form state through a custom `useForm` hook (`values`, `errors`, `handleChange`, `handleSubmit`, `reset`, `isValid`), validating email syntax, enforcing password complexity (min 8 chars, 1 digit), and verifying matching confirm passwords.
- **FR-03:** The system shall clear field-specific error messages automatically as soon as the user modifies text within that respective input.
- **FR-04:** The system shall authenticate credentials against a local mock user registry, providing one-touch VIP RFID digital keycards for instant testing (`Zainab Malik`: Patron, `Chef Farhan Siddiqui`: Manager).
- **FR-05:** The system shall route authenticated Customer users to the main Menu screen and Manager users directly to the Manager Dashboard.

### Module 2: Menu Browsing & Catalog (`MenuScreen.js` & `MenuItemCard.js`)

- **FR-06:** The system shall asynchronously load 16 artisan culinary items spanning 4 distinct categories (Starters, Mains, Desserts, Drinks) using a simulated 1.5-second Promise with unmount cancellation.
- **FR-07:** The system shall present horizontal category filtering chips allowing patrons to view items by specific course or all items simultaneously.
- **FR-08:** The system shall render catalog items in an optimized `FlatList`, displaying distinct "Daily Special" badges and greying out unavailable dishes with disabled action buttons.
- **FR-09:** Individual dish cards (`MenuItemCard.js`) shall be memoized using `React.memo` and stable event callbacks (`useCallback`) to avoid redundant re-renders when favorites or tray items change.

### Module 3: Search, Filter & Scroll Optimization

- **FR-10:** The system shall provide an interactive search bar with a persistent `useRef` focus trigger and a 1-tap clear button that resets input without losing cursor focus.
- **FR-11:** The system shall debounce search queries by 400 milliseconds via the custom `useDebounce` hook, eliminating redundant filtering calculations during active typing.
- **FR-12:** The system shall present the last five unique search queries as tappable suggestions when the search bar is focused.
- **FR-13:** The system shall display a floating "Back to top" button when the list is scrolled past 300 vertical pixels, invoking `scrollToOffset({ offset: 0, animated: true })`.
- **FR-14:** The system shall compute search results, category filtering, and multi-criteria sorting (Price Ascending, Price Descending, Name A-Z, Recommended) in a single memoized expression (`useMemo`).

### Module 4: Shopping Cart & Reducer State (`CartScreen.js` & `cartReducer.js`)

- **FR-15:** The system shall manage cart operations through a pure `cartReducer` handling 8 distinct action types: `ADD_ITEM`, `REMOVE_ITEM`, `INCREMENT_QUANTITY`, `DECREMENT_QUANTITY` (auto-removing at quantity zero), `CLEAR_CART`, `APPLY_PROMO`, `REMOVE_PROMO`, and `SET_ORDER_TYPE`.
- **FR-16:** The system shall validate promotional discount vouchers (`AURA10` for 10% off, `AURA20` for 20% off, `AURA50` for 50% off), rejecting unlisted codes with informative error notifications.
- **FR-17:** The system shall update a live badge indicator on the bottom navigation tab icon reflecting the total cumulative item count in the tray.

### Module 5: Order Summary & Financial Calculation (`OrderSummaryScreen.js`)

- **FR-18:** The system shall compute Subtotal, Service Charge (5%), Provincial Sales Tax (15%), Promotional Discounts, and Grand Total using pure memoized expressions derived from cart items.
- **FR-19:** The system shall support both Dine-in (with table assignment) and Takeaway (with designated pickup time) dining modes.

### Module 6: Table Reservation Pipeline (`ReservationScreen.js` & `useReservation.js`)

- **FR-20:** The system shall provide hourly reservation slots between 12:00 and 22:00, disabling slots when restaurant capacity is exhausted.
- **FR-21:** The system shall validate reservation parameters via the custom `useReservation` hook, ensuring dates are not in the past, party sizes range from 1 to 12 guests, and contact numbers conform to Pakistani mobile formatting (`03XX-XXXXXXX`).
- **FR-22:** The system shall present a booking confirmation modal prior to committing a reservation, and permit patrons to cancel existing reservations with an Alert dialog confirmation.

### Module 7: Live Order Tracking & Manager Dashboard (`OrderTrackingScreen.js` & `ManagerDashboardScreen.js`)

- **FR-23:** The system shall provide an Order Tracking screen that automatically transitions ticket status from `Pending` ➔ `Preparing` (10s) ➔ `Ready` (20s) ➔ `Served` (30s) while rendering a real-time elapsed counter that updates every second.
- **FR-24:** The system shall provide a Manager Dashboard featuring three dedicated operational views: (a) Incoming Orders queue with manual status overrides, (b) Table Reservation approvals/declines, and (c) Live Menu Management (item creation, price edits, availability toggles).
- **FR-25:** The system shall synchronize menu modifications and order status transitions instantly across Manager and Customer views via shared Context providers and persistent local storage (`@aura_*` keys).

### Module 8: Patron Profile & Concierge Lounge (`ProfileScreen.js`)

- **FR-26:** The system shall render a luxury Black-Tie VIP Patron Passport Card displaying cardholder credentials, membership tier (`EMERALD PRIVILEGE PATRON`), and member ID (`AUR-PK-2026-9041`).
- **FR-27:** The system shall display dining metrics pods reflecting total restaurant visits, gastronomy spend in PKR, and reward points.
- **FR-28:** The system shall offer concierge dining preference selectors and an illuminated dark/light theme switch.
- **FR-29:** The system shall provide a secure session sign out mechanism that wipes active session tokens and resets navigation to the Login gate.

---

## 4. Non-Functional Requirements

- **NFR-01 (Usability & Aesthetics):** The application shall follow luxury dining design aesthetics, using custom lustrous emerald teal (`#0D9488`), radiant mint (`#14B8A6`), champagne gold (`#D97706`), and obsidian slate (`#0F172A`) color palettes, 16px touch targets, smooth 3D button animations, and high-contrast typography.
- **NFR-02 (Performance & 60 FPS Scrolling):** Heavy list cards (`MenuItemCard`) shall be memoized using `React.memo` and stable `useCallback` action references. Toggling an item's favorite state shall re-render only the target card.
- **NFR-03 (Responsiveness):** UI layouts shall dynamically adapt across standard mobile phone viewports (360px to 480px width) and tablet form factors, utilizing flexible percentages, `Dimensions` listeners, and `SafeAreaProvider`.
- **NFR-04 (Maintainability & Clean Architecture):** Source code shall strictly adhere to modular separation under `src/` (components, screens, context, reducers, hooks, data, navigation, theme).
- **NFR-05 (Client-Side Data Integrity):** The application shall execute without external server dependencies, persisting key user sessions, custom menu items, orders, and reservations across app restarts via `safeStorage` (in-memory + AsyncStorage fallback with `@aura_*` keys).
- **NFR-06 (Memory Leak Prevention):** Every asynchronous timer (`setTimeout`, `setInterval`) across loading screens and order tracking steppers shall include explicit cleanup functions executed upon component unmount.

---

## 5. Client-Side Data Model (Mock Data Schema)

| Data Set Name    | Primary Fields & Data Types                                                                                                                                                                                                                                                                                                                                       | Description & Business Purpose                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Users**        | `id` (String), `name` (String), `email` (String), `password` (String), `role` ('customer' \| 'manager'), `phone` (String), `membership` (String), `avatar` (String)                                                                                                                                                                                               | Stores patron and restaurant staff profiles (`Zainab Malik`, `Chef Farhan Siddiqui`, `Hamza Abbasi`) used for authentication and role-based routing. |
| **Categories**   | `id` (String), `name` (String), `icon` (String)                                                                                                                                                                                                                                                                                                                   | Enumerates the 4 culinary courses: Starters, Mains, Desserts, and Drinks.                                                                            |
| **MenuItems**    | `id` (String), `name` (String), `description` (String), `price` (Number), `category` (String), `image` (String), `isSpecial` (Boolean), `isAvailable` (Boolean), `prepTime` (String), `rating` (Number)                                                                                                                                                           | Catalog of 16 artisan culinary dishes; editable in real-time by kitchen managers.                                                                    |
| **Tables**       | `id` (String), `number` (Number), `capacity` (Number), `location` ('Indoor' \| 'Patio' \| 'Rooftop'), `isOccupied` (Boolean)                                                                                                                                                                                                                                      | Physical dining tables used for seating assignment and party size matching.                                                                          |
| **Reservations** | `id` (String), `customerName` (String), `customerPhone` (String), `partySize` (Number), `date` (String), `timeSlot` (String), `tableId` (String), `status` ('confirmed' \| 'pending' \| 'declined' \| 'cancelled'), `createdAt` (String)                                                                                                                          | Table bookings made by customers; reviewed and actioned by restaurant managers.                                                                      |
| **Orders**       | `id` (String), `userId` (String), `customerName` (String), `items` (Array of CartItem), `subtotal` (Number), `serviceCharge` (Number), `tax` (Number), `discount` (Number), `total` (Number), `orderType` ('dine-in' \| 'takeaway'), `tableNumber` (String/null), `status` ('Pending' \| 'Preparing' \| 'Ready' \| 'Served' \| 'Cancelled'), `timestamp` (String) | Active culinary orders dispatched from checkout, tracked live by patrons and updated by staff.                                                       |

---

## 6. UML Architectural Diagrams & Summaries

### 6.1. Use Case Diagram

- **Caption:** Figure 6.1: AURA Use Case Diagram (Actors: Customer & Restaurant Manager).
- **Architectural Explanation:** The use case diagram models interactions between the primary actors (Customer and Restaurant Manager) and the system boundaries. The Customer interacts with 8 core use cases including Menu Discovery, Search & Filter, Cart Customization, Table Reservation, and Order Placement. The `Place Order` use case demonstrates an `<<include>>` relationship with `Calculate Totals` and an `<<extend>>` relationship with `Apply Promo Code`. The Restaurant Manager oversees kitchen workflows through `Manage Incoming Orders`, `Review Reservations`, and `Update Menu Catalog`.

### 6.2. Class / Domain Model Diagram

- **Caption:** Figure 6.2: Object-Oriented Domain Model & Class Relationships.
- **Architectural Explanation:** The domain model represents system entities and structural multiplicities. The base class `User` is specialized into `Customer` and `Manager`. A `Customer` aggregates one `Cart`, which holds 0..\* `CartItem` instances referencing `MenuItem` objects. An `Order` is generated from a `Cart`, encapsulating financial computations and referencing an optional `Table`. Tables maintain a 1-to-many relationship with `Reservations`. All methods adhere to encapsulation and type safety.

### 6.3. Sequence Diagram (Customer Places an Order)

- **Caption:** Figure 6.3: End-to-End Sequence Diagram for Order Placement.
- **Architectural Explanation:** Traces the chronological message exchanges between `Customer`, `MenuScreen`, `CartScreen`, `cartReducer`, `OrdersContext`, and `OrderTrackingScreen`. When a diner taps "Add to Cart", a dispatch invokes `ADD_ITEM`. In `OrderSummaryScreen`, the diner selects dining mode and confirms checkout. `OrdersContext` instantiates an order record, clears the cart via `CLEAR_CART`, and navigates the patron to `OrderTrackingScreen` where interval timers initiate live status progression.

### 6.4. State Machine Diagram (Order Lifecycle)

- **Caption:** Figure 6.4: Finite State Machine for Culinary Order Lifecycle.
- **Architectural Explanation:** Illustrates the discrete lifecycle states of an order: `Pending` ➔ `Preparing` ➔ `Ready` ➔ `Served`. Secondary branch transitions include cancellation to `Cancelled` from `Pending` state. Transitions are triggered either by automated interval timers (10s, 20s, 30s) or manual manager status override events from the Operations Console.

### 6.5. Component Diagram (React Native Architecture)

- **Caption:** Figure 6.5: React Native Component & Context Dependency Diagram.
- **Architectural Explanation:** Shows the modular frontend architecture. The root `AppNavigator` encapsulates `SafeAreaProvider` and 5 Context Providers (`ThemeProvider`, `AuthProvider`, `MenuProvider`, `CartProvider`, `OrdersProvider`). Screens consume contexts via specialized custom hooks (`useTheme`, `useAuth`, `useCart`, `useOrders`, `useReservation`, `useForm`, `useDebounce`). Subordinate presentation components such as `MenuItemCard` are decoupled and optimized with `React.memo`.

---

## 7. MVP Frontend Development (React Native Screen Specifications)

### 7.1. Login and Signup Screen (`LoginScreen.js`)

- **Purpose:** Single-screen authentication portal featuring 3D flip card animations, architectural crest medallion, sliding segmented floor pass, and twin VIP RFID keycard credentials.
- **UI Elements:** Sliding floor switcher tabs (Patron Sign In / New Registration), capsule-structured text inputs for Name, Email, Password, Confirm Password, eye toggles, interactive dual-role cards, 3D gradient action button, one-touch VIP RFID digital keycards (`Zainab Malik` & `Chef Farhan`).
- **Navigation Entry & Exit:** Entry point of the app; on customer login/signup navigates to `CustomerApp (Menu)`, on manager login navigates to `ManagerDashboard`.
- **Local Data & State:** Controlled via `useForm` hook (`values`, `errors`, `handleChange`, `handleSubmit`, `reset`, `isValid`), `showPassword`, `showConfirmPassword`, `isSubmitting`, `selectedPass`.
- **Hooks Used & Why:** Custom `useForm` for form state and validation; `useRef` for 3D flip and bounce scale animations; `useAuth` to dispatch login/signup; `useTheme` for dynamic styling.

### 7.2. Menu Browsing Screen (`MenuScreen.js`)

- **Purpose:** High-end culinary menu showcase featuring real-time category filtering, 100% Halal Artisan banner, and special highlights.
- **UI Elements:** Horizontal category selector chips, pull-to-refresh FlatList, dish cards with image, price in PKR, rating, prep time, "Daily Special" badge, and heart favorite toggle.
- **Navigation Entry & Exit:** Default tab in `CustomerTabs`; can navigate to item details or tray.
- **Local Data & State:** `menuItems`, `isLoading`, `error`, `refreshing`, `selectedCategory`, `favouriteIds` array.
- **Hooks Used & Why:** `useState` for items and filters; `useEffect` for 1.5s simulated Promise fetch with unmount cleanup; `useMemo` for derived category lists; `useCallback` for memoized item handlers.

### 7.3. Search and Scroll Controls (Integration in `MenuScreen.js`)

- **Purpose:** High-speed item search with debouncing and instant scroll-to-top controls.
- **UI Elements:** Search input bar with search icon, clear button, recent search suggestion tags, floating "Back to top" arrow button, render counter debug label.
- **Navigation Entry & Exit:** Embedded directly within the Menu screen view hierarchy.
- **Local Data & State:** `searchQuery`, `debouncedQuery` (from `useDebounce`), `isSearchFocused`, `recentSearches` array, `showBackToTop` boolean.
- **Hooks Used & Why:** `useRef` to maintain TextInput reference and persistent render counter; `useDebounce` custom hook for 400ms delay; `useRef` for FlatList scrollToOffset; `useMemo` for combined filter and sort pipeline.

### 7.4. Profile and Theme Screen (`ProfileScreen.js`)

- **Purpose:** Black-Tie VIP Patron Passport, dining metrics analytics, and global dark/light luxury theme configuration.
- **UI Elements:** Gold-foiled digital membership card (`Zainab Malik`), metric pods (14 visits, Rs 48.5k spent, 2,450 pts), concierge dining preferences chips, illuminated theme switch, manager operations direct launch button, security sign out deck.
- **Navigation Entry & Exit:** Fourth tab in `CustomerTabs`; logout resets navigation stack back to `Login`.
- **Local Data & State:** Reads active session from `useAuth` and theme state from `useTheme`, local `dietaryPrefs` array.
- **Hooks Used & Why:** `useAuth` for user details and `logout()`; `useTheme` for `isDark` and `toggleTheme()`.

### 7.5. Cart Screen (`CartScreen.js`)

- **Purpose:** Interactive culinary tray allowing quantity adjustments, dietary notes, and voucher redemption.
- **UI Elements:** Scrollable list of cart items with quantity steppers (+/-), per-item special instruction input fields, delete button, promo code entry with apply button (`AURA10`, `AURA20`, `AURA50`), checkout button.
- **Navigation Entry & Exit:** Second tab in `CustomerTabs`; checkout button navigates to `OrderSummary`.
- **Local Data & State:** `promoInput`, `promoError`, `promoSuccess`, items from `useCart`.
- **Hooks Used & Why:** `useCart` to access reducer state and dispatch actions (`INCREMENT_QUANTITY`, `DECREMENT_QUANTITY`, `UPDATE_NOTE`, `APPLY_PROMO`, `REMOVE_PROMO`); `useTheme` for theme tokens.

### 7.6. Order Summary Screen (`OrderSummaryScreen.js`)

- **Purpose:** Itemized financial verification and dining mode selection prior to kitchen dispatch.
- **UI Elements:** Dine-in vs. Takeaway selector tabs, Table number selector / pickup time picker, itemized breakdown, tax/service charge summary card, confirm order button.
- **Navigation Entry & Exit:** Pushed onto RootStack from `CartScreen`; on confirmation navigates to `OrderTracking`.
- **Local Data & State:** `diningMode` ('dine-in' \| 'takeaway'), `selectedTable`, `pickupTime`.
- **Hooks Used & Why:** `useMemo` for subtotal, 5% service charge, 15% tax, discount, and grand total; `useOrders` to dispatch `createOrder()`; `useCart` to trigger `clearCart()`.

### 7.7. Table Reservation Screen (`ReservationScreen.js`)

- **Purpose:** Dine-in table booking portal with real-time slot conflict and seating capacity validation.
- **UI Elements:** Date picker chips, hourly time slot pills (12:00 to 22:00) with disabled unavailable states, party size stepper (1-12), contact phone input with Pakistani formatting validation, confirmation modal, My Reservations list.
- **Navigation Entry & Exit:** Third tab in `CustomerTabs`.
- **Local Data & State:** Pure UI presentation; delegates all state management to custom `useReservation` hook.
- **Hooks Used & Why:** `useReservation` custom hook for all business logic (selected slot, party size, availability calculation, booking creation, and cancellations); `useTheme` for styling.

### 7.8. Order Tracking & Manager Dashboard

- **Purpose:** Real-time customer kitchen progress monitor and comprehensive manager operations console.
- **UI Elements:**
  - _Tracking:_ Status step progress bar (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Served`), running elapsed seconds timer counter, order items receipt.
  - _Manager:_ 3-Tab interface: (1) Incoming Orders with manual status step buttons, (2) Reservation requests with Accept/Decline, (3) Menu item manager with price editing, availability toggles, and new item creation.
- **Navigation Entry & Exit:** `OrderTracking` is pushed from `OrderSummary`; `ManagerDashboard` is accessed upon manager login or via restricted tab.
- **Local Data & State:** `activeTab` ('orders' \| 'reservations' \| 'menu'), `elapsedSeconds`, `editModalVisible`.
- **Hooks Used & Why:** `useEffect` with `setInterval` for automated status progression and 1-second elapsed counter; unmount cleanup functions; `useOrders`, `useMenu`, and `useReservation` for shared synchronized state.

---

_End of Software Requirements Specification (SRS): AURA Modern Artisan Kitchen & Botanica_
