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

  // Onboarding Slides (3 Luxury Fine Dining Pillars)
  onboardingSlides: [
    {
      id: 'slide_1',
      pillar: 'Pillar 01 • Coveted Enclaves',
      badge: 'VIP Seating',
      badgeIcon: 'ribbon-outline',
      category: 'SIGNATURE AMBIANCE',
      heroTitle: 'Private Glasshouse & Garden Sanctuaries',
      heroTagline:
        'Immersive conservatory enclosures tailored to bespoke soundscapes and ambient table preferences.',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80',
      title: 'Book a Coveted Table',
      sheetTitle: 'Reserve Coveted Dining Enclaves',
      sheetDescription:
        'Select your ideal enclave in seconds with live seating availability and personalized requests.',
      features: [
        {
          icon: 'business-outline',
          title: 'Panoramic & Courtyard Seating',
          desc: 'Glasshouse enclosures with tailored view configurations',
        },
        {
          icon: 'calendar-outline',
          title: 'Real-Time Table Availability',
          desc: 'Instant confirmation with zero reservation anxiety',
        },
        {
          icon: 'star-outline',
          title: 'VIP Concierge Pass',
          desc: 'Special dietary notes and anniversary arrangements',
        },
      ],
      ctaText: 'Begin Artisan Journey',
    },
    {
      id: 'slide_2',
      pillar: 'Pillar 02 • Woodfire Gastronomy',
      badge: 'Master Chef',
      badgeIcon: 'restaurant-outline',
      category: 'CULINARY ARTISTRY',
      heroTitle: 'Botanical Gastronomy & Woodfire Hearth',
      heroTagline:
        'Hyper-seasonal tasting compositions cultivated with rare botanical extracts and open-flame alchemy.',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80',
      title: 'Order from Your Seat',
      sheetTitle: 'Artisanal Menu & Course Curation',
      sheetDescription:
        'Explore chef signatures, customize courses, and curate your gourmet tray directly from your mobile device.',
      features: [
        {
          icon: 'flame-outline',
          title: 'Curated Chef Signatures',
          desc: 'Seasonal culinary creations crafted on woodfire hearth',
        },
        {
          icon: 'wine-outline',
          title: 'Sommelier Beverage Pairings',
          desc: 'Handpicked cellar selections paired with each dish',
        },
        {
          icon: 'options-outline',
          title: 'Bespoke Course Customization',
          desc: 'Tailor spice profiles, courses, and sides seamlessly',
        },
      ],
      ctaText: 'Begin Artisan Journey',
    },
    {
      id: 'slide_3',
      pillar: 'Pillar 03 • Brigade Telemetry',
      badge: 'Live Sync',
      badgeIcon: 'timer-outline',
      category: 'PRECISION TIMELINE',
      heroTitle: 'Orchestrated Course Cadence in Real-Time',
      heroTagline:
        'Live sensory syncing from prep line to plate delivery with synchronized kitchen telemetry.',
      image:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
      title: 'Live Kitchen Tracking',
      sheetTitle: 'Live Kitchen Telemetry & Tracking',
      sheetDescription:
        'Follow each stage of culinary craft live from kitchen intake and artisanal preparation to table presentation.',
      features: [
        {
          icon: 'timer-outline',
          title: 'Live Preparation Cadence',
          desc: 'Real-time order stage updates without guesswork',
        },
        {
          icon: 'notifications-outline',
          title: 'Direct Brigade Notifications',
          desc: 'Receive instant alerts when dishes are plated and served',
        },
        {
          icon: 'receipt-outline',
          title: 'Paperless Digital Folio',
          desc: 'Split bills and review itemized order history with ease',
        },
      ],
      ctaText: 'Enter Artisan Concierge',
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
