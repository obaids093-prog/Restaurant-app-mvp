# Project Changes & Progress Log (CHANGE.MD)

## User Prompt & Core Directives
> **User Prompt:**
> "STRUCTURE CLEANUP AND CODE HYGIENE on branch cleanup-structure. Read docs/REDESIGN_BRIEF.md and docs/ARCHITECTURE.md first. Goal: small, well organised, clean files like a senior developer would leave them, with ZERO behaviour change. Never git push, never delete anything that was not in a list I approved, never print secrets. One commit per numbered item. After each item reply in at most 8 lines. Run the android bundle export at the end of each item (it must pass with 0 errors; fix any error before committing). Every JSX tag must be balanced.
> 
> KEEP AS THEY ARE (do not move, rename or delete): src/context, src/reducers (cartReducer.js unchanged), src/hooks, src/navigation, src/theme, src/config, src/api (client.js untouched), src/utils, src/components/ui, server/ (all of it), A1, A2, uml, designs/stitch, docs, assets referenced by app.json or code, README.md, LICENSE, VIVA_NOTES.md, .env.example, seed.js, the Postman collection, package.json and lock files. Each screen keeps its current file path and default export so AppNavigator is untouched."

---

## Roadmap Items & Status

### Item 0: Read-Only Audit & Approved Deletion List
- **Status:** Completed ✅
- **Details:** Identified all misplaced root files, dead scripts, unused assets, and duplicate/dead code.

### Item 1: Cleanup Approved Misplaced Files & Dead Code
- **Status:** Completed ✅ (Commit `22ca4a5`)
- **Details:** 
  - Cleaned up root misplaced docs (`CLAUDE.md`, `GSD-STYLE.md`, `PROJECT_RULES.md`, `model_capabilities.yaml`, `VERSION`), test scripts, empty directories, and unused assets.
  - Removed dead code, unused imports, and demo logs in 9 files.
  - Verified bundle build and committed.

### Item 2: MenuScreen Modularization
- **Status:** Completed ✅
- **Details:**
  - Decomposed 1,000+ line `MenuScreen.js` into focused, cohesive modules under `src/screens/Menu/`:
    - `menuStyles.js`: Design system styles, constants (`CATEGORIES`, `SORT_OPTIONS`, etc.), and pure helpers (`filterAndSortDishes`, `resolveReorderItems`).
    - `HeroCarousel.js`: Chef's pick hero carousel slide section.
    - `CategoryRow.js`: Horizontal categories section.
    - `OrderAgainRow.js`: Past order reorder row.
    - `DealsSection.js`: Promotional vouchers section.
    - `TopRatedRow.js`: Curated top-rated dishes row.
    - `FilterSheet.js`: Bottom sheet modal with sorting & filtering options.
    - `DishGrid.js`: 2-column FlatList, floating cart pill, explored item modal, and back-to-top button.
    - `MenuScreen.js`: Main state and composition container (reduced to clean structure).
    - `index.js`: Re-exporting container.
  - Replaced root `src/screens/MenuScreen.js` with direct re-export bridge preserving external navigation imports.
  - Android bundle export passed with 0 errors.

### Item 3: ReservationScreen Modularization
- **Status:** Completed ✅
- **Details:**
  - Decomposed 1,900+ line `ReservationScreen.js` into focused, cohesive subcomponents under `src/screens/Reservation/`:
    - `reservationStyles.js`: Shared styles, dining slot groups, sanctuary zone constants, and status helper functions.
    - `DateRow.js`: Next 7 days ribbon with availability status chips.
    - `PartyStepper.js`: Guest count stepper and quick 2/4/6/8+ guest selection pills.
    - `ZonePicker.js`: Curated dining zone selection (Glasshouse, Botanica Garden Terrace, Chef's Counter Booth).
    - `SlotGrid.js`: Time-slot grid separated by service periods with past/capacity checks.
    - `BookingForm.js`: Guest contact info, phone formatting, special requests, and error banners.
    - `BookTabContent.js`: Full composition for table booking with loading and connection retry states.
    - `ConfirmSheet.js`: Modal for pre-booking verification.
    - `SuccessSheet.js`: Bento-style confirmed reservation sheet.
    - `MyBookingsList.js`: Tabbed filterable reservation history with dynamic counts and cancellation handling.
    - `ReservationScreen.js`: Main state and composition shell.
    - `index.js`: Re-exporting container.
  - Replaced root `src/screens/ReservationScreen.js` with direct re-export bridge preserving external navigation imports.
  - Android bundle export passed with 0 errors.

### Item 4: ManagerDashboardScreen Modularization
- **Status:** Completed ✅
- **Details:**
  - Decomposed 2,480+ line `ManagerDashboardScreen.js` into focused subcomponents under `src/screens/Manager/`:
    - `managerStyles.js`: Shared dashboard styles, executive header styles, status helper mappings.
    - `OrderItemCard.js`: Ticket card with city badges, line items, cooking/ready/served progression and cancel buttons.
    - `ReservationCard.js`: Reservation card with slot badges, seating areas, special requests, and confirm/decline/visited/no-show actions.
    - `MenuItemCard.js`: Menu card with stock availability switch, inline price editing, and edit dish modal trigger.
    - `OverviewTab.js`: Executive greeting, live kitchen dispatch pulse, 3 real KPI cards, and quick shortcuts.
    - `OrdersTab.js`: Multi-branch filter pills, tabbed status filters, and live order list.
    - `ReservationsTab.js`: Multi-branch filter pills, status filter tabs, and reservations list.
    - `MenuStockTab.js`: Catalog list with Add Dish trigger and inline price editing.
    - `TeamTab.js`: Staff member registration form and existing team directory with role/status controls.
    - `AddDishModal.js`: Modal for adding dishes with device photo upload, presets, and categories.
    - `EditDishModal.js`: Modal for editing existing dish metadata and compressed photos.
    - `ManagerDashboardScreen.js`: Main state and executive console shell.
    - `index.js`: Re-exporting container.
  - Replaced root `src/screens/ManagerDashboardScreen.js` with direct re-export bridge preserving external navigation imports.
  - Android bundle export passed with 0 errors (1022 modules).

### Item 5: LoginScreen Modularization
- **Status:** Completed ✅
- **Details:**
  - Decomposed 1,500+ line `LoginScreen.js` into focused, clean subcomponents under `src/screens/Login/`:
    - `loginStyles.js`: Shared styles, entrance/ambient animations, and pure validation helper functions.
    - `BrandCanopy.js`: Luxury brand header with linear gradient, rotating ambient compass orbit, theme toggle, and logo emblem.
    - `EmailPasswordForm.js`: Email and password authentication with real-time password rules checklist and remembered credentials.
    - `PhoneOtpStep.js`: Mobile number input and 6-digit verification code step with OtpInput integration.
    - `NameEntryStep.js`: Onboarding profile step for newly registered phone users.
    - `GuestBrowseFooter.js`: Guest exploration CTA and subtle legal terms.
    - `LoginScreen.js`: Main shell container coordinating state, transitions, and auth methods.
    - `index.js`: Re-exporting container.
  - Replaced root `src/screens/LoginScreen.js` with direct re-export bridge preserving external navigation imports.
  - Cleared monolithic Cognitive Complexity issues completely.
  - Android bundle export passed with 0 errors (1029 modules).

### Item 6: CartScreen & OrderTrackingScreen Modularization
- **Status:** Completed ✅
- **Details:**
  - Modularized `CartScreen.js` (1,273 lines) into `src/screens/Cart/`:
    - `cartStyles.js`: Shared styling and named financial constants (`SERVICE_CHARGE_RATE`, `SALES_TAX_RATE`).
    - `EmptyClocheIllustration.js`: Pure View cloche illustration with ambient glow and sparks.
    - `CartEmptyState.js`: Empty tray graphic, welcome voucher banner, and Chef's recommendations row.
    - `CartItemCard.js`: Cart item card with thumbnail/fallback, price, delete confirmation, special instruction note, and quantity stepper.
    - `VoucherSection.js`: Patron privilege vouchers input, hints, and active promo badge.
    - `BillSummary.js`: Folio breakdown with subtotal, privilege savings, 5% service, 15% tax, and grand total.
    - `FloatingCartFooter.js`: Pinned bottom bar with item count, total price, and "Review Order" linear gradient button.
    - `CartScreen.js`: Main state and composition container.
    - `index.js`: Re-export for `CartScreen` and financial constants.
    - Replaced root `src/screens/CartScreen.js` with direct re-export bridge preserving external navigation imports.
  - Modularized `OrderTrackingScreen.js` (1,145 lines) into `src/screens/OrderTracking/`:
    - `trackingStyles.js`: Shared styling and status constants (`ACTIVE_STATUSES`, `CANCEL_WINDOW_MINUTES`).
    - `ActiveOrderHero.js`: Active order card with elapsed live timer, status pill, `OrderStepper`, items preview, and cancel order button.
    - `PastOrderCard.js`: Historical folio card with dish preview, expandable digital receipt, reorder flavors, and pending order cancel actions.
    - `TrackingEmptyState.js`: Empty state with cloche beacon and artisan menu CTA.
    - `OrderTrackingScreen.js`: Main state container with 10s live kitchen polling, filter tabs, and order history.
    - `index.js`: Re-export for `OrderTrackingScreen` and constants.
    - Replaced root `src/screens/OrderTrackingScreen.js` with direct re-export bridge preserving external navigation imports.
  - Android bundle export passed with 0 errors (1042 modules).


### Item 7: Code Hygiene & Design System Alignment
- **Status:** Completed ✅
- **Details:**
  - Audited all screen files for hardcoded hex colors outside the theme system.
  - `OrderSummaryScreen.js`: Replaced hardcoded `#ef4444` error red with `colors.error` from theme in error banner (background, border, icon, and text).
  - `OnboardingScreen.js`: Replaced hardcoded `#141211` / `#F8F9FA` background with `colors.background` from theme (already had `useTheme` imported).
  - Intentional brand gradient arrays (`#FC5834`, `#1E293B`, etc. in `ProfileScreen.js`), icon-on-solid-color whites (`#FFFFFF`), and `shadowColor: '#000000'` are intentional design decisions and left untouched.
  - Android bundle export passed with 0 errors (1043 modules).


### Item 8: Documentation Updates
- **Status:** Completed ✅
- **Details:**
  - Updated `docs/ARCHITECTURE.md` with Section D (Modular Screen Architecture), specifying the modular folder breakdown for all 6 decomposed screens and documenting the bridge pattern.
  - Created `docs/REPO_MAP.md` providing a comprehensive, structured map of root, client, screens, and server architecture.
  - Updated `DESIGN_PROGRESS.md` with Step 13 capturing all `cleanup-structure` branch milestones and metrics.
  - Android bundle export verified passing with 0 errors.

### Item 9: Final Empirical Validation
- **Status:** Completed ✅
- **Details:**
  - **Screen Modularization**: 6 oversized screens modularized into focused component modules (`Menu/`, `Reservation/`, `Manager/`, `Login/`, `Cart/`, `OrderTracking/`). All sub-components are small, reusable units (< 400 lines) with root backward-compatible re-export bridges preserving `AppNavigator.js` untouched.
  - **Server Syntax Check**: Executed `node --check` across all project server JS files (`server/server.js`, `server/controllers/*.js`, `server/models/*.js`, `server/routes/*.js`), passing with exit code 0.
  - **Android Bundle Export**: Verified `expo export -p android --no-bytecode` passes cleanly with 0 errors (1043 modules bundled in 12s).
  - **Git History**: Clean, atomic commits per numbered item (Item 1 to Item 9) on `cleanup-structure` branch without pushing.

