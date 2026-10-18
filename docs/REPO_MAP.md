# REPO_MAP.md — AURA Restaurant App Repository Map

> Generated during `cleanup-structure` branch. Reflects state after Items 1–7.

---

## Root

```
mad assignment/
├── App.js                        # Entry point — loads fonts, wraps context providers
├── app.json                      # Expo manifest (name, slug, icons, splash, permissions)
├── package.json
├── .env.example                  # Safe env template (never commit real .env)
├── seed.js                       # Dev-only DB seed script
├── README.md
├── LICENSE
├── CHANGE.MD                     # Step-by-step cleanup-structure progress log
├── DESIGN_PROGRESS.md            # Design-refresh branch progress log
├── designs/stitch/               # Stitch design references (do not modify)
├── docs/                         # Technical documentation
│   ├── ARCHITECTURE.md           # System architecture spec (updated this branch)
│   ├── REPO_MAP.md               # This file
│   ├── SETUP.md                  # Developer setup guide
│   ├── WHITE_LABEL.md            # White-label customisation guide
│   ├── ASSETS_LICENSES.md       # Third-party asset attributions
│   └── academic/                 # Coursework deliverables & SRS specs
│       ├── A1/                   # Assignment 1 deliverables & SRS v1
│       ├── A2/                   # Assignment 2 deliverables & Postman collection
│       ├── VIVA_NOTES.md         # Viva prep notes & test verification
│       └── UML_ARCHITECTURE.md  # Detailed UML system design
└── assets/                       # App icons, splash, images referenced by app.json
```

---

## src/ — React Native Client

```
src/
├── api/
│   └── client.js                 # Centralised fetch wrapper with JWT injection (do not modify)
│
├── components/ui/                # Reusable atomic components (do not modify)
│   ├── index.js                  # Barrel re-export
│   ├── TabBar.js                 # Custom bottom navigation bar
│   ├── FilterTabs.js             # Segmented filter tabs
│   ├── OrderStepper.js           # Kitchen status stepper timeline
│   ├── OtpInput.js               # 6-digit OTP code input
│   ├── BranchChip.js             # Outlet selector chip (header)
│   ├── BranchPickerModal.js      # Full outlet switcher modal
│   └── … (Button, Card, Input, Badge, etc.)
│
├── config/
│   └── brand.js                  # App name, tagline, outlets, formatPrice (do not modify)
│
├── context/                      # React Context providers (do not modify)
│   ├── ThemeContext.js           # Light/dark mode, color tokens, typography
│   ├── AuthContext.js            # User session, JWT, role management
│   ├── BranchContext.js          # Multi-branch selection & persistence
│   ├── MenuContext.js            # Live menu catalog, search, favourites
│   ├── CartContext.js            # Tray items, promo codes, financial state
│   └── OrdersContext.js          # Orders list, polling, cancellation
│
├── hooks/                        # Custom React hooks (do not modify)
│   └── useReservation.js         # Reservation form state, validation, API
│
├── navigation/                   # Navigation config (do not modify)
│   └── AppNavigator.js           # Root stack + customer bottom tab navigator
│
├── reducers/                     # Pure reducer functions (do not modify)
│   └── cartReducer.js            # Cart state machine, promo code validation
│
├── theme/                        # Design tokens (do not modify)
│   └── theme.js                  # Light/dark palettes, typography, shadows, radius
│
├── utils/                        # Cross-platform helpers (do not modify)
│   ├── SafeLinearGradient.js     # Gradient with web fallback
│   ├── safeStorage.js            # AsyncStorage with web compat
│   └── imageUpload.js            # Device/web image upload helper
│
└── screens/                      # Screen files — each root file is a bridge re-export
    ├── SplashScreen.js           # Brand cloche & flame animation (1,023 lines, standalone)
    ├── OnboardingScreen.js       # Parallax onboarding slides (453 lines, standalone)
    ├── OrderSummaryScreen.js     # Checkout & order placement (812 lines, standalone)
    ├── OrderPlacedScreen.js      # Success confirmation & receipt (579 lines, standalone)
    ├── ProfileScreen.js          # Customer profile & edit (1,061 lines, standalone)
    │
    ├── LoginScreen.js            # → re-exports Login/LoginScreen.js
    ├── Login/
    │   ├── loginStyles.js        # Shared styles & animation helpers
    │   ├── BrandCanopy.js        # Luxury brand header with gradient & orbit
    │   ├── EmailPasswordForm.js  # Email/password auth form
    │   ├── PhoneOtpStep.js       # Phone number & OTP verification
    │   ├── NameEntryStep.js      # Onboarding name entry
    │   ├── GuestBrowseFooter.js  # Guest CTA & legal
    │   ├── LoginScreen.js        # Main container
    │   └── index.js
    │
    ├── MenuScreen.js             # → re-exports Menu/MenuScreen.js
    ├── Menu/
    │   ├── menuStyles.js         # Styles & shared constants
    │   ├── HeroCarousel.js       # Chef's pick carousel
    │   ├── CategoryRow.js        # Horizontal category pills
    │   ├── OrderAgainRow.js      # Reorder row
    │   ├── DealsSection.js       # Promotional voucher cards
    │   ├── TopRatedRow.js        # Top-rated dishes
    │   ├── FilterSheet.js        # Sort & filter bottom sheet
    │   ├── DishGrid.js           # 2-column menu grid
    │   ├── MenuScreen.js         # Main container
    │   └── index.js
    │
    ├── ReservationScreen.js      # → re-exports Reservation/ReservationScreen.js
    ├── Reservation/
    │   ├── reservationStyles.js  # Styles, slot groups, zone constants
    │   ├── DateRow.js            # 7-day date ribbon
    │   ├── PartyStepper.js       # Guest count stepper
    │   ├── ZonePicker.js         # Dining zone selector
    │   ├── SlotGrid.js           # Time slot grid
    │   ├── BookingForm.js        # Contact info & requests form
    │   ├── BookTabContent.js     # Full booking composition
    │   ├── ConfirmSheet.js       # Pre-booking confirmation modal
    │   ├── SuccessSheet.js       # Reservation confirmed sheet
    │   ├── MyBookingsList.js     # Filterable booking history
    │   ├── ReservationScreen.js  # Main container
    │   └── index.js
    │
    ├── CartScreen.js             # → re-exports Cart/CartScreen.js
    ├── Cart/
    │   ├── cartStyles.js         # Styles & financial rate constants
    │   ├── EmptyClocheIllustration.js  # Decorative cloche graphic
    │   ├── CartEmptyState.js     # Empty tray + chef recommendations
    │   ├── CartItemCard.js       # Item card with stepper & note
    │   ├── VoucherSection.js     # Promo code entry & active badge
    │   ├── BillSummary.js        # Folio breakdown with totals
    │   ├── FloatingCartFooter.js # Pinned review-order bar
    │   ├── CartScreen.js         # Main container
    │   └── index.js
    │
    ├── OrderTrackingScreen.js    # → re-exports OrderTracking/OrderTrackingScreen.js
    ├── OrderTracking/
    │   ├── trackingStyles.js     # Styles & status constants
    │   ├── trackingHelpers.js    # Alert, reorder logic, tab title helpers
    │   ├── ActiveOrderHero.js    # Live order card with timer & stepper
    │   ├── PastOrderCard.js      # Historical folio with expandable receipt
    │   ├── TrackingEmptyState.js # Empty state with menu CTA
    │   ├── OrderTrackingScreen.js # Main container with 10s polling
    │   └── index.js
    │
    ├── ManagerDashboardScreen.js # → re-exports Manager/ManagerDashboardScreen.js
    └── Manager/
        ├── managerStyles.js      # Styles & status helper mappings
        ├── OrderItemCard.js      # Kitchen ticket card
        ├── ReservationCard.js    # Reservation management card
        ├── MenuItemCard.js       # Menu catalog card
        ├── OverviewTab.js        # KPI cards & quick shortcuts
        ├── OrdersTab.js          # Live order list
        ├── ReservationsTab.js    # Reservations list
        ├── MenuStockTab.js       # Menu catalog & stock
        ├── TeamTab.js            # Staff directory & registration
        ├── AddDishModal.js       # New dish creation modal
        ├── EditDishModal.js      # Dish edit modal
        ├── ManagerDashboardScreen.js  # Main executive console
        └── index.js
```

---

## server/ — Express.js REST API

```
server/
├── server.js                     # App bootstrap, middleware, route mounting
├── package.json
├── .env                          # NOT committed — see .env.example
│
├── models/
│   ├── User.js                   # User schema (customer / manager / staff roles)
│   ├── MenuItem.js               # Menu item schema with branch, availability
│   ├── Order.js                  # Order schema with items, branch, status
│   ├── Reservation.js            # Reservation schema with zone, slots, branch
│   └── Table.js                  # Table schema with zone & capacity
│
├── controllers/
│   ├── authController.js         # Register, login, OTP, profile, staff management
│   ├── menuController.js         # Menu CRUD, availability toggle
│   ├── orderController.js        # Order creation, status updates, cancellation
│   ├── reservationController.js  # Booking creation, collision check, lifecycle
│   ├── tableController.js        # Tables listing
│   └── uploadController.js       # Multer image upload (Manager-only, 5MB)
│
└── routes/
    ├── authRoutes.js
    ├── menuRoutes.js
    ├── orderRoutes.js
    ├── reservationRoutes.js
    ├── tableRoutes.js
    └── uploadRoutes.js
```
