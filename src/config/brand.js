/**
 * src/config/brand.js
 * ═══════════════════════════════════════════════════════════
 * White-Label Brand Configuration Engine
 * Single source of truth for restaurant brand identity, copywriting,
 * currency formatting, contact information, and onboarding slides.
 * ═══════════════════════════════════════════════════════════
 */

export const brand = {
  // Identity
  appName: 'AURA',
  tagline: 'Artisan Culinary Concierge',
  restaurantName: 'AURA Artisan Dining',
  cuisineType: 'Modern Gourmet & Fine Dining',

  // Currency & Financial
  currencySymbol: 'Rs. ',
  formatPrice: (price) => {
    const num = Number(price || 0);
    return `Rs. ${num.toLocaleString()}`;
  },

  // Contact & Placeholders
  address: '14-C Gulberg III, MM Alam Road, Lahore, Pakistan',
  phone: '0300-8472910',
  supportEmail: 'concierge@aurahospitality.pk',
  openingHours: '12:00 PM – 11:00 PM',

  // Onboarding Slides (3 clean luxury slides)
  onboardingSlides: [
    {
      id: 'slide_1',
      title: 'Book a Coveted Table',
      description:
        'Reserve your exclusive dining enclave in seconds with live seating availability and personalized requests.',
      icon: 'calendar',
    },
    {
      id: 'slide_2',
      title: 'Order from Your Seat',
      description:
        'Explore chef signatures, customize courses, and curate your gourmet tray directly from your mobile device.',
      icon: 'restaurant',
    },
    {
      id: 'slide_3',
      title: 'Live Kitchen Tracking',
      description:
        'Observe each stage of culinary craft live from kitchen intake and artisanal preparation to table presentation.',
      icon: 'timer',
    },
  ],

  // Home Screen Copy
  heroBanner: {
    tag: 'Exclusive Reserve',
    title: "Chef's Signature Selection",
    subtitle: 'Handcrafted seasonal creations curated by our master culinary artisans',
    ctaText: 'Explore Selection',
  },

  // Dining Policies
  cancellationPolicy: 'Complimentary cancellations permitted while your order is in Pending status.',
  reservationHoldPolicy: 'Tables are held for 15 minutes past scheduled seating.',
};

export default brand;
