---
name: Warm Table
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#5b403a'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#8f7069'
  outline-variant: '#e3beb6'
  surface-tint: '#b52603'
  primary: '#b22301'
  on-primary: '#ffffff'
  primary-container: '#d53d1b'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a3'
  secondary: '#5b5d74'
  on-secondary: '#ffffff'
  secondary-container: '#ddddf9'
  on-secondary-container: '#5f6178'
  tertiary: '#00657b'
  on-tertiary: '#ffffff'
  tertiary-container: '#007f9b'
  on-tertiary-container: '#fafdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8c1900'
  secondary-fixed: '#e0e0fc'
  secondary-fixed-dim: '#c4c4df'
  on-secondary-fixed: '#181a2e'
  on-secondary-fixed-variant: '#43455b'
  tertiary-fixed: '#b5ebff'
  tertiary-fixed-dim: '#61d4f8'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#004e60'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
typography:
  display:
    fontFamily: Epilogue
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Epilogue
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Epilogue
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Epilogue
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
This design system provides a neutral, frictionless, and welcoming white-label foundation for modern restaurant reservations and culinary guest management. Drawing inspiration from the utility of Calendly and the hospitality-driven warmth of Airbnb, the interface prioritizes clarity, calm efficiency, and effortless decision-making. 

The aesthetic is clean minimalism enriched with tactile softness: ample negative space, generous touch zones, balanced visual weight, and deliberate restraint that lets photography, menus, and time slots stand out. The experience feels hospitable rather than purely transactional, evoking an immediate sense of anticipation and comfort for diners, alongside clarity for floor managers and hosts.

## Colors
The palette is built around an airy, warm, hospitality-first environment:
- **Canvas / Background**: A delicate, warm off-white (`#FBFBF9`) anchors the entire canvas, eliminating harsh digital glare and setting a comfortable, organic stage.
- **Surfaces & Cards**: Pure crisp white (`#FFFFFF`) forms the elevated layer for booking widgets, time-slot pickers, and guest cards, creating soft contrast naturally without heavy lines.
- **Primary Accent (`#FC5834`)**: An energetic yet warm culinary coral used selectively for primary booking triggers, selected calendar states, badges, and focal interactive states. It remains isolated to maintain maximum punch.
- **Secondary / Ink (`#2B2D42`)**: A soft charcoal-slate serving as high-contrast body text and prominent titles, softer and more approachable than pitch black.
- **Neutral / Muted (`#71717A`)**: Balanced neutral grey for supporting timestamps, party-size notes, disabled states, and unobtrusive borders (`#EBEAE5`).

## Typography
The system balances structural personality with supreme transactional legibility:
- **Headlines (Epilogue)**: Used for restaurant titles, confirmation banners, section titles, and marketing entry points. Its modern geometric curves mirror the roundness of hospitality branding while providing structured confidence.
- **Body & Controls (Inter)**: Handles interactive slots, guest forms, party counter toggles, calendar dates, and operational legibility. Crisp, uniform horizontal metrics prevent visual noise in compact booking flows.
- **Hierarchy Rules**: Display headings drop cleanly on mobile viewports to prevent awkward line wraps in restaurant names. Numbers within party counters and time slots must maintain tabular alignment (`font-variant-numeric: tabular-nums`).

## Layout & Spacing
A fluid 12-column grid structure underpins desktop layouts, pivoting to a unified single-column flow on mobile viewports:
- **Desktop (1024px+)**: 12 columns with `2.5rem` margins and `1.5rem` gutters. Content is restricted to a maximum container width of `1120px` to guarantee an intimate, centered booking experience reminiscent of modern scheduling interfaces.
- **Tablet (768px - 1023px)**: 8 columns with `2rem` margins and `1.25rem` gutters. Split screens (e.g., photo carousel on left, reservation schedule on right) stack or transition to tabbed modules.
- **Mobile (< 768px)**: 4 columns with `1.25rem` outer margins and `1rem` gutters. Critical actions (such as the booking CTA and guest confirmation) lock to a fixed bottom sticky tray.
- **Spacing Cadence**: Whitespace is generous. Interactive groupings (guest counters, time pills) use `space-sm` (8px) and `space-md` (16px), while distinct reservation sections use `space-xl` (40px) to breathe freely.

## Elevation & Depth
Elevation is achieved through a fusion of tonal separation and soft, diffused ambient light:
- **Level 0 (Canvas)**: Warm off-white background (`#FBFBF9`), non-interactive ground level.
- **Level 1 (Card / Resting)**: Pure white background (`#FFFFFF`) with an ultra-soft ambient shadow: `0 2px 12px -2px rgba(43, 45, 66, 0.04), 0 0 0 1px rgba(43, 45, 66, 0.05)`. This eliminates heavy borderlines while retaining crisp edge definition.
- **Level 2 (Hover & Focused Modules)**: Lifted state for hovered cards and active date pickers: `0 8px 24px -4px rgba(43, 45, 66, 0.08), 0 0 0 1px rgba(43, 45, 66, 0.06)`.
- **Level 3 (Modals & Reservation Trays)**: Full reservation popovers and mobile sticky action bars: `0 16px 40px -8px rgba(43, 45, 66, 0.12), 0 0 0 1px rgba(43, 45, 66, 0.04)`.

## Shapes
A consistent 16px (`1rem`) geometry defines the experience:
- **Base Cards & Modals**: Exactly 16px corner radius (`rounded-lg`), mirroring the warm, human approachability of consumer apps like Airbnb.
- **Buttons & Input Fields**: 12px corner radius for controls to visually seat them harmoniously inside the 16px cards.
- **Chips & Time Slot Pills**: Fully pill-shaped (`rounded-full` / `9999px`) for time slots (e.g., "7:00 PM", "7:30 PM") and dietary selection tags, inviting quick taps.

## Components

### Buttons
- **Primary**: Coral fill (`#FC5834`), white typography, 12px radius, min-height 48px for effortless thumb tap targets. Hover shifts to a richer deep coral (`#E84824`).
- **Secondary / Outline**: Clean white fill with a 1px border (`#EBEAE5`), slate ink text (`#2B2D42`). On hover, gains a warm wash (`#F5F4F0`).
- **Ghost**: Zero border, subtle slate ink, ideal for "Cancel" or "Modify party size".

### Chips & Time Slot Pickers
- **Available Time Slots**: Pill-shaped containers (`rounded-full`), 40px height, white background, `1px` subtle outline (`#EBEAE5`), dark slate text.
- **Selected Time Slot**: Solid coral fill (`#FC5834`), white text, accompanied by a subtle outer ring halo (`rgba(252, 88, 52, 0.2)`).
- **Unavailable / Sold Out**: Translucent grey background (`rgba(113, 121, 122, 0.08)`), crossed-out or dimmed text, non-interactive.

### Input Fields & Steppers
- **Text Inputs**: Crisp white background, 12px radius, 48px height, 1px border (`#EBEAE5`). Focus transitions smoothly to a 1.5px border in slate with zero jarring outline rings.
- **Party Size Stepper**: Segmented pill or circular `+` / `-` buttons flanking a high-contrast tabular number counter, ensuring easy one-handed modification.

### Cards
- **Base Style**: Pure white `#FFFFFF` surface, 16px corner radius, Level 1 ambient shadow. Padding is generous (`1.5rem` on desktop, `1.25rem` on mobile).
- **Reservation Summary Card**: Clean dividerless layout using spatial gaps (`space-md`) rather than harsh separator lines, highlighting party size, date, and reservation time in clear Epilogue headlines.

### Checkboxes & Radio Buttons
- 20px form factor with smooth 6px rounded edges for checkboxes, fully circular for seating options (e.g., "Standard", "Outdoor Patio", "Chef's Counter"). Coral checkmark fill when active.