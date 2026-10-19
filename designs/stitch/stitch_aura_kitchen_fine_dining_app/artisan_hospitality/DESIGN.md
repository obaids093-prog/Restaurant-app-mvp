---
name: Artisan Hospitality
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5b403a'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#8f7069'
  outline-variant: '#e3beb6'
  surface-tint: '#b52603'
  primary: '#b22301'
  on-primary: '#ffffff'
  primary-container: '#d53d1b'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a3'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#545c72'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c748b'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8c1900'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  heading-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  heading-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  button:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  price:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system drives a premier culinary guest experience and kitchen management platform tailored for high-end dining in Pakistan. The design narrative blends bespoke hospitality elegance with high-velocity operational precision.

### Personality & Emotional Response
- **Refined & Tactile:** Modern luxury through generous micro-spacing, precise typography, crisp iconography, and focused culinary photography.
- **Calm Operational Mastery:** For table reservations and live kitchen tracking, the UI provides unambiguous status states without visual noise or anxiety.
- **Tone:** Uncompromising, contemporary, polished. The interface retreats into the background to spotlight plate craft and dining ambiance.

### Visual Style
- **Warm Minimalist Tactility:** Clean stark white foundations anchored by an energetic saffron-vermilion primary accent, deep carbon neutrals, sculpted 20px surface radii, and layered diffused drop shadows.
- **Strict Visual Rules:** Zero emojis. Iconography is strictly dual-tone or single-stroke 24px minimalist outlines. Rich media and typography convey tone and status.

## Colors

### Color Hierarchy & Roles
- **Primary (`#FC5834`):** The signature brand accent used for primary CTAs, active indicators, and brand touchpoints.
  - *Pressed:* `#E04A27`
  - *Tint / Surface Highlight:* `#FFEDE8`
  - *Dark Mode Primary:* `#FF6B4A`
- **Secondary / Text (`#2A2A2A`):** Deep charcoal used for primary headings, body copy, and high-emphasis icons.
- **Tertiary / Manager Shell (`#0F172A` / `#1E293B`):** Deep slate tones providing a professional cockpit theme for management views while maintaining primary accents.
- **Surfaces & Borders:**
  - *Canvas Background:* `#FFFFFF` (Dark Mode: `#121212`)
  - *Card Surface:* `#F7F7F7` (Dark Mode: `#1E1E1E`)
  - *Primary Border:* `#B7B7B7`
  - *Subtle Border / Dividers:* `#E8E8E8` (Dark Mode: `#3A3A3A`)
  - *Muted Copy & Placeholders:* `#767676` (Dark Mode: `#A0A0A0`)

### Status Palette (Operational Order Lifecycle)
- **Pending:** Text/Stroke `#F59E0B`, Surface Tint `#FEF3C7`
- **Preparing / In Kitchen:** Text/Stroke `#2563EB`, Surface Tint `#DBEAFE`
- **Ready / Served / Confirmed:** Text/Stroke `#16A34A`, Surface Tint `#DCFCE7`
- **Cancelled / Declined / Error:** Text/Stroke `#DC2626`, Surface Tint `#FEE2E2`

## Typography

The type system prioritizes balanced geometric rhythm, legibility in dim restaurant lighting, and clear numerical hierarchy.

### Formatting & Currency Rules
- **Currency Standard:** All pricing must explicitly adopt the Pakistani Rupee standard formatting: `Rs. 1,450` (non-breaking space between code and localized numeral).
- **Tabular Figures:** Price and time indicators must render with proportional/tabular numerical alignment where available to ensure vertical scannability across bills and kitchen order slips.
- **Hierarchy Enforcement:** Body text remains capped at 15px with relaxed line height to avoid clutter across high-density menu descriptions.

## Layout & Spacing

### Mobile-First Form Factor Architecture
- **Target Frame:** Base viewport baseline 390x844 (iOS/Android modern flagship portrait).
- **Grid Structure:** 4-column layout on mobile with `16px` (`1rem`) gutters and `20px` (`1.25rem`) fixed outer margins to preserve safe-area touch boundaries.
- **Vertical Spacing Rhythm:** Strictly built on an 8pt layout rhythm, with 4pt baseline shifts permitted only for metadata labels and icon alignment.
- **Bottom Safe-Area Clearance:** Fixed ordering docks and sticky summary bars require a mandatory minimum bottom padding of `34px` on home indicator screens.

## Elevation & Depth

Visual separation relies on diffused, long-radius ambient shadows rather than stark heavy outlines, reflecting high-end hospitality lighting.

### Shadow Scale
- **Flat (Level 0):** Pure surface flush (`#FFFFFF` on `#F7F7F7` or vice versa) bounded by subtle `#E8E8E8` strokes.
- **Ambient Floating Card (Level 1):** `box-shadow: 0 4px 20px -2px rgba(42, 42, 42, 0.05);` used on culinary menu cards, table status tiles, and selection rows.
- **Raised Interactive Element (Level 2):** `box-shadow: 0 8px 24px -4px rgba(252, 88, 52, 0.20);` reserved strictly for active `#FC5834` CTAs and active order banners.
- **Modal & Bottom Sheet (Level 3):** `box-shadow: 0 -8px 32px 0 rgba(15, 23, 42, 0.12);` paired with a backdrop scrim (`rgba(15, 23, 42, 0.5)`).

### Dark Mode & Manager Depth
In dark and managerial modes, shadow blur is complemented by a 1px inner border (`rgba(255, 255, 255, 0.08)`) to maintain component edges over `#121212` backgrounds.

## Shapes

The interface balances organic comfort with geometric precision using specialized component corner radii:

- **Cards & Modal Containers:** Fixed at `20px` radius to reinforce an upscale, friendly presence.
- **Primary & Secondary Action Buttons:** Fixed at `14px` radius for deliberate, confident tap areas.
- **Text Inputs & Quantity Selectors:** Fixed at `12px` radius.
- **Status Tags, Category Pills, & Counter Badges:** Full pill radius (`999px`).
- **Media Containers:** Dishes and layout imagery inherit card radii (`20px`) or clip into full circular profiles (`50%`) for profile and ingredient badges.

## Components

### Buttons
- **Primary:** Background `#FC5834`, text `#FFFFFF`, radius `14px`, height `52px`, typography `button`. Active state: `#E04A27`.
- **Secondary / Subdued:** Background `#FFEDE8`, text `#FC5834`, border none, radius `14px`, height `52px`.
- **Ghost / Outline:** Background transparent, border 1px solid `#B7B7B7`, text `#2A2A2A`, radius `14px`, height `52px`.

### Chips & Filters
- **Interactive Filter Chip:** Height `36px`, padding `0 16px`, radius `999px`. Inactive: surface `#F7F7F7`, text `#767676`. Active: surface `#2A2A2A`, text `#FFFFFF`.
- **Status Chip:** Height `28px`, padding `0 10px`, radius `999px`, font `caption` (weight 600). Background and text dynamically set by the operational status color tokens (e.g., preparing background `#DBEAFE`, text `#2563EB`).

### Input Fields
- Height `48px`, radius `12px`, background `#FFFFFF`, border 1px solid `#E8E8E8`.
- Focus state: border 1.5px solid `#FC5834`. Placeholder text `#767676` in `body`. Error: border `#DC2626`.

### Cards
- **Culinary Item Card:** Surface `#F7F7F7`, radius `20px`, padding `16px`, Level 1 ambient shadow. Imagery pinned with an aspect ratio of 16:10 or 1:1, title in `heading-sm`, price in `price` (`#FC5834` or `#2A2A2A`).
- **Kitchen / Booking Tracking Card:** Surface `#FFFFFF`, border 1px solid `#E8E8E8`, radius `20px`, padding `16px`. Features a stepped horizontal timeline node with dynamic status coloring.

### Selection Controls
- **Radio Buttons & Checkboxes:** Outer frame 20px with 2px stroke. Active state filled with `#FC5834` and white inner icon/dot.

### Additional Domain Components
- **Kitchen Progress Indicator:** Segmented horizontal tracker showing stage transition (Received → Preparing → Plated/Ready → Served) using status tokens without ambiguous loading spinners.
- **Table Booking Seat Selector:** 44px round micro-cards indicating capacity, reservation slots, and real-time floor availability.