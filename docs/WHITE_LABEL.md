# White-Labeling & Customization Manual

A comprehensive step-by-step guide for agencies, developers, and restaurant operators seeking to rebrand, customize, and commercialize the **AURA Restaurant Mobile Platform** for new dining brands, cafes, bistros, and cloud kitchens.

---

## 1. Centralized Brand Configuration (`src/config/brand.js`)

All identity variables, currency formats, brand copies, support channels, and legal labels are centralized in `src/config/brand.js`. Changing this single file rebrands the entire customer experience across all screens.

```javascript
// src/config/brand.js
export const brand = {
  // Brand Identity
  name: 'AURA',                          // App display name
  fullName: 'AURA Artisan Kitchen',       // Long brand title
  tagline: 'Artisan Hospitality & Dining', // Slogan
  city: 'Lahore & Islamabad',             // Operating cities
  flagshipLocation: 'Gulberg III, Lahore',// Primary branch

  // Currency & Financials
  currencySymbol: 'Rs.',                  // 'Rs.', '$', 'AED', 'SAR', '€'
  currencyCode: 'PKR',                    // ISO currency code
  formatPrice: (amount) => {
    const num = Number(amount || 0);
    return `Rs. ${num.toLocaleString()}`;
  },

  // Service & Tax Rates
  serviceChargeRate: 0.05,               // 5% hospitality charge
  salesTaxRate: 0.15,                    // 15% provincial sales tax

  // Contact & Concierge
  supportPhone: '+92 42 3578 9123',
  supportEmail: 'concierge@aurahospitality.pk',
  supportHours: '12:00 PM – 11:00 PM Daily',

  // Onboarding Slides Copy
  onboardingSlides: [
    {
      title: 'Artisan Culinary Mastery',
      subtitle: 'Experience wood-fired steaks, delicate dim sum, and bespoke seasonal tasting menus.',
    },
    // ...
  ],
};
```

### Steps to rebrand for a new client:
1. Open `src/config/brand.js`.
2. Update `name`, `fullName`, and `tagline` with the client's restaurant name.
3. Update `currencySymbol`, `currencyCode`, and `formatPrice` to match the target country (e.g. `$`, `AED`, `SAR`, `£`).
4. Update `serviceChargeRate` and `salesTaxRate` according to local tax regulations.
5. Save the file — all price tags, receipts, summary screens, headers, and toasts update automatically.

---

## 2. Visual Theme & Color Palette (`src/theme/theme.js`)

The app features a token-driven design system supporting seamless light and dark mode switching.

### Color Tokens:
To change the app's primary color (e.g., from terracotta orange `#FC5834` to luxury emerald `#059669` or royal burgundy `#831843`):

```javascript
// src/theme/theme.js
export const colors = {
  light: {
    // Brand Tokens
    primary: '#059669',          // Your primary brand color
    primaryPressed: '#047857',   // Touch feedback pressed state
    primaryTint: '#ECFDF5',      // Light tint for badges & pills
    secondary: '#F59E0B',        // Accent gold/amber color
    onPrimary: '#FFFFFF',        // Text color on primary background
    // ...
  },
  dark: {
    primary: '#10B981',          // Primary adjusted for dark backgrounds
    primaryPressed: '#34D399',
    primaryTint: '#064E3B',
    // ...
  }
};
```

### Typography:
The platform uses the modern, geometric **Poppins** font via `@expo-google-fonts/poppins` with native fallback stacks:
```javascript
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
};
```

---

## 3. App Metadata & Icon Assets (`app.json`)

To update the mobile launcher icon, splash screen, and package identifiers for Apple App Store and Google Play:

1. Open `app.json`:
   ```json
   {
     "expo": {
       "name": "AURA Restaurant",
       "slug": "aura-restaurant",
       "version": "1.0.0",
       "icon": "./assets/icon.png",
       "splash": {
         "image": "./assets/splash-icon.png",
         "resizeMode": "contain",
         "backgroundColor": "#121212"
       },
       "ios": {
         "bundleIdentifier": "com.yourclient.restaurant"
       },
       "android": {
         "package": "com.yourclient.restaurant"
       }
     }
   }
   ```
2. Replace asset image files:
   - `assets/icon.png`: 1024x1024 px square app launcher icon.
   - `assets/splash-icon.png`: 1242x2436 px splash image.
   - `assets/adaptive-icon.png`: 1024x1024 px Android adaptive foreground.
   - `assets/favicon.png`: Web browser tab icon.

---

## 4. Customizing the Menu Catalog & Seeding

1. Open `server/seed/seedData.js`.
2. Edit or add menu categories (`Starters`, `Mains`, `Desserts`, `Beverages`).
3. Add client dishes with price, description, high-resolution photo URL, dietary tags, and preparation time.
4. Run the seeder to populate the MongoDB database:
   ```bash
   cd server
   npm run seed
   ```

---

## 5. White-Labeling Checklist for Sale Deliveries

- [ ] Updated brand name and tagline in `src/config/brand.js`.
- [ ] Configured local currency and tax rates in `src/config/brand.js`.
- [ ] Adjusted primary and accent color tokens in `src/theme/theme.js`.
- [ ] Updated app icons and splash artwork in `assets/`.
- [ ] Set unique `bundleIdentifier` (iOS) and `package` (Android) in `app.json`.
- [ ] Configured backend `server/.env` with production MongoDB Atlas connection string.
- [ ] Populated custom menu catalog via `server/seed/seedData.js`.
- [ ] Created production manager accounts in `server/seed/seedData.js`.
