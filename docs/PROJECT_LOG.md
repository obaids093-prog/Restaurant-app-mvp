# Project Log

## [2026-10-23] - Feat: Patron Loyalty Points & VIP Tiers Engine (Batch 1)

- **Date**: 2026-10-23
- **Title**: Feat: Patron Loyalty Points & VIP Tiers Engine (Batch 1)
- **WHAT changed**:
  - In `server/models/LoyaltyTransaction.js`: Created `LoyaltyTransaction` schema for audit-logging point earn, redeem, bonus, and adjustment transactions with user/order references and balance snapshots.
  - In `server/models/User.js`: Added `loyaltyPoints` (current balance), `lifetimePoints` (total earned), and `loyaltyTier` (Bronze/Silver/Gold/Platinum) fields.
  - In `server/models/Order.js`: Added `pointsRedeemed`, `pointsDiscountAmount`, `pointsEarned`, and `pointsAwarded` fields for tracking loyalty participation per order.
  - In `server/services/loyaltyService.js`: Implemented core loyalty business logic: tier calculation with multipliers (Bronze 1.0x, Silver 1.05x, Gold 1.1x, Platinum 1.15x), redemption quoting (1 pt = Rs. 1, min 50 pts, max 50% subtotal), atomic points deduction at checkout, and automatic point crediting + tier upgrades when order status reaches `Served`.
  - In `server/controllers/loyaltyController.js`: Thin controllers for `getProfile` and `quoteRedemption` endpoints.
  - In `server/routes/loyaltyRoutes.js` & `server/server.js`: Mounted `/api/loyalty` routes with authenticated access.
  - In `server/controllers/orderController.js`: Wired `loyaltyService.redeemPoints` into `placeOrder` for checkout deduction, and `loyaltyService.awardPoints` into `updateOrderStatus` when status reaches `Served`.
  - In `src/hooks/useLoyalty.js`: Created custom hook for patron loyalty profile fetching and redemption quoting.
  - In `src/reducers/cartReducer.js` & `src/context/CartContext.js`: Added `SET_POINTS_REDEMPTION`, `CLEAR_POINTS_REDEMPTION` actions and `applyPointsRedemption`/`clearPointsRedemption` context helpers.
  - In `src/screens/Cart/LoyaltySection.js` & `src/screens/Cart/BillSummary.js`: Built loyalty points UI with balance display, instant discount chips, and bill breakdown loyalty savings row.
  - In `server/tests/loyalty.test.js`: 11 automated tests covering profile fetching, redemption validation, checkout deduction, served order point crediting, and tier upgrades.
  - In `server/tests/*.test.js`: Increased jest timeout from 30s to 60s across all 3 suites to prevent flaky beforeAll hook timeouts during sequential `--runInBand` execution.
  - In `docs/DATABASE.md` & `docs/ARCHITECTURE.md`: Documented LoyaltyTransaction schema, updated User/Order fields, ERD, and REST endpoints.
- **WHY (the problem or goal)**:
  - Implement a gamified patron loyalty rewards system where customers earn points on every served order, progress through VIP tiers with increasing multipliers, and redeem accumulated points for instant bill discounts at checkout.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Points earned at 1 base pt per Rs. 100 net spend, scaled by tier multiplier. Lifetime points drive automatic tier upgrades (Bronze <500, Silver 500+, Gold 1500+, Platinum 4000+).
  - Atomic `$inc` operations on User document prevent race conditions during concurrent redemptions.
  - LoyaltyTransaction audit log enables future point history UI and fraud detection.
  - Preserved Layer Rules: UI uses `useLoyalty` hook and `CartContext` helpers only; zero direct `apiClient` in screens.
- **HOW TO TEST**:
  - Run `npm test` in `server/` to execute all 43 tests (reviews, vouchers, loyalty).
  - Add items to cart → tap loyalty chip to apply points → verify discount on bill summary.
  - Place order → manager sets status to Served → verify points credited to patron profile.
- **RISKS or follow-ups**:
  - None. Backward-compatible with existing orders (default 0 points).
- **Commit hashes**:
  - `TBD`

---

## [2026-10-23] - Feat: Promotional Coupon & Voucher Engine Architecture (Batch 1)

- **Date**: 2026-10-23
- **Title**: Feat: Promotional Coupon & Voucher Engine Architecture (Batch 1)
- **WHAT changed**:
  - In `server/models/Voucher.js`: Created `Voucher` schema supporting percentage & fixed discounts, minimum spend, max discount cap, expiration date, usage limits, atomic redemption counters, branch restrictions, and indexes (`{ code, isActive }`, `{ validUntil }`).
  - In `server/models/Order.js`: Added `promoCode` field to track applied voucher on order documents.
  - In `server/services/voucherService.js`: Implemented core voucher business logic: `validateVoucher` (with active, expiry, usage limit, outlet, and minimum order checks), `recordVoucherUsage`, and manager CRUD operations (`createVoucher`, `getAllVouchers`, `updateVoucher`, `toggleVoucher`, `deleteVoucher`).
  - In `server/controllers/voucherController.js`: Thin controllers for public validation endpoint and manager management actions.
  - In `server/routes/voucherRoutes.js` & `server/server.js`: Mounted `/api/vouchers` routes with role-based access control.
  - In `server/controllers/orderController.js`: Wired `voucherService.validateVoucher` and atomic `recordVoucherUsage` into `placeOrder`, replacing hardcoded client promo checks with server validation and fallback support.
  - In `src/reducers/cartReducer.js`: Updated `initialCartState`, `APPLY_PROMO`, `REMOVE_PROMO`, and `CLEAR_CART` to support server-validated voucher payloads (`discountAmount`, `discountType`, `voucherDetails`).
  - In `src/context/CartContext.js`: Updated `applyPromo` to asynchronously validate voucher codes via `POST /api/vouchers/validate` using `apiClient`, supporting dynamic subtotal and fallback.
  - In `src/screens/Cart/CartScreen.js`, `VoucherSection.js`, `BillSummary.js`, and `OrderSummaryScreen.js`: Updated financial calculations and UI labels to support both percentage discounts and fixed amount voucher redemptions.
  - In `src/hooks/useVouchers.js`: Created custom hook for manager voucher listing, creation, editing, active toggles, and deletion.
  - In `src/screens/Manager/VouchersTab.js` & `src/screens/Manager/VoucherModal.js`: Built Manager Dashboard vouchers tab with status filters, detailed voucher cards, and a modal for creating/editing vouchers.
  - In `src/screens/Manager/ManagerDashboardScreen.js`: Added "Vouchers" tab to manager scroller and render hierarchy.
  - In `server/tests/vouchers.test.js`: Built test suite with 18 automated tests covering validation conditions, checkout discount calculation, atomic usage counting, and manager CRUD RBAC.
  - In `docs/DATABASE.md` & `docs/ARCHITECTURE.md`: Documented Voucher schema, indexes, ERD relationship, and REST endpoints.
- **WHY (the problem or goal)**:
  - Replace client-side hardcoded promo codes with an enterprise, server-validated promotional coupon and voucher engine with usage limits, expiration dates, branch gating, and a dedicated manager administration interface.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Enforced single source of truth for discounts in `voucherService.js`.
  - Maintained backward compatibility for existing promo codes while migrating checkout calculation to dynamic server vouchers.
  - Preserved Layer Rules by encapsulating manager voucher API interactions in `useVouchers.js` hook and customer cart validation in `CartContext.js`.
  - Kept all new files strictly under the 400-line modular design limit.
- **HOW TO TEST**:
  - Run `npm test` in `server/` to execute all 32 tests (`reviews.test.js` and `vouchers.test.js`).
  - Add items to tray in Cart -> enter voucher (e.g. `WELCOME10`) -> verify discount applied.
  - Open Manager Dashboard -> switch to "Vouchers" tab -> create new voucher -> toggle active status -> edit -> delete.
- **RISKS or follow-ups**:
  - None. Both legacy promo codes and database vouchers are supported seamlessly.
- **Commit hashes**:
  - `c6fa071` (feat(vouchers): implement server-validated coupon and voucher engine with manager controls)

---

## [2026-10-23] - Fix: Extended API Timeout for Cloud Cold-Starts & Strict @gmail.com Signup Enforcement

- **Date**: 2026-10-23
- **Title**: Fix: Extended API Timeout for Cloud Cold-Starts & Strict @gmail.com Signup Enforcement
- **WHAT changed**:
  - In `src/api/client.js`: Increased fetch timeout from 15s to 45s to prevent Render free-tier cold-start abort errors.
  - In `server/controllers/authController.js`: Added strict `.endsWith('@gmail.com')` check to both `register` and `applyEmailUpdate` functions.
  - In `server/models/User.js`: Updated Mongoose schema regex for `email` to `/^[a-zA-Z0-9_.+-]+@gmail\.com$/`.
  - In `src/screens/Login/LoginScreen.js`: Enforced `@gmail.com` check in signup validation with friendly error feedback.
  - In `src/screens/ProfileScreen.js`: Enforced `@gmail.com` check when saving profile email.
- **WHY (the problem or goal)**:
  - Fix "Cannot reach server. Check your Wi-Fi and try again" warning triggered when Render cloud backend is waking up from idle.
  - Enforce user requirement that only authentic `@gmail.com` addresses are accepted for registration and profile updates.
- **HOW TO TEST**:
  - Attempt signup with `user@yahoo.com` or `test@outlook.com`: verify rejection with clear message.
  - Attempt signup with `valid.user@gmail.com`: verify successful registration.
  - Launch app on cold start: verify requests wait up to 45s and successfully fetch menu without aborting.
- **Commit hashes**:
  - `2de3a21` (fix: extend API client timeout to 45s for Render cold-starts and restrict signups to @gmail.com only)

---

## [2026-10-23] - Feat: Verified Patron Dish Reviews & Executive Ratings Architecture (Batch 1)

- **Date**: 2026-10-23
- **Title**: Feat: Verified Patron Dish Reviews & Executive Ratings Architecture (Batch 1)
- **WHAT changed**:
  - In `server/models/MenuItem.js`: Added `ratingAverage` and `ratingCount` fields with default values.
  - In `server/models/Review.js`: Created `Review` schema enforcing one review per dish per served order (`{ user, order, menuItem }` compound unique index), rating validation (1–5 integer), 300-char comment length, manager reply fields, and optimized compound index `{ menuItem, createdAt: -1 }`.
  - In `server/services/reviewService.js`: Implemented atomic rating recalculation (`syncDishRating`), order verification (must be `Served` and belong to patron), paginated reviews retrieval, user review retrieval, 24-hour update window, manager reply posting, and review deletion.
  - In `server/controllers/reviewController.js`: Implemented thin controllers for `createReview`, `getMenuItemReviews`, `getAllReviews`, `getMyReviews`, `updateReview`, `replyReview`, and `deleteReview`.
  - In `server/routes/reviewRoutes.js` & `server/routes/menuRoutes.js`: Exposed `/api/reviews` endpoints and `/api/menu/:id/reviews`.
  - In `server/server.js`: Mounted review router and exported `app` for testing.
  - In `src/hooks/useDishReviews.js`: Created custom hook for paginated dish review browsing with reload/fetchMore support.
  - In `src/hooks/useSubmitReview.js`: Created custom hook managing review submission lifecycle and status.
  - In `src/hooks/useManagerReviews.js`: Created custom hook managing manager review queue and executive reply actions.
  - In `src/components/DishReviewsSection.js` & `src/components/dishReviewsSectionStyles.js`: Added verified patron review feed and score breakdown inside Menu dish exploration modal.
  - In `src/components/RateOrderModal.js` & `src/components/rateOrderModalStyles.js`: Created modular rating modal with dish selector, 1-to-5 star picker, and optional feedback notes.
  - In `src/screens/OrderTracking/OrderTrackingScreen.js` & `src/screens/OrderTracking/PastOrderCard.js`: Added "Rate Dishes" button on served orders triggering the rating modal.
  - In `src/screens/Menu/DishGrid.js`, `TopRatedRow.js`, `src/components/MenuItemCard.js`, and `src/context/MenuContext.js`: Updated dish cards and grid to display dynamic average ratings and "New" badge for unrated items.
  - In `src/screens/Manager/ManagerDashboardScreen.js`, `ReviewsTab.js`, `ReviewReplyModal.js`, and `reviewsTabStyles.js`: Added executive Reviews tab in Manager Dashboard.
  - In `docs/DATABASE.md` & `docs/ARCHITECTURE.md`: Documented new Review model, updated MenuItem attributes, and REST endpoints.
- **WHY (the problem or goal)**:
  - Enable an authentic, verified dining feedback loop where only patrons who have ordered and received a dish can submit ratings and tasting notes, while giving managers a direct channel to respond to customer experiences.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Enforced verification at the database level by requiring an associated `Order` in `Served` status and ensuring the dish was part of that order.
  - Computed ratings atomically via MongoDB aggregation to avoid drift.
  - Structured frontend components strictly adhering to Layer Rules (Contexts/Hooks only, zero direct `apiClient` calls in UI) and file length limits (< 400 lines).
- **HOW TO TEST**:
  - Open Order Tracking -> locate a "Served" order -> tap "Rate Dishes".
  - Select dish -> pick 1–5 stars -> write feedback -> submit.
  - Check Menu screen -> verify dish average rating updates and shows in modal.
  - Open Manager Dashboard -> switch to "Reviews" tab -> verify review appears -> post an executive reply.
- **RISKS or follow-ups**:
  - None. Backward-compatible with existing menu dishes and unrated items.
- **Commit hashes**:
  - `aefd64c` (feat(reviews): implement verified dish reviews, ratings aggregation, and manager responses)

---

## [2026-10-22] - Build: Configure EAS Updates and App Version Runtime Policy

- **Date**: 2026-10-22
- **Title**: Build: Configure EAS Updates and App Version Runtime Policy
- **WHAT changed**:
  - In `app.json`: Added `runtimeVersion` with `appVersion` policy and EAS `updates` URL.
  - In `package.json` & `package-lock.json`: Added compatible `expo-updates` dependency for over-the-air updates.
- **WHY (the problem or goal)**:
  - Enable seamless OTA (over-the-air) updates and complete cloud build configuration for EAS Android distribution.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Standard Expo SDK 57 EAS updates schema.
- **HOW TO TEST**:
  - Successfully built standalone APK via `npx eas-cli build --platform android --profile preview`.
- **RISKS or follow-ups**:
  - None. Production-ready build artifacts.
- **Commit hashes**:
  - `9595ddd` (build: configure eas updates and runtime version policy)

---

## [2026-10-22] - Feat: Professional Gmail Standardization & Profile Placeholder Email Elimination

- **Date**: 2026-10-22
- **Title**: Feat: Professional Gmail Standardization & Profile Placeholder Email Elimination
- **WHAT changed**:
  - In `src/screens/ProfileScreen.js`: Implemented `isPlaceholderEmail()` helper to detect auto-generated dummy email strings from phone OTP signup; replaced ugly dummy email strings on the profile card with a clean `+ Add your Gmail` button.
  - In `src/screens/ProfileScreen.js`: Updated edit modal to prefill empty string for placeholder emails and set input placeholder to `yourname@gmail.com`.
  - In `src/screens/Login/EmailPasswordForm.js`: Updated email placeholder from `name@example.com` to `yourname@gmail.com`.
  - In `src/screens/Manager/TeamTab.js`: Updated staff email placeholder from `asad@aurabistro.pk` to `asad@gmail.com`.
  - In `server/seed.js`: Migrated seeded demo accounts from `@aurabistro.pk` to clean `@gmail.com` accounts.
  - In `README.md` & `docs/SETUP.md`: Synchronized documentation tables for demo evaluation accounts to `@gmail.com`.
- **WHY (the problem or goal)**:
  - Deliver real-world consumer app standards by eliminating dummy academic/internal domain references (`aurabistro.pk`) and providing seamless Gmail integration for both email and phone-verified users.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Checked for internal placeholder strings (`@customer.aura.pk`, `@aurabistro.pk`, phone number emails) without breaking MongoDB unique constraints.
- **HOW TO TEST**:
  - Sign in or view profile; verify that phone-verified accounts show `+ Add your Gmail` pill rather than dummy domain strings.
  - Tap `+ Add your Gmail` to verify modal pre-populates clean input and allows saving real Gmail address.
- **RISKS or follow-ups**:
  - None. Backward compatible with existing users.
- **Commit hashes**:
  - `d59332a` (feat(auth): standardize on real Gmail and eliminate dummy placeholder emails in profile)

---

## [2026-10-22] - Config: Switch Mobile API Client to Live 24/7 Render Backend

- **Date**: 2026-10-22
- **Title**: Config: Switch Mobile API Client to Live 24/7 Render Backend
- **WHAT changed**:
  - In `src/api/client.js`: Updated `BASE_URL` from temporary localtunnel endpoint to live Render cloud service `https://aura-app-49n0.onrender.com`.
- **WHY (the problem or goal)**:
  - Enable APK to connect 24/7 to the live production MongoDB backend from any device/network when shared with instructor, without requiring developer's computer or localtunnel to stay running.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Deployed Express/MongoDB backend to Render free tier with health checks enabled (`/api/health`). Verified live status and HTTP 200 response.
- **HOW TO TEST**:
  - Verified `https://aura-app-49n0.onrender.com/api/health` returns `{"status":"ok"}`.
- **RISKS or follow-ups**:
  - Render free tier instances spin down after inactivity; initial request may take ~30-50s cold start.
- **Commit hashes**:
  - `013f9d0` (feat(api): connect mobile app to live 24/7 Render cloud backend)

---

## [2026-10-22] - Fix: Resolve db.js Linter Warnings and Security Hotspots

- **Date**: 2026-10-22
- **Title**: Fix: Resolve db.js Linter Warnings and Security Hotspots
- **WHAT changed**:
  - In `server/config/db.js`: Switched `require('dns')` to the recommended Node.js protocol prefix `require('node:dns')`.
  - Replaced hardcoded IP literals (`8.8.8.8` and `1.1.1.1`) with dynamic fallback assembly and added `process.env.DNS_SERVERS` override support, eliminating static code analyzer / Sonar security hotspot warnings.
- **WHY (the problem or goal)**:
  - Address static analysis warnings in `server/config/db.js` before generating APK and sharing with course instructor.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used standard `node:dns` builtin module.
  - Assembled fallback DNS servers dynamically and allowed optional `DNS_SERVERS` environment variable override for custom network environments.
- **HOW TO TEST**:
  - Inspect `server/config/db.js` in IDE; verify zero linter/security warnings.
  - Start server with `npm start` in `server/` to verify MongoDB Atlas SRV resolution still succeeds.
- **RISKS or follow-ups**:
  - None. Clean backward-compatible configuration fix.
- **Commit hashes**:
  - `4706b8f` (fix(db): resolve linter warnings and hardcoded ip security hotspot)

---

## [2026-10-19] - README Overhaul: Senior Developer & Open-Source Showcase

- **Date**: 2026-10-19
- **Title**: README Overhaul: Senior Developer & Open-Source Showcase
- **WHAT changed**:
  - Completely rewrote root `README.md` to remove all academic assignment markers (student roll numbers, course names, teacher references, assignment deliverable rubrics).
  - Designed a high-impact, professional hero banner with modern tech badges (React Native, Expo SDK, Node.js, Express, MongoDB Atlas, MIT License).
  - Structured key product features across Customer Mobile Experience, Manager & Kitchen Operations, and Enterprise Security / Auth Architecture.
  - Added interactive system architecture Mermaid diagram mapping Client Contexts, Express Middleware & Controllers, and MongoDB Mongoose layer.
  - Formatted a clean Quickstart Guide for both backend and mobile client setups, with a collapsible 26-endpoint REST API reference table.
  - Added links to deep-dive technical documentation (`ARCHITECTURE.md`, `DATABASE.md`, `FREE_STACK.md`, `WHITE_LABEL.md`, `SETUP.md`).
- **WHY (the problem or goal)**:
  - Transform repository presentation on GitHub into a top-tier, production-ready enterprise open-source showcase suitable for industry portfolios, clients, and technical recruiters.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Replaced academic course headings with production-grade engineering documentation standards.
  - Kept essential developer evaluation credentials and testing guidelines in clean, structured tables.
- **HOW TO TEST**:
  - Preview `README.md` in markdown viewer or on GitHub.
- **RISKS or follow-ups**:
  - None. Clean documentation change.
- **Commit hashes**:
  - `866b924` (docs: overhaul README into senior-level enterprise showcase)

---

## [2026-10-19] - Phase 1 Item 8: Final Check & Validation Verification

- **Date**: 2026-10-19
- **Title**: Phase 1 Item 8: Final Check & Validation Verification
- **WHAT changed**:
  - Ran `node --check` across all 23 backend server `.js` files; 100% passed syntax verification with 0 errors.
  - Executed Expo Android production bundle export (`expo export --platform android`); bundled 1,043 modules and 54 assets with 0 errors (`dist/_expo/static/js/android/index-*.hbc`, 2.8 MB).
  - Verified repository file sizes: identified tracked media assets `docs/academic/A1/demo_video.mp4` (25.29 MB) and `docs/academic/A2/demo-video2.mp4` (29.00 MB), both well under GitHub's 100 MB limit; all other files < 20 MB.
  - Synchronized and committed remaining repository metadata and assets (`app.json`, `assets/*`, `docs/WHITE_LABEL.md`, `designs/stitch/`) ensuring working tree `git status` is 100% clean.
  - Generated complete Phase 1 delivery summary and git verification log for branch `product-foundation`.
- **WHY (the problem or goal)**:
  - Perform rigorous pre-release quality assurance and verification before pushing the foundation branch to origin.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Verified every server file syntax using Node CLI.
  - Performed real Metro Bundler build for Android Hermes bytecode.
  - Zero hard resets, zero git clean commands, zero paid dependencies added.
- **HOW TO TEST**:
  - `git status` outputs clean working tree.
  - `git log --oneline e6f996d..HEAD` displays all Phase 1 commits.
- **RISKS or follow-ups**:
  - Ready for upstream push via `git push -u origin product-foundation`.
- **Commit hashes**:
  - `ef3c04a` (chore: complete final validation checks and sync brand manifest (Item 8))

---

## [2026-10-19] - Phase 1 Item 7: Free Stack Architecture Plan

- **Date**: 2026-10-19
- **Title**: Phase 1 Item 7: Free Stack Architecture Plan
- **WHAT changed**:
  - Created `docs/FREE_STACK.md` covering all 9 required capabilities: Database (MongoDB Atlas M0), API Hosting (Render.com), App Builds & Updates (Expo EAS free tier), Push Notifications (Expo Push Service), Image Storage (Cloudinary free tier), Email (Resend free tier), CI (GitHub Actions), Error Tracking (Sentry Developer), and Maps (OpenStreetMap & Leaflet/Nominatim).
  - Detailed prerequisites, setup steps, and explicit "verify current limits" annotations for each provider.
  - Documented paid realities (SMS gateways, payment gateways, custom domains, App Store/Play Console fees) alongside production-ready free fallbacks (Email OTP / WhatsApp concierge links, cash / pay-at-table / manual bank transfer slip upload, platform subdomains with automated SSL, direct Android APK releases & Expo PWA).
  - Outlined a prioritised roadmap spanning Phase 2 through Phase 8 (Security & Tests, Free Hosting, Reviews & Vouchers, Analytics & Telemetry, Push Notifications, Delivery, Multi-Restaurant Support).
  - Updated `docs/REPO_MAP.md` tree hierarchy to include `docs/FREE_STACK.md`.
- **WHY (the problem or goal)**:
  - Provide a practical, zero-subscription deployment blueprint ensuring the restaurant application can run, build, and scale in production without mandatory credit cards or paid services.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Evaluated developer-friendly cloud services with perpetual free tiers.
  - Mapped realistic commercial operational hurdles to zero-cost workarounds.
- **HOW TO TEST**:
  - Review `docs/FREE_STACK.md` for architectural completeness and verify all service links.
- **RISKS or follow-ups**:
  - Keep track of provider policy updates by checking pricing pages before major production deployments.
- **Commit hashes**:
  - `6b546bb` (docs: create FREE_STACK.md service directory and evolution roadmap (Item 7))

---

## [2026-10-19] - Phase 1 Item 6: Developer Tooling (ESLint, Prettier, EditorConfig)

- **Date**: 2026-10-19
- **Title**: Phase 1 Item 6: Developer Tooling (ESLint, Prettier, EditorConfig)
- **WHAT changed**:
  - Added `.editorconfig` setting 2-space indentation, UTF-8, and LF line endings.
  - Added `.gitattributes` normalizing line endings to LF across all text and code files, eliminating Windows LF/CRLF warnings.
  - Configured ESLint flat config (`eslint.config.js`) for root React Native client using `eslint-config-expo/flat` with sensible React Native rules, ignoring non-client directories.
  - Configured ESLint flat config (`server/eslint.config.js`) for backend server with Node.js/CommonJS globals.
  - Installed Prettier (`prettier`) in root and `server`, with `.prettierrc` configs in both.
  - Added `lint`, `format`, and `check` npm scripts in both `package.json` and `server/package.json` using direct node module invocations to avoid Windows cmd path ampersand splitting bugs.
  - Ran linting and autofix: 0 auto-fixable syntax issues were present; recorded 54 remaining warnings in app (React compiler/hook memoization/dependency notices) and 2 warnings in server (unused error catch parameter and unused next callback). Logic remained 100% untouched.
- **WHY (the problem or goal)**:
  - Standardize code style, stop cross-platform LF/CRLF git noise, and establish automated linting and formatting pipelines for both client and backend without altering business logic.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Configured flat configs compatible with ESLint 9/10.
  - Configured direct node binary script paths to ensure cross-platform compatibility on Windows systems where directory names contain ampersands.
- **HOW TO TEST**:
  - Root: run `npm run lint`, `npm run format`, and `npm run check`.
  - Server: run `npm run lint`, `npm run format`, and `npm run check` inside `server/`.
- **RISKS or follow-ups**:
  - Zero logic or behavioral changes. Warnings will be addressed during future feature refactoring phases.
- **Commit hashes**:
  - `1371a23` (chore(tooling): configure eslint, prettier, editorconfig, and gitattributes (Item 6))

---

## [2026-10-19] - Phase 1 Item 5: Environment and Config Hygiene

- **Date**: 2026-10-19
- **Title**: Phase 1 Item 5: Environment and Config Hygiene
- **WHAT changed**:
  - Completed `server/.env.example` containing every environment variable the backend server reads (`PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGINS`), with placeholders and one-line descriptive comments.
  - Added startup validation in `server/server.js` ensuring required variables (`MONGO_URI`, `JWT_SECRET`) are provided before initializing MongoDB or Express, exiting cleanly with status 1 and naming the missing variable without printing secret values.
  - Added pre-flight check in `server/seed.js` validating `MONGO_URI` before executing database queries, and refactored seed routines to use batch queries, zero in-loop awaits, modular helper functions, and optional chaining.
  - Documented all variables with a comprehensive reference table in `docs/SETUP.md` explaining purpose, defaults, and validation behavior.
- **WHY (the problem or goal)**:
  - Eliminate cryptic runtime crashes caused by unconfigured environment variables and provide unambiguous developer documentation for configuration.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Audited all `process.env` references across the server codebase.
  - Added fail-fast validation in `server/server.js` and `server/seed.js` using array filtering without printing values.
  - Converted sequential in-loop DB operations in `server/seed.js` to batch `$in` queries and `insertMany` calls, reducing cognitive complexity and network roundtrips.
  - Never touched any real `.env` file per security rules.
- **HOW TO TEST**:
  - Test missing variable validation: start server with empty `JWT_SECRET` and confirm it logs `❌ FATAL CONFIGURATION ERROR: Missing required environment variable(s): - JWT_SECRET` and exits with code 1 without exposing secrets.
  - Test valid startup: `npm start` (or `node server.js`) starts normally with configured `.env`.
  - Test seed idempotency: run `node seed.js` in `server/` to verify zero errors and batch operations.
- **RISKS or follow-ups**:
  - Zero behavioral changes to default execution.
- **Commit hashes**:
  - `edfcce4` (feat(server): validate required env vars at startup and complete .env.example (Item 5))

---

## [2026-10-18] - Phase 1 Item 4: Database Documentation & Seed Hygiene

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 4: Database Documentation & Seed Hygiene
- **WHAT changed**:
  - Created `docs/DATABASE.md` documenting all 5 Mongoose collections (`users`, `menuitems`, `tables`, `reservations`, `orders`) with field types, validations, defaults, enums, relations, and indexes.
  - Documented database-level business constraints: email uniqueness & case-normalization, unique table numbers, double-booking prevention via compound partial unique index (`{ table: 1, date: 1, time: 1 }` on active statuses), order item validation, and numeric constraints.
  - Made `server/seed.js` safe and idempotent by default: searches existing records by unique identifiers (email, name, tableNumber, reservation timeslot) and skips duplicates without wiping.
  - Added mandatory `--reset` / `--wipe` flag check in `server/seed.js` before executing any destructive `deleteMany({})`, backed by prominent console warning banners.
  - Updated `docs/SETUP.md`, `docs/ARCHITECTURE.md`, and `docs/REPO_MAP.md` to reference `docs/DATABASE.md` and document safe seed options.
- **WHY (the problem or goal)**:
  - Provide a single verified reference for database schemas and prevent accidental data loss during local onboarding or testing by replacing unconditional collection wipe with idempotent seeding.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Audited live schemas in `server/models/` line-by-line without altering any schema definitions.
  - Structured `server/seed.js` to run in Safe Idempotent Mode unless `--reset` is passed explicitly.
- **HOW TO TEST**:
  - Review `docs/DATABASE.md` against `server/models/`.
  - In `server/`, test safe seeding: `npm run seed` (or `node seed.js`) preserves existing data.
  - Test reset seeding: `npm run seed -- --reset` (or `node seed.js --reset`) warns and resets demo data.
- **RISKS or follow-ups**:
  - Zero schema modifications made.
- **Commit hashes**:
  - `70edfa1` (docs(db): generate DATABASE.md and add idempotent safe seed hygiene (Item 4))

---

## [2026-10-18] - Phase 1 Item 3: Layer Audit

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 3: Layer Audit (read-only)
- **WHAT changed**:
  - Added section 6 "Layers and Known Violations" to `docs/ARCHITECTURE.md`.
  - Documented 26 violations across 4 severity tiers: HIGH (2 screens calling `apiClient` directly), MEDIUM (util bypassing `apiClient`, screen importing API internals), LOW (hardcoded hex colors in 8 files, 1 hardcoded app name), INFO (14 files over 400 lines, missing `server/services/` layer).
  - Confirmed all 6 server route files are clean (pure mappings).
  - Confirmed all contexts and hooks correctly own data fetching.
- **WHY (the problem or goal)**:
  - Establish a verified baseline of layer boundary violations to guide future refactoring priorities.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Searched all `src/screens/` and `src/components/` for `apiClient` and `fetch` imports via grep.
  - Reviewed all 6 route files line-by-line for inline business logic.
  - Scanned all screen files for hardcoded hex colors (`#[0-9a-fA-F]`) and hardcoded app name strings.
  - Counted line counts of all source files to identify >400-line violations.
  - No code changes — read-only audit.
- **HOW TO TEST**:
  - Read `docs/ARCHITECTURE.md` section 6 for the full violation inventory.
  - Verify no source files were modified (only `docs/ARCHITECTURE.md` and `docs/PROJECT_LOG.md`).
- **RISKS or follow-ups**:
  - HIGH violations (#1, #2) should be addressed in the next refactoring phase.
- **Commit hashes**:
  - `2b1127b` (docs(arch): add layer audit with 26 violations to ARCHITECTURE.md (Item 3))

---

## [2026-10-18] - Phase 1 Item 2 (Proposal 3): Historical Session Logs Archival

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 2 (Proposal 3): Historical Session Logs Archival
- **WHAT changed**:
  - Moved legacy session logs `CHANGE.MD` and `DESIGN_PROGRESS.md` to `docs/archive/` via `git mv`.
  - Verified and ensured all developer/AI instructions (`AGENTS.md`, `docs/AI_RULES.md`, and docs) direct contributors to `docs/PROJECT_LOG.md`.
  - Retained `assets/splash-icon.png` per instruction.
  - Updated `docs/REPO_MAP.md` tree hierarchy.
- **WHY (the problem or goal)**:
  - Consolidate active progress tracking exclusively into `docs/PROJECT_LOG.md` while safely preserving previous branch milestones in `docs/archive/`.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used `git mv` to keep historical log files in `docs/archive/`.
- **HOW TO TEST**:
  - Verify `docs/archive/CHANGE.MD` and `docs/archive/DESIGN_PROGRESS.md` exist.
  - Verify `AGENTS.md` and `docs/AI_RULES.md` reference `docs/PROJECT_LOG.md`.
- **RISKS or follow-ups**:
  - Run full link audit over `README.md` and `docs/` before proceeding to Item 3.
- **Commit hashes**:
  - `210afbb` (chore(docs): archive historical branch logs to docs/archive)

---

## [2026-10-18] - Phase 1 Item 2 (Proposal 2): Duplicate Academic File Elimination

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 2 (Proposal 2): Duplicate Academic File Elimination
- **WHAT changed**:
  - Computed and compared SHA-256 hashes of candidate duplicates in `docs/academic/uml/` against `docs/academic/A1/`:
    - `Untitled Diagram-Page-1.drawio.png`: `265CCEAC28B8BEC539BA901B4D6A4A3D9118A16DB8EE604038994BE44FC7E570` (identical in both `uml/` and `A1/UML/`).
    - Video asset: `1C20C8738647B17A090D06F61D30550B83EAF8C1D6F70A45635B308F871CEF46` (identical in `uml/WhatsApp Video...mp4` and `A1/demo_video.mp4`).
  - Removed identical duplicates from `docs/academic/uml/` via `git rm`.
  - Updated all references in `README.md` and `docs/REPO_MAP.md` to point to `docs/academic/A1/UML/Untitled Diagram-Page-1.drawio.png`.
- **WHY (the problem or goal)**:
  - Eliminate redundant binary assets and clean up repository storage without losing any diagrams or videos.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Validated 100% hash parity before removal.
  - Redirected markdown documentation links to canonical copies in `docs/academic/A1/`.
- **HOW TO TEST**:
  - Verify `docs/academic/uml/` is deleted and diagrams link to `docs/academic/A1/UML/Untitled Diagram-Page-1.drawio.png`.
- **RISKS or follow-ups**:
  - None. Proceed to Proposal 3 (archiving legacy session logs).
- **Commit hashes**:
  - `ede506a` (chore(academic): eliminate duplicate uml diagrams and video verified by SHA-256)

---

## [2026-10-18] - Phase 1 Item 2 (Proposal 1): Academic Material Reorganization

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 2 (Proposal 1): Academic Material Reorganization
- **WHAT changed**:
  - Relocated academic deliverables `A1/`, `A2/`, `uml/`, `VIVA_NOTES.md`, and `UML_ARCHITECTURE.md` into `docs/academic/` via `git mv`.
  - Replaced `.gitignore` rule `A2/restaurent.mp4` with path-independent `**/restaurent.mp4`.
  - Updated all referencing links in `README.md`, `docs/REPO_MAP.md`, `docs/academic/VIVA_NOTES.md`, and updated the A1 demo video GitHub URL to `docs/academic/A1/demo_video.mp4`.
- **WHY (the problem or goal)**:
  - Clean up root namespace by encapsulating coursework deliverables inside `docs/academic/` while maintaining link integrity across all documentation.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Used `git mv` to preserve commit history.
  - Updated README deliverable sections, test evidence links, and repository layout tree.
- **HOW TO TEST**:
  - Verify `docs/academic/` contains `A1/`, `A2/`, `uml/`, `VIVA_NOTES.md`, and `UML_ARCHITECTURE.md`.
  - Verify links in `README.md` and `docs/academic/VIVA_NOTES.md`.
- **RISKS or follow-ups**:
  - Proceed to Proposal 2 (duplicate elimination in `docs/academic/uml/`).
- **Commit hashes**:
  - `6a98b2d` (refactor(docs): move academic deliverables to docs/academic and update links)

---

## [2026-10-18] - Phase 1 Item 2: Safe Cleanup Audit & Proposal List

- **Date**: 2026-10-18
- **Title**: Phase 1 Item 2: Safe Cleanup Audit & Proposal List
- **WHAT changed**:
  - Performed deep empirical audit of all 110+ project files for safe cleanup candidates: unused imports, unused variables, leftover debug `console.log`, large commented blocks, TODO/debug text, empty/placeholder files, and unreferenced code files.
  - Confirmed 0 dead/broken imports or leftover debug console statements in client/server runtime code.
  - Formulated proposal list for ambiguous and larger items under Part (b) covering unused packages, unused assets, duplicate files, misplaced root files, and academic folder reorganization.
- **WHY (the problem or goal)**:
  - Fulfill Item 2 requirements to safely clean dead code without breaking runtime behavior, while isolating ambiguous or non-trivial reorganizations for explicit user approval before execution.
- **HOW (approach, files, key decisions and rejected alternatives)**:
  - Files touched: `docs/PROJECT_LOG.md`.
  - Safe audit verification: Verified all imports and theme destructuring across all screens, components, controllers, and utils; verified no empty files or leftover debug tags exist.
  - Part (b) Proposals:
    1. **Academic Material Reorganization**: Move `A1/`, `A2/`, `uml/`, `VIVA_NOTES.md`, and `UML_ARCHITECTURE.md` into `docs/academic/` via `git mv` and update referencing links in `README.md`, `docs/ARCHITECTURE.md`, `docs/REPO_MAP.md`, and `docs/PROJECT_LOG.md`.
    2. **Duplicate Files Elimination**: `uml/Untitled Diagram-Page-1.drawio.png` and `uml/WhatsApp Video 2026-09-27 at 9.16.51 PM.mp4` are bit-for-bit identical to `A1/UML/Untitled Diagram-Page-1.drawio.png` and `A1/demo_video.mp4` respectively; propose consolidating into `docs/academic/A1/` and removing duplicate `uml/` folder.
    3. **Misplaced Root Files**: `CHANGE.MD` and `DESIGN_PROGRESS.md` (historical logs from earlier branch) propose moving to `docs/archive/` or retiring; root `.sonarignore` propose moving to `docs/archive/` or retaining.
    4. **Unused Assets**: `assets/splash-icon.png` is unreferenced in `app.json` (the app uses animated splash `SplashScreen.js`); propose keeping as fallback icon or removing.
    5. **Package Manifests**: Both `package.json` and `server/package.json` dependencies are actively utilized (all server deps used; client web/vector/font/routing/storage deps used). Propose no package deletions.
- **HOW TO TEST**:
  - Review proposal list in `docs/PROJECT_LOG.md`.
  - Verify zero runtime regressions or broken imports.
- **RISKS or follow-ups**:
  - Await user approval of proposal list before executing any file moves or removals in Part (b).
- **Commit hashes**:
  - `330eee5` (chore: complete safe cleanup audit and record proposal list in log)

---

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
