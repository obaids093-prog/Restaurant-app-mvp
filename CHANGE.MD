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
- **Status:** Pending ⏳
- **Scope:** Modularize ~1,470 line `LoginScreen.js` into `src/screens/Login/` subcomponents (`SignInForm`, `SignUpForm`, `PhoneOtpStep`, `NameEntryStep`, `loginStyles.js`, `LoginScreen.js`).

### Item 6: CartScreen & OrderTrackingScreen Review
- **Status:** Pending ⏳
- **Scope:** Check line counts and split into subcomponents if files exceed ~600 lines.

### Item 7: Code Hygiene & Design System Alignment
- **Status:** Pending ⏳
- **Scope:** Verify design tokens, fonts, theme colors, and loading/empty/error states across screens.

### Item 8: Documentation Updates
- **Status:** Pending ⏳
- **Scope:** Update `docs/ARCHITECTURE.md`, add `docs/REPO_MAP.md`, update `DESIGN_PROGRESS.md`.

### Item 9: Final Empirical Validation
- **Status:** Pending ⏳
- **Scope:** Verify all screen files are under 600 lines, bundle export passes cleanly, server files pass syntax check, and git log is clean.
