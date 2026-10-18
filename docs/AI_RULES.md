# AI & Developer Standing Rules

These standing rules apply to all AI assistants and human developers working on this codebase. Strict adherence is required at all times.

---

## 1. Session Initialization
- **Read First**: Always read `docs/PROJECT_LOG.md` and `docs/ARCHITECTURE.md` before making any modifications or planning work.
- If resuming an ongoing phase, inspect the last unfinished item in `docs/PROJECT_LOG.md` and check `git status` / `git log`.

## 2. Living Log & Documentation Protocol
- **Log Every Task**: Immediately after completing each task/item, append an entry to `docs/PROJECT_LOG.md` (newest entry on top).
- **Entry Format**:
  - `date`: YYYY-MM-DD
  - `title`: Short descriptive title of the task
  - `WHAT changed`: Bullet points of specific code/docs added, altered, or removed
  - `WHY (the problem or goal)`: Root cause, user requirement, or technical motivation
  - `HOW`: Implementation approach, files touched, architectural decisions, and rejected alternatives
  - `HOW TO TEST`: Concrete commands or manual steps to verify the change
  - `RISKS or follow-ups`: Potential edge cases, dependencies, or subsequent work needed
  - `commit hashes`: Git commit hash for the task
- **Keep Architecture and DB Docs Fresh**:
  - Update `docs/ARCHITECTURE.md` whenever app/server layers, navigators, screen structures, or API contracts change.
  - Update `docs/DATABASE.md` whenever Mongoose schemas, fields, default values, or indexes change.

## 3. Layer Rules (Section 4 Compliance)
- **App Side**:
  - Screens and UI components **must only** consume React Contexts (`useAuth`, `useCart`, `useMenu`, etc.), custom hooks, and safe utils.
  - Screens and UI components **must NEVER** call `fetch` or `apiClient` directly.
  - Contexts and hooks own all data fetching, cache handling, and network side-effects.
  - All HTTP communication must go strictly through `src/api/client.js`.
- **Server Side**:
  - **Routes** (`server/routes/`): Pure endpoint-to-middleware/controller mappings. No business logic in route files.
  - **Controllers** (`server/controllers/`): Keep controllers thin (parse request inputs, call domain logic, format HTTP response). Business logic will migrate to `server/services/` over time.
  - **Models** (`server/models/`): Own schemas, validation rules, types, defaults, and MongoDB indexes.
  - **Middleware** (`server/middleware/`): Own authentication, authorization (RBAC), security headers, upload handling, and rate limiting.
  - **Config** (`server/config/`): Database connection and environment configuration.

## 4. Free-Only Rule
- **No Paid Services**: Zero paid APIs, no paid cloud subscriptions, no paid domain names, and no credit-card-required dependencies.
- Every third-party integration must provide a generous, permanent free tier and must remain completely optional.
- If a service requires payment (SMS OTP gateways, paid maps, cloud storage), provide a safe free-tier or local dev fallback (e.g., console/email OTP, local upload storage, OpenStreetMap/static coords).

## 5. Secret Hygiene
- **NEVER** commit secrets, API keys, JWT secrets, database connection strings, or credentials.
- **NEVER** print secrets or environment values to terminal logs or responses.
- **NEVER** edit, overwrite, or touch any real `.env` file. Only manage `.env.example` templates with sanitized placeholders.

## 6. Commit Hygiene & Version Control
- **One Small Commit per Task**: Keep commits atomic and map directly to numbered requirements.
- Commit the `docs/PROJECT_LOG.md` entry alongside the code changes of that task.
- **NEVER run `git push`** (the user pushes manually).
- **NEVER run `git reset --hard` or `git clean`**.

## 7. File Size & Modular Structure
- Keep all files under approximately **400 lines**.
- If a screen or component grows beyond this threshold, decompose it into a modular folder (e.g., `src/screens/Menu/`) containing dedicated sub-components, local styles (`*Styles.js`), and a barrel `index.js` bridge export.

## 8. Styling & White-Label Tokenization
- Exclusively use theme tokens via `useTheme()` (`colors.*`, `typography.*`, `spacing.*`, `shadows.*`) from `src/theme/theme.js`.
- Exclusively use brand metadata (`BRAND.name`, `BRAND.tagline`, `BRAND.outlets`) and formatting helpers (`formatPrice`) from `src/config/brand.js`.
- **ZERO hardcoded hex/RGB colors** in screens or UI components.
- **ZERO hardcoded restaurant/app names** in screens or UI components.

## 9. Untouchable Files
The following files must remain completely untouched unless explicit instruction is provided:
- `src/reducers/cartReducer.js` (Cart state machine)
- `src/api/client.js` (Centralized API client)
- Any `.env` or `.env.local` files

## 10. How to Run and Test
- **Frontend App**:
  ```bash
  npm start            # Launch Expo development server
  npx expo start -c    # Clear cache and launch Expo dev server
  npx expo lint        # Run app linter
  ```
- **Backend API Server**:
  ```bash
  cd server
  npm start            # Run production server
  npm run dev          # Run dev server with nodemon
  npm run seed         # Seed database (inspect seed options)
  ```
- **Diagnostics & Typecheck**:
  ```bash
  npx tsc --noEmit     # Check TypeScript types (if enabled)
  node --check <file>  # Validate Node.js syntax
  ```
