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

  // Branch Outlets (Config-Driven: Set isActive to false or remove to make single-city)
  outlets: [
    {
      id: 'lhr_gulberg',
      city: 'Lahore',
      area: 'Gulberg III',
      fullName: 'AURA • Gulberg III, Lahore',
      address: '14-C Gulberg III, MM Alam Road, Lahore',
      phone: '0300-8472910',
      openingHours: '12:00 PM – 11:00 PM',
      isActive: true,
    },
    {
      id: 'isb_f7',
      city: 'Islamabad',
      area: 'F-7 Markaz',
      fullName: 'AURA • Beverly Centre, Islamabad',
      address: 'Beverly Centre, Blue Area / F-7, Islamabad',
      phone: '0300-8472911',
      openingHours: '12:00 PM – 12:00 AM',
      isActive: true,
    },
  ],

  // Onboarding Slides (3 Simple, Clear Restaurant Steps)
  onboardingSlides: [
    {
      id: 'slide_1',
      pillar: 'Step 1 • Table Booking',
      badge: 'VIP Seating',
      badgeIcon: 'calendar-outline',
      category: 'EASY RESERVATIONS',
      heroTitle: 'Book Your Perfect Dining Table',
      heroTagline:
        'Pick your preferred date, time, and table with instant confirmation.',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80',
      title: 'Book a Table',
      sheetTitle: 'Reserve a Table in Seconds',
      sheetDescription:
        'Choose indoor, outdoor, or window seating with live availability.',
      features: [
        {
          icon: 'business-outline',
          title: 'Indoor & Outdoor Seating',
          desc: 'Courtyard, family lounge, and private dining tables',
        },
        {
          icon: 'calendar-outline',
          title: 'Instant Booking Confirmation',
          desc: 'No phone calls or waiting in long queues',
        },
        {
          icon: 'star-outline',
          title: 'Special Dining Requests',
          desc: 'Add birthday, anniversary, or dietary notes',
        },
      ],
      ctaText: 'Continue',
    },
    {
      id: 'slide_2',
      pillar: 'Step 2 • Fresh Gourmet Menu',
      badge: 'Chef Special',
      badgeIcon: 'restaurant-outline',
      category: 'DELICIOUS FOOD',
      heroTitle: 'Order Fresh Food From Your Seat',
      heroTagline:
        'Explore handcrafted gourmet dishes, steaks, pasta, and fresh drinks.',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80',
      title: 'Order Food',
      sheetTitle: 'Explore Our Handcrafted Menu',
      sheetDescription:
        'Browse full menus with photos, prices, ingredients, and custom options.',
      features: [
        {
          icon: 'flame-outline',
          title: 'Freshly Prepared Meals',
          desc: 'Made to order by our experienced culinary chefs',
        },
        {
          icon: 'wine-outline',
          title: 'Refreshing Drinks & Sweets',
          desc: 'Pair your meal with fresh mocktails and desserts',
        },
        {
          icon: 'options-outline',
          title: 'Easy Customization',
          desc: 'Adjust spice levels, add extras, or exclude items',
        },
      ],
      ctaText: 'Continue',
    },
    {
      id: 'slide_3',
      pillar: 'Step 3 • Live Order Tracking',
      badge: 'Live Updates',
      badgeIcon: 'timer-outline',
      category: 'REAL-TIME TRACKING',
      heroTitle: 'Live Kitchen Order Tracking',
      heroTagline:
        'Watch your order move smoothly from the kitchen to your dining table.',
      image:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
      title: 'Live Tracking',
      sheetTitle: 'Track Your Food Step by Step',
      sheetDescription:
        'Follow every preparation stage so you know exactly when your meal arrives.',
      features: [
        {
          icon: 'timer-outline',
          title: 'Live Kitchen Progress',
          desc: 'From order intake to cooking and white-glove plating',
        },
        {
          icon: 'notifications-outline',
          title: 'Instant Order Alerts',
          desc: 'Get notified the moment your dish is ready to serve',
        },
        {
          icon: 'receipt-outline',
          title: 'Digital Bill & Receipts',
          desc: 'View clear prices, taxes, and order history anytime',
        },
      ],
      ctaText: 'Get Started',
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
