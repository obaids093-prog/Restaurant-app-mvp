# Assets, Fonts & Dependencies Licensing Audit

Comprehensive audit of all external assets, icons, fonts, curated photography, and open-source packages utilized in the **AURA Restaurant Mobile Application**, verifying compliance for commercial distribution and white-label sale.

---

## 1. Typography & Fonts

| Font Family | Author / Foundry | License | Usage in Application | Permitted Commercial Use |
| :--- | :--- | :--- | :--- | :---: |
| **Poppins** | Indian Type Foundry (ITF) | **SIL Open Font License (OFL) v1.1** | Core typography system across headings, buttons, body copy, and price labels. Loaded via `@expo-google-fonts/poppins`. | **Yes** (Free for commercial use, embedding, and modification) |
| **System Serif** (Georgia / Serif fallback) | Platform Native (Apple / Google) | System Native | Brand wordmarks and luxury dining header accents. | **Yes** |

---

## 2. Iconography

| Icon System | Author | License | Usage in Application | Permitted Commercial Use |
| :--- | :--- | :--- | :--- | :---: |
| **Ionicons** | Ionic Framework Team | **MIT License** | TabBar navigation, quick buttons, status pills, category icons, and form indicators via `@expo/vector-icons`. | **Yes** (Free for commercial use with no fee) |

---

## 3. Curated Photography & Culinary Imagery

All dish, table area, and restaurant atmosphere photography utilized across the application are sourced from the **Unsplash Open License**:

| Asset / Description | Source | License | Usage Rights |
| :--- | :--- | :--- | :--- |
| **Culinary Dishes & Menu Creations** | Unsplash Free Library | **Unsplash License** | All photos can be downloaded and used for free for commercial and non-commercial purposes without permission or attribution. |
| **Sanctuary Table Areas** (Glasshouse, Courtyard, Chef's Counter) | Unsplash Free Library | **Unsplash License** | Permitted for commercial app displays and promotional previews. |
| **Chef & Guest Avatars** | Unsplash Free Library | **Unsplash License** | Permitted for demo profiles and initial seeds. |

---

## 4. Software Dependencies & Libraries Audit

All production and development packages in `package.json` and `server/package.json` use permissive open-source licenses compatible with proprietary commercial sale:

### Mobile Frontend (`package.json`)

| Package | Version | License | Category | Commercial Resale Permitted |
| :--- | :--- | :--- | :--- | :---: |
| `expo` | `~57.0.27` | **MIT** | Core Mobile Framework | **Yes** |
| `react` | `19.2.3` | **MIT** | UI Runtime | **Yes** |
| `react-native` | `0.86.3` | **MIT** | Mobile Native Runtime | **Yes** |
| `@react-navigation/native` | `^7.4.1` | **MIT** | Navigation Routing | **Yes** |
| `@react-navigation/bottom-tabs` | `^7.19.2` | **MIT** | Tab Navigation | **Yes** |
| `@react-navigation/native-stack` | `^7.19.2` | **MIT** | Stack Navigation | **Yes** |
| `@react-native-async-storage/async-storage` | `^2.2.0` | **MIT** | Local Persistent Storage | **Yes** |
| `expo-linear-gradient` | `^57.0.2` | **MIT** | Visual Gradient Renderers | **Yes** |
| `expo-font` | `~57.0.4` | **MIT** | Custom Font Loader | **Yes** |
| `@expo/vector-icons` | `^15.1.1` | **MIT** | Vector Icons Provider | **Yes** |
| `react-native-safe-area-context` | `~5.7.0` | **MIT** | Notch & Screen Insets | **Yes** |
| `react-native-screens` | `~4.26.0` | **MIT** | Native Screen Container | **Yes** |
| `react-native-web` | `^0.21.3` | **MIT** | Cross-Platform Web Target | **Yes** |

### Backend API (`server/package.json`)

| Package | License | Category | Commercial Resale Permitted |
| :--- | :--- | :--- | :---: |
| `express` | **MIT** | Web Server Engine | **Yes** |
| `mongoose` | **MIT** | MongoDB ODM | **Yes** |
| `jsonwebtoken` | **MIT** | Cryptographic Token Provider | **Yes** |
| `bcryptjs` | **MIT** | Password Salt & Hashing | **Yes** |
| `cors` | **MIT** | Cross-Origin Middleware | **Yes** |
| `dotenv` | **BSD-2-Clause** | Environment Configuration | **Yes** |

---

## 5. Sale-Ready Legal Compliance Statement

1. **No GPL / Copyleft Contamination**: The entire codebase is free of viral copyleft licenses (GPL, AGPL) that would mandate open-sourcing proprietary client code upon commercial sale.
2. **Proprietary Commercial Ownership**: The purchasing entity obtains full ownership rights to deploy, modify, sublicense, white-label, or sell this platform under the accompanying project license.
