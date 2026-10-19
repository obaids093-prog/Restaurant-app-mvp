---
name: Nocturne Culinary Atelier
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e1bfb8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a88a83'
  outline-variant: '#59413c'
  surface-tint: '#ffb4a3'
  primary: '#ffb4a3'
  on-primary: '#630f00'
  primary-container: '#ff6b4a'
  on-primary-container: '#661000'
  inverse-primary: '#ae3115'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#56d9d8'
  on-tertiary: '#003736'
  tertiary-container: '#00acab'
  on-tertiary-container: '#003939'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8c1900'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#76f6f4'
  tertiary-fixed-dim: '#56d9d8'
  on-tertiary-fixed: '#002020'
  on-tertiary-fixed-variant: '#00504f'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1.25rem
  margin-mobile: 1rem
  margin-tablet: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system channels an intimate, dimly lit tableside atmosphere suited for modern luxury gastronomy. It caters to discerning epicures, private club members, and boutique culinary patrons who value craftsmanship, exclusivity, and understated refinement. 

The aesthetic blends **Modern Minimalist Luxe** with subtle tactile depth:
- Deep obsidian and charcoal backdrops evoke low-light dining lounges and slate surfaces.
- A glowing terracotta ember (`#FF6B4A`) acts as the focal heat source, guiding interactions with warmth and deliberate precision.
- Restrained, expansive negative space combined with smooth continuous-radius containers brings an architectural, high-touch feel to mobile-first culinary commerce.

## Colors

The palette establishes an authentic dark-mode experience engineered for OLED displays and moody interior environments:

- **Primary Canvas (`#121212`)**: The foundational black base that recedes into the background to highlight culinary photography.
- **Card Surface (`#1E1E1E`)**: Primary container level providing immediate tonal contrast without glaring brightness.
- **Elevated Card Surface (`#252525`)**: Used for active sheets, floating drawers, and modal overlays.
- **Primary Accent (`#FF6B4A`)**: A warm flame orange for primary actions, selected tab accents, and highlighted courses.
  - Pressed State: `#E04A27`
  - Subtle Tint / Glow: `rgba(255, 107, 74, 0.15)`
- **Borders**:
  - Distinct Border: `#3A3A3A` for active controls and defined dividers.
  - Subtle Border: `#2A2A2A` for standard card delineations.
- **Typography & Icons**:
  - Primary Content: `#F5F5F5` (crisp bone white for readability).
  - Secondary / Muted: `#A0A0A0` (balanced mid-grey for metadata, pairings, and ingredients).
- **Service Status Tiers** (paired with a 15% opacity background in UI implementation):
  - Pending: `#F59E0B` (Amber)
  - Preparing: `#3B82F6` (Cobalt)
  - Ready / Served: `#22C55E` (Emerald)
  - Cancelled: `#EF4444` (Ruby)

## Typography

Typographic structure relies on Plus Jakarta Sans across all roles to ensure geometric purity, balanced legibility in dark mode, and seamless rendering on high-density mobile screens.

- **Headlines**: Set tightly with deliberate letter-spacing (`-0.02em`) to lend dish names, course numbers, and chef notes an editorial weight.
- **Body Content**: Employs comfortable line heights (1.4–1.5x) with `#A0A0A0` to eliminate eye strain against the `#121212` background.
- **Labels & Micro-copy**: Elevated using medium and semi-bold weights for badges, dietary tags, and transactional elements, guaranteeing instant scanability in fast kitchen or bar contexts.

## Layout & Spacing

The layout model is mobile-first, utilizing a fluid grid anchored by strict edge padding:

- **Mobile Viewports (<600px)**: 4-column system with a `1rem` margin and `0.75rem` gutters. Edge-to-edge full-bleed imagery is paired with nested floating container cards.
- **Tablet / Large Handheld (600px - 1024px)**: 8-column layout with `2rem` screen margins, splitting menu navigation and order summary into paired side panels.
- **Vertical Rhythm**: Spacing is tied to an 8pt base. Internal card padding is consistently set to `space-lg` (`1.5rem`) or `space-md` (`1rem`) to keep item previews uncluttered.

## Elevation & Depth

Visual hierarchy does not use harsh drop shadows; instead, it relies on tonal stacking, perimeter lighting, and low-contrast borders:

- **Surface Tier 0 (Canvas)**: `#121212` base canvas.
- **Surface Tier 1 (Base Cards)**: `#1E1E1E` bordered with 1px solid `#2A2A2A`.
- **Surface Tier 2 (Elevated & Modals)**: `#252525` framed with 1px solid `#3A3A3A`, cast with an ambient diffuse shadow (`box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.65)`).
- **Interactive Highlight**: Focus cards or highlighted tasting courses introduce an ambient primary glow via an outer outline coupled with `box-shadow: 0 0 20px rgba(255, 107, 74, 0.12)`.

## Shapes

The design system adopts a contemporary organic geometry:
- **Base Cards & Bottom Sheets**: Defined strictly at `20px` (`1.25rem`), creating a soft, welcoming, and polished silhouette.
- **Interactive Controls (Inputs, Standard Buttons)**: Clipped at `12px` (`0.75rem`) to retain structural form without appearing overly bubbly.
- **Status Badges & Pill Chips**: Rounded fully with a pill profile (`9999px`) to create clear shape contrast against structural recipe and order cards.

## Components

### Buttons
- **Primary**: Solid `#FF6B4A` background with crisp white text (`#FFFFFF`) or high-contrast deep black (`#121212`), 52px mobile touch height, `12px` border radius. Active/pressed state transitions to `#E04A27`.
- **Secondary**: Elevated dark background (`#252525`), 1px solid border `#3A3A3A`, primary text `#F5F5F5`.
- **Ghost / Tertiary**: Transparent base, text `#FF6B4A`, accompanied by subtle `rgba(255, 107, 74, 0.15)` on press.

### Cards
- **Menu & Order Cards**: Surface `#1E1E1E`, continuous border-radius `20px`, enclosed in a 1px `#2A2A2A` subtle boundary. Internal padding: `1.25rem`. 
- **Selected Tasting Card**: Border dynamic shift to `#FF6B4A` with a micro-glow `0 0 16px rgba(255, 107, 74, 0.15)`.

### Chips & Status Badges
- **Status Indicators**: Pill shape, zero external shadow. Built with a tinted dark base using the status color at 15% opacity, filled with the status tone:
  - *Pending*: Background `rgba(245, 158, 11, 0.15)`, text `#F59E0B`.
  - *Preparing*: Background `rgba(59, 130, 246, 0.15)`, text `#3B82F6`.
  - *Ready / Served*: Background `rgba(34, 197, 94, 0.15)`, text `#22C55E`.
  - *Cancelled*: Background `rgba(239, 68, 68, 0.15)`, text `#EF4444`.
- **Dietary / Filter Chips**: Base `#1E1E1E`, text `#A0A0A0`, 1px border `#2A2A2A`. When active: Background `rgba(255, 107, 74, 0.15)`, text `#FF6B4A`, border `#FF6B4A`.

### Input Fields
- Container `#1E1E1E`, border 1px `#2A2A2A`, text `#F5F5F5`, placeholder text `#A0A0A0`, corner radius `12px`.
- Active focus state: 1px border `#FF6B4A` with no harsh outline ring.

### Lists & Cell Items
- Dividers between tasting courses use 1px solid `#2A2A2A`. Content flows with thumbnail image (rounded `12px`), title in `#F5F5F5`, and pairing description in `#A0A0A0`.

### Checkboxes & Radio Controls
- Circular radio / square rounded (`6px`) checkboxes in `#1E1E1E` with `#3A3A3A` border. Checked state transitions background to `#FF6B4A` with crisp `#FFFFFF` iconography.

### Specialized Component: Course Timeline Tracker
- Vertical indicator connecting order stages. Active progress is marked with a glowing `#FF6B4A` pulse indicator, completed courses in `#22C55E`, and upcoming steps traced with `#2A2A2A` muted dashes.