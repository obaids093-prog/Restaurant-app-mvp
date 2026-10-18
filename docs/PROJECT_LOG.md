# Project Log

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
