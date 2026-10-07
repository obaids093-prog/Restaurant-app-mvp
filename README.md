# AURA: Artisan Kitchen & Modern Botanica

### Student Submission Details
* **Name:** Syed Obaid Ali
* **Roll No:** 9321
* **Subject:** Mobile Application Development (MAD)
* **Assignment:** Assignment 2 (A2 - Fall 2026)
* **Teacher:** Dr. Sadaf Tanvir

---

A luxury full-stack mobile restaurant system featuring a **React Native / Expo** mobile client connected to an **Express.js + MongoDB** REST API backend. The system features JWT-based role authentication, live menu management, conflict-free table reservations, real-time kitchen order pipelines with automated status polling, 3D physics animations, and emerald teal & champagne gold luxury palettes.

---

## 1. Submission Deliverables (A2 Folder)

The `A2/` directory contains all required non-code deliverables:
* **`A2/SRS_v2.pdf`**: Comprehensive Software Requirements Specification (v2.0) including:
  * Updated Scope & 10+ Technical Definitions
  * Database Schema Design Tables for 5 MongoDB Collections (`users`, `menuitems`, `tables`, `reservations`, `orders`)
  * Complete REST API Endpoints Specification (18 endpoints)
  * UML Sequence Diagram (`App` ➔ `Express Server` ➔ `MongoDB`)
  * UML Deployment Diagram (Physical architecture, protocols, ports)
* **`A2/restaurant-api.postman_collection.json`**: Postman Collection covering all 18 endpoints across Auth, Menu, Tables, Reservations, Orders, and Health checks. Includes auto-token capture on login.

---

## 2. Quick Installation & Execution Guide

### A. Backend Server Setup (Node.js + Express + MongoDB)
```bash
# 1. Navigate to the server folder
cd server

# 2. Install backend dependencies
npm install

# 3. Create .env configuration file (copy from .env.example)
# On Windows PowerShell:
Copy-Item .env.example .env

# 4. Configure server/.env:
# PORT=5000
# MONGO_URI=mongodb://127.0.0.1:27017/restaurant_db  (or your MongoDB Atlas connection string)
# JWT_SECRET=aura_artisan_secret_key_2026_jwt_token_auth
# JWT_EXPIRES_IN=1d

# 5. Seed initial database (creates hashed manager/customer accounts, 16 menu items, 6 tables)
npm run seed

# 6. Start development server with nodemon
npm run dev
# Server will run at http://localhost:5000
# Verify via browser: http://localhost:5000/api/health
```

### B. Mobile App Setup (React Native / Expo)
```bash
# 1. From root directory, install mobile dependencies
npm install

# 2. Configure BASE_URL in src/api/client.js:
# Open src/api/client.js and set BASE_URL based on your environment:
# - Android Emulator:       http://10.0.2.2:5000
# - iOS Simulator:          http://localhost:5000
# - Physical Phone (Expo):  http://<YOUR_COMPUTER_IP>:5000 (e.g., http://192.168.100.5:5000)

# 3. Start Expo development server
npx expo start
```
* **Press `w`**: Opens directly in your desktop browser.
* **Scan QR Code**: Scan via camera (iOS) or **Expo Go** app (Android) connected to the same Wi-Fi.
* **Press `a`**: Launches on Android Emulator.
* **Press `i`**: Launches on iOS Simulator.

---

## 3. Seeded Accounts & Login Credentials

All passwords in `server/seed.js` are securely hashed using `bcrypt` (10 salt rounds):

| Role | Full Name | Email Address | Password | Permissions & Capabilities |
|---|---|---|---|---|
| **Executive Manager** | Farhan Chef | `farhan.chef@aurabistro.pk`<br/>*(or `manager@aurabistro.com`)* | `Admin1234` | Kitchen order queue progression (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Served`), Table booking approval/decline, Menu CRUD (Add/Edit items, toggling Chef's Special). |
| **Dining Guest** | Zainab Malik | `zainab.malik@aurabistro.pk`<br/>*(or `customer@aurabistro.com`)* | `Password123` | JWT login/register, live menu browsing, cart reducer, promo vouchers, live order placement, 10s kitchen tracking, table reservations. |
| **Demo Customer** | Guest Diner | `user@test.com` | `Password1` | Customer testing account. |

*(Quick 1-tap pre-fill chips are available on the Login screen for instant evaluation during viva).*

---

## 4. API Endpoints Reference Table

| # | HTTP Method | Endpoint | Access / Auth | Description & Query Parameters |
|---|---|---|---|---|
| 1 | `GET` | `/api/health` | Public | Server liveness, uptime, and database connection status. |
| 2 | `POST` | `/api/auth/register` | Public | Registers a new customer or manager with hashed password. |
| 3 | `POST` | `/api/auth/login` | Public | Validates credentials, issues JWT token (expires in 1 day). |
| 4 | `GET` | `/api/auth/me` | Protected (`Bearer Token`) | Returns currently authenticated user profile. |
| 5 | `GET` | `/api/menu` | Public | Lists menu items. Query params: `?category=Steaks&search=wagyu`. |
| 6 | `GET` | `/api/menu/:id` | Public | Retrieves single item by MongoDB ObjectId. Validates ID format. |
| 7 | `POST` | `/api/menu` | Manager Only | Creates a new dish in the menu inventory. |
| 8 | `PUT` | `/api/menu/:id` | Manager Only | Updates dish details, pricing, availability, or Chef's special flag. |
| 9 | `DELETE` | `/api/menu/:id` | Manager Only | Permanently removes a menu item from the catalog. |
| 10 | `GET` | `/api/tables` | Public | Lists all restaurant dining tables with seating capacity & status. |
| 11 | `POST` | `/api/tables` | Manager Only | Registers a new physical dining table into the floor plan. |
| 12 | `POST` | `/api/reservations` | Protected | Creates table booking. Prevents double-booking (`409 Conflict`). |
| 13 | `GET` | `/api/reservations/my` | Protected | Retrieves booking history for the logged-in diner. |
| 14 | `GET` | `/api/reservations` | Manager Only | Lists all restaurant reservations across dates and slots. |
| 15 | `PATCH` | `/api/reservations/:id` | Protected / Manager | Updates reservation status (`Confirmed`, `Declined`, `Cancelled`). |
| 16 | `POST` | `/api/orders` | Protected | Places a new order and dispatches it into kitchen queue (`Pending`). |
| 17 | `GET` | `/api/orders/my` | Protected | Retrieves active and previous orders for the logged-in diner. |
| 18 | `GET` | `/api/orders/active` | Manager Only | Retrieves active kitchen queue (`Pending`, `Preparing`, `Ready`). |
| 19 | `PATCH` | `/api/orders/:id/status` | Manager Only | Advances kitchen order status monotonically. |

---

## 5. Hook Usage Matrix by Screen

| Screen | React Core Hooks | Custom Project Hooks | Purpose & Responsibility |
|---|---|---|---|
| **LoginScreen** | `useState`, `useEffect`, `useRef` | `useAuth`, `useTheme` | 3D card flip animation, credentials validation, live JWT login via `/api/auth/login`. |
| **MenuScreen** | `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback` | `useApi`, `useTheme`, `useAuth`, `useCart`, `useMenu` | Live menu fetch using `useApi('/api/menu')`, category filter chips, debounced search, `React.memo` item cards. |
| **CartScreen** | `useState`, `useMemo` | `useCart`, `useTheme` | Pure reducer dispatching, quantity steppers, per-item instructions, promo validation, memoized totals. |
| **OrderSummaryScreen** | `useMemo` | `useCart`, `useOrders`, `useAuth`, `useTheme` | Order financial verification, dispatches live `POST /api/orders` to backend. |
| **OrderTrackingScreen** | `useState`, `useEffect`, `useRef` | `useOrders`, `useTheme` | Kitchen progression timeline, active polling every 10 seconds via `/api/orders/:id`. |
| **ReservationScreen** | `useState` | `useReservation`, `useAuth`, `useTheme` | Live table selection via `/api/tables`, booking dispatch to `/api/reservations`, `409 Conflict` alert handling. |
| **ManagerDashboardScreen** | `useState`, `useCallback` | `useApi`, `useAuth`, `useTheme`, `useOrders`, `useMenu`, `useReservation` | Fetches live reservations via `useApi('/api/reservations')`, live order status progression, menu CRUD. |
| **ProfileScreen** | `none` | `useAuth`, `useTheme` | User credentials inspection, dark/light theme switch toggle, role badge, JWT logout. |

---

## 6. Security & Environment Variable Policy

* **`.env` Exclusion**: In accordance with enterprise security practices, the real `.env` file containing secrets, database credentials, and JWT signing keys is **strictly ignored** by `.gitignore` and has never been pushed to Git.
* **`.env.example`**: A safe template file is provided at `server/.env.example` with standard defaults for local development.
* **Password Hashing**: Passwords are never stored in plaintext. They are salted and hashed with `bcrypt` (10 rounds).
* **JWT Expiration**: Access tokens are signed using a server-side secret with a 24-hour expiration (`1d`).

---

## 7. Demonstration Video & Screenshots

* **Assignment 1 Video**: [Watch A1 Demo Video on GitHub](https://github.com/obaids093-prog/Restaurant-app/blob/main/A1/demo_video.mp4)
* **Assignment 2 Full-Stack Video**: Recorded demonstration showing Express server start, MongoDB connection, Postman testing, and mobile app live sync.
* **UML & Diagrams**: Included in high resolution inside `A2/SRS_v2.pdf`.
