# Setup & Installation Guide

A comprehensive guide for setting up, running, configuring, and testing the **AURA Restaurant Application** in development and production environments.

---

## 1. System Requirements & Prerequisites

Ensure the following prerequisites are installed on your machine before getting started:

| Prerequisite | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0` | `v20.x LTS` | JavaScript runtime environment. |
| **npm** | `v9.0.0` | `v10.x` | Node package manager (or Yarn/Bun). |
| **MongoDB** | `v6.0` | `v7.0+` | Local MongoDB Community Server or MongoDB Atlas Cloud. |
| **Expo CLI** | Latest | Bundled with SDK 57 | Installed via local dev dependencies (`npx expo`). |
| **Expo Go** | Compatible with SDK 57 | Mobile App (iOS / Android) | Required for testing on physical devices. |
| **Git** | `v2.30+` | Latest | Version control. |

---

## 2. Repository Structure Overview

```text
├── server/                     # Backend Express.js & MongoDB REST API
│   ├── models/                 # Mongoose schema models (User, MenuItem, Table, Reservation, Order)
│   ├── routes/                 # Express API routes (auth, menu, orders, reservations, tables)
│   ├── controllers/            # Controller business logic
│   ├── middleware/             # Auth, role validation & error handlers
│   ├── seed/                   # Database seeder scripts
│   └── server.js               # Express application entrypoint
├── src/                        # Frontend React Native / Expo Application
│   ├── api/                    # apiClient and backend HTTP service
│   ├── components/             # Reusable UI component library (Button, Card, Input, TabBar, etc.)
│   ├── config/                 # Brand configuration (brand.js)
│   ├── context/                # Context API providers (Auth, Theme, Cart, Orders, Menu)
│   ├── hooks/                  # Custom business hooks (useReservation, useApi, etc.)
│   ├── navigation/             # AppNavigator & CustomerTabs navigation routing
│   ├── screens/                # Mobile app screens (Menu, Cart, Reservations, Profile, etc.)
│   ├── theme/                  # Theme engine and token system (theme.js)
│   └── utils/                  # Safe storage, phone formatting, animations
├── docs/                       # Sale-ready technical documentation
│   ├── SETUP.md                # This setup guide
│   ├── WHITE_LABEL.md          # Complete re-branding and white-labeling manual
│   ├── ASSETS_LICENSES.md      # Assets, fonts, photography and package licenses
│   └── ARCHITECTURE.md         # Full architectural design document
└── package.json                # Frontend Expo dependencies
```

---

## 3. Backend Setup (Express.js & MongoDB)

### Step 3.1: Navigate & Install Dependencies
Open a terminal in the root directory of the project:
```bash
cd server
npm install
```

### Step 3.2: Configure Environment Variables
Create a `.env` file in the `server/` directory:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On macOS/Linux:
cp .env.example .env
```

Open `server/.env` and configure your settings:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_app
JWT_SECRET=aura_super_secure_artisan_secret_key_2026_jwt
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://127.0.0.1:8081
```

### Step 3.3: Seed the Database
Populate your MongoDB database with essential accounts, gourmet menu items, and dining tables:
```bash
npm run seed
```
This automatically seeds:
- **1 Manager Account**: `manager@aurabistro.pk` (Password: `Manager123!`)
- **1 Customer Account**: `customer@aurabistro.pk` (Password: `Customer123!`)
- **16 Curated Dishes**: Starters, Mains, Desserts, and Artisan Beverages.
- **8 Dining Tables**: Covering Glasshouse, Courtyard, and Chef's Counter areas.

### Step 3.4: Launch Backend Server
```bash
# Development mode with nodemon auto-reload:
npm run dev

# Or standard production mode:
npm start
```
Verify backend health in your browser: `http://localhost:5000/api/health` ➔ `{"status":"ok"}`.

---

## 4. Frontend Mobile App Setup (React Native / Expo)

### Step 4.1: Install Dependencies
From the root directory:
```bash
npm install
```

### Step 4.2: Network & API Configuration
The frontend communicates with the backend via `src/api/client.js`.

- **Web Browser Testing**: Default `http://localhost:5000` works out of the box.
- **Physical Device (Expo Go)**: Physical smartphones cannot resolve `localhost` directly to your development PC. Change `BASE_URL` in `src/api/client.js` or `.env` to your local LAN IP (e.g., `http://192.168.1.100:5000`):
  ```bash
  # Check your local IP on Windows:
  ipconfig
  # Look for IPv4 Address (e.g. 192.168.1.X)
  ```

### Step 4.3: Start the Expo Development Server
```bash
# Start standard Expo bundler:
npx expo start

# Run directly on Web:
npx expo start --web

# Run on Android emulator / device:
npx expo start --android

# Run on iOS simulator / device:
npx expo start --ios
```

Scan the printed QR code using the **Expo Go** app on your iOS (Camera) or Android (Expo Go) smartphone to run the app in real-time with hot module replacement (HMR).

---

## 5. Seed Accounts & Testing Personas

| Role | Email | Password | Permissions & Views |
| :--- | :--- | :--- | :--- |
| **Manager / Admin** | `manager@aurabistro.pk` | `Manager123!` | Access to both Customer App and **Manager Console** (KPIs, Order status updates, Table reservation approvals, Menu catalog & price edits, Team accounts). |
| **Customer / Guest** | `customer@aurabistro.pk` | `Customer123!` | Customer dining app (Menu browsing, Favourites, Tray/Checkout, Order tracking, Table reservations, Profile). |
| **Staff Member** | Created via Console | Set during creation | Order preparation, reservation management, kitchen tracking. |

---

## 6. Common Troubleshooting

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `Network request failed` on mobile device | App trying to connect to `localhost:5000` from physical phone | Set your computer's local IP (e.g. `192.168.1.X:5000`) in `src/api/client.js` and ensure both phone and computer are on the same Wi-Fi network. |
| `MongoServerError: connect ECONNREFUSED` | Local MongoDB daemon not running | Start MongoDB service (`net start MongoDB` on Windows or `brew services start mongodb-community` on macOS). |
| Font loading warning (`Poppins`) | Expo Google Fonts downloading over network | Font weights are bundled via `@expo-google-fonts/poppins` with native system serif/sans-serif fallbacks. |
