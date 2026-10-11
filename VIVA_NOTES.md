# VIVA NOTES — AURA Restaurant App

> Quick-reference guide for the oral viva. Every answer uses a **restaurant analogy** and ends with **Show in code:** pointing to the exact file and function.

---

## 1. How does the backend connect to MongoDB?

The backend uses **MongoDB Atlas**, a cloud-hosted MongoDB service. Think of it like the restaurant's **storeroom** being in a separate warehouse — the kitchen (Express server) doesn't keep ingredients locally; it connects to the warehouse over the internet. In `server/config/db.js`, the function `connectDB` calls `mongoose.connect(process.env.MONGO_URI)` which opens a persistent connection to Atlas using the connection string from the `.env` file. If the connection fails, it prints the error and calls `process.exit(1)` to stop the server immediately, because a restaurant cannot operate without its storeroom. After connecting, it also does a warm-up query on the `users` collection so the first real login is fast.

**Show in code:** `server/config/db.js` → `connectDB()` (lines 18–35); called from `server/server.js` line 28.

---

## 2. Why is the connection string not in the code?

The MongoDB connection string contains a username, password, and cluster address — like the key to the restaurant's cash register. If you put it in the code and push to GitHub, anyone can read it and steal or destroy your data. Instead, we store it in `server/.env` (which `.gitignore` excludes from Git). The code reads it at runtime via `process.env.MONGO_URI`. We provide `server/.env.example` with placeholders so a new developer knows what variables to set without seeing real secrets. The `.env` file has **never** been committed to Git.

**Show in code:** `server/.env.example` (placeholder values); `.gitignore` line `server/.env`; `dotenv.config()` in `server/server.js` line 25.

---

## 3. How does the app reach the backend? Why doesn't it talk to MongoDB directly?

The mobile app is like a **customer** sitting at a table — they don't walk into the kitchen themselves. They call the **waiter** (Express API) who takes the order, checks it, and passes it to the **kitchen** (MongoDB). The React Native app uses a centralized `apiClient` function in `src/api/client.js` that sends HTTP requests to `BASE_URL` (e.g., `http://192.168.100.17:5000`). It never imports Mongoose or talks to the database. This three-tier separation (App → Express → MongoDB) provides security (the database port is not exposed to the internet) and lets the server enforce business rules before any data is saved.

**Show in code:** `src/api/client.js` → `apiClient()` (lines 28–111); `BASE_URL` on line 18.

---

## 4. How is each collection stored?

| Collection | Model File | Mongoose Model Name | Key Fields |
|---|---|---|---|
| `users` | `server/models/User.js` | `User` | name, email (unique, lowercase), password (hashed), role (`customer` or `manager`), phone, dob, avatar |
| `menuitems` | `server/models/MenuItem.js` | `MenuItem` | name, description, price (min 0), category (enum: Starters/Mains/Desserts/Drinks), image, isSpecial, isAvailable, prepTime, rating, tag |
| `tables` | `server/models/Table.js` | `Table` | tableNumber (unique), name, seats (min 1), location, isWindow, isAvailable |
| `reservations` | `server/models/Reservation.js` | `Reservation` | user (ObjectId ref), table (ObjectId ref), date, time, guests, status (Pending/Confirmed/Cancelled/Declined), specialRequests |
| `orders` | `server/models/Order.js` | `Order` | user (ObjectId ref), items (sub-documents with menuItem ref, name, price, quantity), totalAmount, orderType, tableNumber, status (Pending/Preparing/Ready/Served/Cancelled), notes |

Think of each model as a **section of the storeroom**: users is the employee register, menuitems is the recipe book, tables is the floor plan, reservations is the booking diary, and orders is the kitchen ticket queue.

**Show in code:** All files inside `server/models/`.

---

## 5. Path of key operations — screen to database

### 5a. Register

1. User fills name, email, password on `LoginScreen.js` (signup mode).
2. Screen calls `auth.register()` in `AuthContext.js` → `apiClient('/api/auth/register', { method: 'POST', body })`.
3. Express routes the request via `server/routes/authRoutes.js` → `register` function in `server/controllers/authController.js`.
4. Controller validates input, checks for duplicate email (`User.findOne`), hashes password with `bcrypt.genSalt(10)` + `bcrypt.hash()`, forces `role: 'customer'`, and calls `User.create()`.
5. Mongoose saves the document into the `users` collection in MongoDB Atlas. A JWT token is generated and returned.

**Show in code:** `src/context/AuthContext.js` → `register()`; `server/controllers/authController.js` → `register()` (lines 28–97).

### 5b. Login

1. User enters email and password on `LoginScreen.js`.
2. Screen calls `auth.login()` → `apiClient('/api/auth/login', { method: 'POST', body })`.
3. Controller finds user by email, compares password with `bcrypt.compare()`, returns JWT if match.

**Show in code:** `server/controllers/authController.js` → `login()` (lines 102–143).

### 5c. Place Order

1. Customer builds cart on `CartScreen` (all client-side, uses `useReducer` with `cartReducer.js`).
2. `OrderSummaryScreen` dispatches `POST /api/orders` via `apiClient`.
3. `orderController.js` → `placeOrder()` looks up **every** `MenuItem` from the database by its `_id`, checks `isAvailable`, and **recalculates** the total server-side. It never trusts the client price.
4. `Order.create()` saves a new document with status `Pending`.

**Show in code:** `server/controllers/orderController.js` → `placeOrder()` (lines 30–129).

### 5d. Book a Table

1. Customer picks a table, date, time, and party size on `ReservationScreen`.
2. App sends `POST /api/reservations`.
3. `reservationController.js` → `createReservation()` checks capacity (`table.seats >= guests`) and checks for double-booking (`Reservation.findOne` with same table, date, time and active status). If a conflict exists, returns **409 Conflict**. If no conflict, `Reservation.create()` saves it.

**Show in code:** `server/controllers/reservationController.js` → `createReservation()` (lines 17–82).

---

## 6. How did the menu and tables get in? (seed.js)

Think of `seed.js` as the restaurant's **opening-day setup crew**. You run `npm run seed` and it: (1) connects to MongoDB, (2) **deletes everything** in all 5 collections (`deleteMany`), (3) hashes passwords with bcrypt, (4) inserts 3 demo users (1 manager + 2 customers), 16 menu items across 4 categories, 8 tables, one sample reservation, and one sample order.

⚠️ **Warning:** Running `npm run seed` destroys all existing data in the database and replaces it with fresh demo data. Never run it on a production database.

**Show in code:** `server/seed.js` → `seedData()` (lines 27–353).

---

## 7. How are passwords stored?

Passwords are **never** stored as plaintext — like a restaurant never keeps the cash register key in an open drawer. During registration, the controller generates a random salt with `bcrypt.genSalt(10)` (10 rounds = 2^10 hashing iterations) and then hashes the password with `bcrypt.hash(password, salt)`. Only the hash is saved in the `users` collection. During login, `bcrypt.compare(enteredPassword, storedHash)` checks if they match without ever reversing the hash.

**Show in code:** `server/controllers/authController.js` → `register()` lines 63–64; `login()` line 117.

---

## 8. What do Express, routes, controllers, and middleware do?

Think of the backend as a restaurant's **front-of-house operation**:

| Concept | Restaurant Analogy | What It Does |
|---|---|---|
| **Express** | The restaurant building itself | A Node.js framework that listens for HTTP requests on port 5000 |
| **Routes** | The menu board at the entrance | Maps URL paths to the correct handler: e.g., `POST /api/auth/login` → `authController.login` |
| **Controllers** | The waiter/chef who processes the order | Functions that contain the actual business logic (validate input, query DB, return response) |
| **Middleware** | The security guard at the door | Functions that run **before** the controller: `protect` checks JWT tokens; `managerOnly` checks role; `express.json()` parses the request body; `helmet()` adds security headers; `mongoSanitize()` strips NoSQL injection operators |

**Show in code:** `server/server.js` (middleware chain); `server/routes/*.js` (all 5 route files); `server/controllers/*.js` (all 5 controllers); `server/middleware/auth.js` (`protect` and `managerOnly`).

---

## 9. JWT, protect, managerOnly, 401 vs 403

**JWT (JSON Web Token):** When a customer logs in, the waiter gives them a **VIP wristband** (JWT token) that proves who they are. The token contains the user's `_id` and is signed with `JWT_SECRET`. It expires in 1 day (`expiresIn: '1d'`).

- **`protect` middleware:** Checks the `Authorization: Bearer <token>` header. Verifies the token using `jwt.verify()` with algorithm pinned to `HS256`. Finds the user in the DB and attaches `req.user`. If the token is missing → **401 Unauthorized** ("No token"). If expired/invalid → **401** ("Token failed").

- **`managerOnly` middleware:** After `protect` runs, this checks `req.user.role === 'manager'`. If the user is a customer → **403 Forbidden** ("Access denied: Manager role required").

**401 vs 403:** 401 means "I don't know who you are" (no wristband). 403 means "I know who you are, but you're not allowed in the VIP area" (customer trying to access manager routes).

**Show in code:** `server/middleware/auth.js` → `protect()` (lines 17–48) and `managerOnly()` (lines 50–55); `server/controllers/authController.js` → `generateToken()` (lines 19–23).

---

## 10. Why is the total computed on the server?

Imagine a customer writing their own bill — they could put Rs. 1 for a Rs. 8,800 Wagyu steak! The client app sends item IDs and quantities, but the server **ignores** any price or total from the client. In `placeOrder()`, for each item, it calls `MenuItem.findById()` to get the **real price** from MongoDB and multiplies it by the quantity. This prevents price manipulation.

**Show in code:** `server/controllers/orderController.js` → `placeOrder()` lines 88–91 (comment: "We do NOT trust any price or total sent by the client").

---

## 11. How is double booking prevented?

Two layers of protection, like a **double-lock** on the reservation book:

1. **Application-level check:** In `createReservation()`, before creating the booking, we query `Reservation.findOne({ table, date, time, status: { $in: ['Pending', 'Confirmed'] } })`. If a match exists, return **409 Conflict**.

2. **Database-level unique index:** In `Reservation.js`, a **partial unique compound index** on `{ table, date, time }` with `partialFilterExpression: { status: { $in: ['Pending', 'Confirmed'] } }` means MongoDB itself rejects duplicates even under race conditions. If two requests slip past the application check simultaneously, Mongoose catches the `error.code === 11000` and returns 409.

**Show in code:** `server/controllers/reservationController.js` → `createReservation()` lines 45–56 (application check) and lines 74–79 (index catch); `server/models/Reservation.js` lines 58–66 (partial unique index).

---

## 12. Order status rules

Kitchen orders follow a **one-way conveyor belt**: `Pending → Preparing → Ready → Served`. An order can only move **forward**, never backwards.

- **Manager** can advance the status to any later stage (e.g., Pending → Ready directly, or step-by-step).
- **Customer** can **only cancel** their own `Pending` order within a **10-minute window** (`CANCEL_WINDOW_MINUTES = 10` in `server/config/constants.js`). After that, or once the kitchen starts cooking, cancellation is blocked.
- The cancel operation uses an **atomic** `findOneAndUpdate` with filter `{ _id, user, status: 'Pending' }` so even if the status changed between the check and the update, it won't cancel a non-Pending order.

**Show in code:** `server/controllers/orderController.js` → `updateOrderStatus()` (lines 169–261); `server/config/constants.js` → `CANCEL_WINDOW_MINUTES`.

---

## 13. 10-second polling

The `OrderTrackingScreen` checks for order updates every 10 seconds, like a customer **glancing at the kitchen window** to see if their food is ready. It uses `setInterval` inside a `useEffect` hook that calls `GET /api/orders/my`. When there are no active orders (all orders are `Served` or `Cancelled`), the polling **stops automatically** to avoid wasting network requests.

**Show in code:** `src/screens/OrderTrackingScreen.js` → `useEffect` with `setInterval` (polling interval: 10,000 ms).

---

## 14. Phone OTP in 5 lines

1. User enters a Pakistani mobile number (e.g., `0300-1234567`); `normalizePakPhone()` validates and normalizes it to `03XXXXXXXXX` format.
2. Server generates a 4-digit code using `crypto.randomInt(1000, 10000)`, stores it in an **in-memory `Map`** (not in the database) with a 5-minute expiry, and prints it to the server console (simulated SMS — the code is **never** returned in the response).
3. 30-second resend cooldown prevents spam.
4. User submits the code; `verifyPhoneOtp()` checks it. After 3 wrong attempts, the code is **invalidated**.
5. If correct, the server either logs in the existing user (found by phone) or creates a new customer account automatically, and returns a JWT.

**Show in code:** `server/controllers/authController.js` → `sendPhoneOtp()` (lines 367–411) and `verifyPhoneOtp()` (lines 416–519).

---

## 15. How was the API tested and what do the screenshots prove?

The API was tested using **Postman** (collection at `A2/restaurant-api.postman_collection.json` with auto-token capture). Each screenshot in `A2/screenshots/` proves a specific test case:

| Screenshot | What It Proves |
|---|---|
| `200statusok.png` | Health route (`/api/health`) returns 200 OK on laptop |
| `phone-health.jpeg` | Same health route works from a mobile device on the network |
| `menupostok.png` | Menu POST without a token returns 401 Unauthorized |
| `menupostcutomertokenok.png` | Menu POST with a customer token returns 403 Forbidden |
| `menu 201-created.png` | Menu POST with a manager token returns 201 Created |
| `menu-success.png` | Successful menu operation (200 OK) |
| `menu-negative-price-400.png` | Menu POST with negative price returns 400 Bad Request (server validation works) |
| `menu-invalid-id-400.png` | Menu GET with an invalid ObjectId returns 400 Bad Request |
| `menu400bad request.png` | Another 400 validation failure case |
| `menuitemcollection1.png` / `menuitemcollection2.png` | MongoDB Atlas `menuitems` collection showing real documents |
| `customerloginok.png` | Customer login successful (200 OK, JWT returned) |
| `managerloginok.png` | Manager login successful |
| `manager200-ok.png` | Manager-only operation successful (200 OK) |
| `deletetestdish 200-ok.png` | Menu item deletion successful (200 OK) |
| `price-manager.png` | Price updated by manager device |
| `newprice-customer.jpeg` | Same updated price reflected on customer device (real-time sync proof) |

**Show in code:** `A2/screenshots/` directory; `A2/restaurant-api.postman_collection.json`.

---

## 16. Status codes used

| Code | Meaning | Where Used |
|---|---|---|
| **200** | OK — Successful request | Login, getMe, updateProfile, updateStatus, getOrders, getReservations |
| **201** | Created — New resource created | Register, createStaff, placeOrder, createReservation, addMenuItem |
| **400** | Bad Request — Validation failed | Missing fields, negative price, invalid ObjectId, password too short, avatar too large |
| **401** | Unauthorized — No or invalid token | Missing Bearer token, expired JWT, invalid JWT |
| **403** | Forbidden — Insufficient role | Customer accessing manager-only routes (managerOnly middleware) |
| **404** | Not Found — Resource missing | Menu item, order, reservation, or user not found |
| **409** | Conflict — Duplicate resource | Duplicate email on register, double-booked table reservation |
| **429** | Too Many Requests — Rate limited | Auth rate limiter (30 attempts / 15 min), OTP resend cooldown, OTP max 3 wrong attempts |
| **500** | Internal Server Error — Unexpected failure | Catch blocks in all controllers (error details logged server-side, generic message sent to client) |

**Show in code:** All controllers in `server/controllers/`; rate limiter in `server/server.js` lines 97–126.

---

## 17. Top 10 Extra Viva Questions

**Q1: What is Mongoose?**
Mongoose is an ODM (Object Data Modeling) library for MongoDB and Node.js. It lets us define schemas (like blueprints) for our documents and provides validation, type casting, and query helpers. Show in code: every file in `server/models/`.

**Q2: What is CORS and why do we need it?**
CORS (Cross-Origin Resource Sharing) allows our React Native web app (running on port 8081) to call the backend (port 5000). Without it, browsers block cross-origin requests. Show in code: `server/server.js` lines 37–64.

**Q3: What happens if the server is offline when the user logs in?**
The `apiClient` has a 15-second `AbortController` timeout. If the server is unreachable, it throws "Cannot reach server. Check your Wi-Fi and try again." The login button stops loading (via `finally` block) and shows the error. Show in code: `src/api/client.js` lines 55–58, 100–101.

**Q4: What is `useReducer` and why use it for the cart?**
`useReducer` is a React hook for managing complex state with many related transitions. The cart has 10 actions (add, remove, increment, decrement, set order type, update note, apply promo, remove promo, clear, sync prices), making `useReducer` with a pure reducer function cleaner than multiple `useState` calls. Show in code: `src/reducers/cartReducer.js`.

**Q5: What is `useEffect` used for?**
`useEffect` runs side effects after render — like fetching menu items when the screen opens, or starting a polling interval. It takes a dependency array; an empty array `[]` means "run once on mount." Show in code: `src/screens/MenuScreen.js` (menu fetch), `src/screens/OrderTrackingScreen.js` (10s polling).

**Q6: What is `useMemo` and why use it?**
`useMemo` memoizes expensive computations so they only re-run when dependencies change. On MenuScreen, `useMemo` filters and sorts the menu list so it doesn't re-compute on every render. Show in code: `src/screens/MenuScreen.js` (filtered items), `src/screens/CartScreen.js` (memoized totals).

**Q7: What is `React.memo`?**
`React.memo` wraps a component so it only re-renders when its props change. MenuItemCard uses it to avoid re-rendering every card when one item is added to the cart. Show in code: `src/components/MenuItemCard.js`.

**Q8: How does theme toggling work?**
`ThemeContext.js` provides a `useTheme` hook with `isDark`, `theme` (colors object), and `toggleTheme`. The toggle stores the preference in AsyncStorage and switches all colors via Context. Every screen reads `theme` from the context. Show in code: `src/context/ThemeContext.js`.

**Q9: What is helmet and mongoSanitize?**
`helmet()` sets security headers like `X-Content-Type-Options` and `Strict-Transport-Security`. `express-mongo-sanitize` strips keys starting with `$` or containing `.` from request body/query/params to prevent NoSQL injection attacks. Show in code: `server/server.js` lines 35 and 71.

**Q10: Can a customer create a manager account?**
No. Public registration (`POST /api/auth/register`) **always** forces `role: 'customer'` regardless of what the client sends. Manager accounts can only be created by an existing manager via `POST /api/auth/staff` (protected by `protect` + `managerOnly`). Show in code: `server/controllers/authController.js` → `register()` line 73; `createStaffAccount()` line 327.

---

## 18. Five Honest Weaknesses (with safe answers)

1. **Token in AsyncStorage / safeStorage:** AsyncStorage is not encrypted on all platforms. *Safe answer:* "For a production app, I would use `expo-secure-store` which uses the OS keychain, but for this assignment scope, `safeStorage` (a wrapper with web fallback) is sufficient."

2. **Public `/api/tables` endpoint:** Anyone can see the table layout without authentication. *Safe answer:* "Tables are not sensitive data — it is like displaying the floor plan on the restaurant's website. If needed, adding `protect` middleware is a one-line change."

3. **In-memory OTP storage:** OTP codes are stored in a JavaScript `Map`, which means they are lost if the server restarts and don't work with multiple server instances. *Safe answer:* "For production, I would use Redis with a TTL key. The current approach is fine for a single-server assignment demo."

4. **No pagination on list endpoints:** `GET /api/orders` and `GET /api/reservations` return all records (up to a limit of 100). *Safe answer:* "For a real restaurant with thousands of orders, I would add cursor-based pagination. The current `limit` query parameter provides basic protection."

5. **No HTTPS in local development:** The app communicates over plain HTTP on the local network. *Safe answer:* "In production, the server would be behind a reverse proxy (like Nginx or Cloudflare) with TLS certificates. Locally, HTTP is standard for Expo development."

---

## 19. Cheat Sheet (10 lines)

```
1. Backend: Express + MongoDB Atlas. Mongoose models define schemas for 5 collections.
2. Connection: server/config/db.js → mongoose.connect(process.env.MONGO_URI). Fails → process.exit(1).
3. Security: Passwords → bcrypt(10 rounds). JWT → 1-day expiry, HS256. Secrets in .env (never committed).
4. Auth flow: protect middleware → verifies JWT → attaches req.user. managerOnly → checks role. 401 vs 403.
5. API client: src/api/client.js → single apiClient() with 15s timeout, auto-attaches Bearer token.
6. Cart: useReducer + pure reducer (10 actions). Totals computed via useMemo. Cards use React.memo.
7. Orders: Server recalculates total from DB prices (never trusts client). Status: Pending→Preparing→Ready→Served.
8. Reservations: Double-booking prevented by app-level check + partial unique compound index (409 Conflict).
9. OTP: crypto.randomInt 4-digit code, in-memory Map, 5-min expiry, 3-attempt limit, 30s cooldown.
10. Polling: OrderTrackingScreen polls GET /api/orders/my every 10s. Stops when no active orders remain.
```
