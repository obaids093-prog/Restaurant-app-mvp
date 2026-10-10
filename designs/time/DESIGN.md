---
name: Artisan Culinary Botanica
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffbcb7'
  on-tertiary: '#68000a'
  tertiary-container: '#ff938c'
  on-tertiary-container: '#8d0012'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  display-hero:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 18px
    fontWeight: '500'
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
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
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
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies an intimate, ultra-luxury dining sanctuary where gastronomy meets botanical craft. The visual narrative balances the sensory mystery of a dimly lit, high-end cocktail lounge with the meticulous precision of modern culinary artistry. 

The aesthetic is anchored in an elevated **Glassmorphism & Tonal Luxury** direction:
- **Atmosphere:** Deep obsidian layers paired with warm champagne luminescence, evoking backlit amber spirits, polished slate counters, and delicate botanical glassware.
- **Audience:** Discerning epicureans, culinary travelers, and private members seeking bespoke gastronomic experiences.
- **Emotional Response:** Intimate, exclusive, tranquil, and sensory-rich.

## Colors

The palette relies on deep, atmospheric dark values accented by amber radiation and organic botanicals.

- **Canvas & Backgrounds:** The base substrate sits at deep obsidian `#0B0F17`, moving to `#111827` for elevated layers. Deep, dark surfaces absorb distraction and allow imagery of dishes and cocktails to take center stage.
- **Brand Primary (Warm Amber Gold):** `#F59E0B` (resting state) with `#D97706` (pressed/active states). This delivers warmth, hospitality, and candlelit ambiance across interactive calls-to-action, highlights, and star ratings.
- **Botanical / Dietary Accent (Emerald):** `#10B981` conveys freshness, vegan/vegetarian indicators, sustainability notes, and booking confirmation states.
- **Culinary Heat / Alert (Crimson Coral):** `#EF4444` reserved for spice level indices, cancellation warnings, and urgent allergen callouts.
- **Surfaces & Glass:** `rgba(30, 41, 59, 0.72)` combined with frosted backdrops, bounded by a 1px inner hairline boundary `rgba(255, 255, 255, 0.1)`.
- **Text & Content:** Off-white `#F9FAFB` ensures uncompromised legibility against dark slate, supported by muted platinum `#94A3B8` for secondary dish descriptions, metadata, and understated labels.

## Typography

The typographic strategy orchestrates a dialogue between classical editorial dining and modern handheld utility:

- **Playfair Display** introduces artisanal culinary warmth, refined poise, and high-contrast editorial elegance. It is applied exclusively to section headings, cocktail & dish names, tasting menu chapters, and prominent quote callouts.
- **Inter** handles data density, micro-copy, pricing, dietary indicators, reservation times, and configuration controls with clinical precision and neutral legibility.
- Upper-case styling with widened letter-spacing (`0.04em` to `0.08em`) is reserved strictly for micro-labels, wine classifications, and vintage tags to deliver a vintage cellar aesthetic.

## Layout & Spacing

Built strictly around an 8pt spatial cadence (4px micro-increments), the layout provides breathing room reminiscent of spacious fine-dining table settings.

- **Mobile First Focus:** The native viewport operates with a fluid 4-column column structure, anchored by `1.25rem` (20px) side margins and `1rem` (16px) gutters. 
- **Rhythm & Padding:** Interactive rows, food catalog cards, and tasting sequences adhere to vertical intervals of `1rem` (16px) to `1.5rem` (24px) for distinct separation, avoiding cluttered density.
- **Safe Regions:** Full-bleed imagery utilizes negative bleed margins under top status bars and bottom navigation docks, maintaining high immersion while retaining ergonomic reach within thumbs' sweep zones.

## Elevation & Depth

Visual hierarchy does not use harsh drop shadows; instead, it relies on multi-layered optical physics, diffused radiance, and frosted materials:

- **Base Layer (Level 0):** Pure Obsidian `#0B0F17` canvas with soft radial ambient glow spots tinted amber (`rgba(245, 158, 11, 0.04)`) to anchor key culinary spotlights.
- **Card Surfaces (Level 1):** Translucent slate tint (`rgba(30, 41, 59, 0.72)`) backed by `backdrop-filter: blur(20px)` and an interior top rim highlight (`box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)`).
- **Floating Modals & Sheets (Level 2):** Elevated translucent panels (`rgba(17, 24, 39, 0.88)` with `blur(28px)`), supported by an ambient amber drop shadow: `0 16px 36px -8px rgba(0, 0, 0, 0.6), 0 0 24px 0 rgba(245, 158, 11, 0.08)`.
- **Dividers & Outlines:** 1px hairline borders (`rgba(255, 255, 255, 0.08)`) separate items without creating hard barriers.

## Shapes

The design system maintains a tactile, organic curvature calibrated to an exact 20px (`1.25rem`) standard across primary interactive cards and sheets:

- **Standard Containers & Cards:** Strict 20px curvature softens the interface, echoing hand-thrown ceramic dishware and smoothed river stones.
- **Controls & Chips:** Interactive chips, badges, and primary action buttons adapt semi-pill to full-pill silhouettes to create clear touch affordances.
- **Images & Visual Assets:** Culinary imagery inside cards matches the parent's inner radius seamlessly, preventing visual friction.

## Components

### Buttons
- **Primary Action (Amber Glow):** Solid gradient fill transitioning from `#F59E0B` to `#D97706`. High-contrast dark typography (`#0B0F17`, `label-lg`). Outer ambient glow of `0 8px 20px -4px rgba(245, 158, 11, 0.4)`. Pill-shaped border radius (9999px) with vertical padding of 14px.
- **Secondary Action (Frosted Glass):** Translucent background `rgba(30, 41, 59, 0.6)` with 1px border `rgba(255, 255, 255, 0.15)`. Text `#F9FAFB`. Subtle glow on press.
- **Ghost/Tertiary:** No background, `#F59E0B` text with an underline accent for Sommelier pairings or cellar details.

### Cards (Menu Items & Tastings)
- **Structure:** Translucent slate body (`rgba(30, 41, 59, 0.72)`), 20px border radius, 1px perimeter border (`rgba(255, 255, 255, 0.1)`), inner padding of `1.25rem`.
- **Imagery Integration:** Aspect ratio 16:10 or 1:1, nestled with 14px corner radius inside the card or full-bleed across top with a subtle linear gradient fade into slate.
- **Typography Layout:** Dish title set in `headline-sm` (Playfair Display), ingredient breakdown in `body-sm` (`#94A3B8`), and pricing formatted in `label-lg` with warm amber tinting.

### Dietary & Ingredient Chips
- **Aesthetic:** Compact height (28px), pill-shaped, translucent fill.
- **Dietary (Vegan/Botanical):** Background `rgba(16, 185, 129, 0.12)`, border `rgba(16, 185, 129, 0.3)`, text `#10B981`.
- **Spicy / Chef Special:** Background `rgba(239, 68, 68, 0.12)`, border `rgba(239, 68, 68, 0.3)`, text `#EF4444`.

### Input Fields & Selectors
- **Input Canvas:** Translucent surface `rgba(17, 24, 39, 0.65)` with inset shadow and 1px border `rgba(255, 255, 255, 0.1)`. Height 52px, 12px border radius.
- **Focus State:** Border transitions to `#F59E0B` with subtle exterior amber bloom (`box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15)`). Placeholder text in `#94A3B8`.

### Checkboxes & Radio Controls
- **Form:** 20px circular selection tokens for vintage selections and table seatings.
- **Active State:** Solid `#F59E0B` fill with an off-white inner indicator mark, supported by a gentle amber halo.

### Bespoke Domain Components
- **Tasting Course Timeline:** Vertical botanical line in hairline gold (`rgba(245, 158, 11, 0.3)`) punctuated by glowing nodes indicating pairing courses (Amuse-Bouche through Digestif).
- **Reservation Time Chips:** Glassmorphic buttons displaying seating time and table style (e.g., "Counter", "Garden Atrium"); active slot marked with an amber gradient outline and champagne typography.