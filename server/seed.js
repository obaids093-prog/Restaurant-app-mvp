// seed.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Seeds MongoDB Atlas with initial A1/A2 mock data.
//   Modes:
//     1. Default (Safe Idempotent):
//        node seed.js  (or: npm run seed)
//        Checks existing records and only inserts missing records.
//        NEVER deletes or wipes existing data.
//     2. Hard Reset (Destructive Wipe):
//        node seed.js --reset  (or: npm run seed -- --reset)
//        Explicit flag required. Warns loudly and wipes all collections
//        before re-inserting fresh baseline demo data.
// ═══════════════════════════════════════════════════════════

const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Validate required environment variables before seeding
const requiredSeedEnv = ['MONGO_URI'];
const missingSeedEnv = requiredSeedEnv.filter((key) => !process.env[key]?.trim());

if (missingSeedEnv.length > 0) {
  console.error('\n❌ FATAL CONFIGURATION ERROR: Missing required environment variable(s):');
  missingSeedEnv.forEach((key) => {
    console.error(`   - ${key} is required for database connection.`);
  });
  console.error('Please configure it in your environment or server/.env (see server/.env.example).\n');
  process.exit(1);
}

const connectDB = require('./config/db');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const Table = require('./models/Table');
const Reservation = require('./models/Reservation');
const Order = require('./models/Order');

// ── Static Initial Data Definitions ─────────────────────────

const getInitialUsers = (customerPasswordHash, managerPasswordHash, secondUserPasswordHash) => [
  {
    name: 'Zainab Malik',
    email: 'zainab.malik@aurabistro.pk',
    password: customerPasswordHash,
    role: 'customer',
    phone: '0302-8877665',
    dob: '1996-04-12',
    membership: 'VIP Emerald Patron • Gulberg',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
  },
  {
    name: 'Chef Farhan Siddiqui',
    email: 'farhan.chef@aurabistro.pk',
    password: managerPasswordHash,
    role: 'manager',
    phone: '0321-5544332',
    dob: '1985-09-24',
    membership: 'Executive Head Chef & Operations GM',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&auto=format&fit=crop',
  },
  {
    name: 'Hamza Abbasi',
    email: 'hamza.abbasi@aurabistro.pk',
    password: secondUserPasswordHash,
    role: 'customer',
    phone: '0333-4455667',
    dob: '1999-11-18',
    membership: 'Gold Dining Patron',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
  },
];

const initialMenuItems = [
  // Starters
  {
    name: 'Saffron Infused Lobster Bisque',
    description: 'Velvety slow-simmered Maine lobster velouté infused with Spanish saffron, cognac crème fraîche, and tarragon brioche croutons.',
    price: 1450,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop',
    isSpecial: true,
    isAvailable: true,
    prepTime: '12 min',
    rating: 4.9,
    tag: "Chef's Signature",
  },
  {
    name: 'Pan-Seared Hokkaido Scallops',
    description: 'Golden caramelized deep-sea diver scallops rested on silky cauliflower puree, crispy pancetta chips, and micro chervil.',
    price: 1650,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: true,
    prepTime: '14 min',
    rating: 4.8,
    tag: 'Wild Caught',
  },
  {
    name: 'Smoked Duck Breast Carpaccio',
    description: 'Cured Hudson Valley duck breast thinly sliced with macerated blackberries, shaved pecorino toscano, and cold-pressed walnut oil.',
    price: 1250,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: true,
    prepTime: '10 min',
    rating: 4.7,
    tag: 'Artisan Cured',
  },
  {
    name: 'Charred Fig & Goat Cheese Tartine',
    description: 'Mission figs blistered over almond wood fire, whipped chèvre cheese, clover honey drizzle, and fresh thyme on grilled focaccia.',
    price: 950,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop',
    isSpecial: true,
    isAvailable: false,
    prepTime: '15 min',
    rating: 4.9,
    tag: 'Seasonal Harvest',
  },
  // Mains
  {
    name: 'Truffle Glazed Wagyu Ribeye',
    description: 'Charred Bincho-tan oak, summer black truffle nectar, flaked sea salt, and edible 24k botanical gold leaf.',
    price: 8800,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    isSpecial: true,
    isAvailable: true,
    prepTime: '20 min',
    rating: 5.0,
    tag: 'A5 Miyazaki',
  },
  {
    name: 'Prime Black Angus Tenderloin',
    description: 'Charcoal-grilled center-cut beef tenderloin, roasted bone marrow jus, wild maitake mushrooms, and truffled potato mousseline.',
    price: 3650,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop',
    isSpecial: true,
    isAvailable: true,
    prepTime: '24 min',
    rating: 5.0,
    tag: 'Prime Cut',
  },
  {
    name: 'Wild Atlantic Halibut en Papillote',
    description: 'Parchment-baked ocean halibut fillet with baby fennel bulbs, preserved Meyer lemon, caper berries, and extra virgin olive emulsion.',
    price: 2950,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: true,
    prepTime: '20 min',
    rating: 4.8,
    tag: 'Sustainable Catch',
  },
  {
    name: 'Handmade Morel & Truffle Agnolotti',
    description: 'Piedmontese filled pasta pillows stuffed with braised leeks and ricotta, glazed in cultured brown butter, sage, and shaved summer truffles.',
    price: 1850,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=600&auto=format&fit=crop',
    isSpecial: true,
    isAvailable: true,
    prepTime: '18 min',
    rating: 4.9,
    tag: 'Fresh Handmade',
  },
  {
    name: 'Slow-Braised Lamb Shank Tagine',
    description: '12-hour braised pasture-raised lamb shank in Moroccan spices, Medjool dates, toasted almonds, and fluffy saffron couscous.',
    price: 3200,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: true,
    prepTime: '22 min',
    rating: 4.8,
    tag: 'Slow Braised',
  },
  {
    name: 'Woodfired Neapolitan Burrata Tart',
    description: '24-hour fermented sourdough crust, San Marzano D.O.P. reduction, creamy pugliese burrata, and garden basil pesto.',
    price: 1550,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: false,
    prepTime: '16 min',
    rating: 4.7,
    tag: 'Woodfired',
  },
  // Desserts
  {
    name: 'Valrhona Grand Cru Fondant',
    description: 'Warm Guanaja 70% dark chocolate molten cake with smoked sea salt crystals, paired with house-churned Tahitian bean gelato.',
    price: 1100,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop',
    isSpecial: true,
    isAvailable: true,
    prepTime: '15 min',
    rating: 4.9,
    tag: 'Signature Dessert',
  },
  {
    name: 'Caramelized Pear & Frangipane Tart',
    description: 'Poached Bosc pears baked into rich almond cream frangipane pastry with spiced cider caramel and clotted Jersey cream.',
    price: 950,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: true,
    prepTime: '12 min',
    rating: 4.7,
    tag: 'French Classic',
  },
  {
    name: 'Saffron & Pistachio Mille-Feuille',
    description: 'Crisp caramelized puff pastry sheets layered with Kashmiri saffron diplomat cream and crushed candied emerald pistachios.',
    price: 1200,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop',
    isSpecial: true,
    isAvailable: true,
    prepTime: '10 min',
    rating: 5.0,
    tag: 'Artisan Pastry',
  },
  // Drinks
  {
    name: 'Botanical Yuzu & Elderflower Spritz',
    description: 'Sparkling Japanese yuzu citrus nectar, St. Germain elderflower infusion, cucumber ribbons, and crushed mountain ice.',
    price: 680,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop',
    isSpecial: true,
    isAvailable: true,
    prepTime: '6 min',
    rating: 4.9,
    tag: 'House Elixir',
  },
  {
    name: 'Kyoto Ceremonial Matcha Silk Latte',
    description: 'First-harvest Uji ceremonial matcha whisked with warm oat milk, Madagascar vanilla blossom, and gold leaf dust.',
    price: 620,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: true,
    prepTime: '5 min',
    rating: 4.8,
    tag: 'Single Origin',
  },
  {
    name: 'Smoked Cascara Espresso Tonic',
    description: 'Double shot of anaerobic Ethiopian espresso poured over botanical Mediterranean tonic and charred grapefruit rind.',
    price: 580,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: true,
    prepTime: '5 min',
    rating: 4.7,
    tag: 'Craft Brew',
  },
  {
    name: 'Wild Crimson Hibiscus & Berry Quencher',
    description: 'Cold-steeped Egyptian hibiscus flowers, muddled wild blackberries, crushed mint leaves, and effervescent sparkling water.',
    price: 550,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop',
    isSpecial: false,
    isAvailable: true,
    prepTime: '4 min',
    rating: 4.6,
    tag: 'Organic Zero-Proof',
  },
];

const initialTables = [
  { tableNumber: 'A-01', name: 'Atrium Glasshouse Window', seats: 2, location: 'Glasshouse Atrium', isWindow: true },
  { tableNumber: 'B-02', name: 'Botanica Garden Terrace', seats: 2, location: 'Outdoor Botanica', isWindow: false },
  { tableNumber: 'C-03', name: "Chef's Counter Booth", seats: 4, location: 'Main Open Kitchen', isWindow: false },
  { tableNumber: 'S-04', name: 'Skylight Pergola Table', seats: 4, location: 'Botanica Conservatory', isWindow: true },
  { tableNumber: 'M-05', name: 'Mezzanine Velvet Booth', seats: 6, location: 'Upper Mezzanine', isWindow: false },
  { tableNumber: 'P-06', name: 'Penthouse Skyline Lounge', seats: 6, location: 'Rooftop Terrace', isWindow: true },
  { tableNumber: 'V-07', name: 'Sommelier Reserve Room', seats: 8, location: 'Wine Cellar Salon', isWindow: false },
  { tableNumber: 'E-08', name: 'The Grand Presidential Suite', seats: 12, location: 'Private Penthouse Suite', isWindow: true },
];

// ── Modular Seeding Helpers ─────────────────────────────────

const wipeCollections = async () => {
  console.warn('\n⚠️  ══════════════════════════════════════════════════════════');
  console.warn('⚠️  RESET FLAG DETECTED (--reset)');
  console.warn('⚠️  Wiping all existing collections (User, MenuItem, Table, Reservation, Order)...');
  console.warn('⚠️  ══════════════════════════════════════════════════════════\n');

  await User.deleteMany({});
  await MenuItem.deleteMany({});
  await Table.deleteMany({});
  await Reservation.deleteMany({});
  await Order.deleteMany({});
  console.log('🧹 Emptied existing collections.');
};

const seedUsers = async (usersList, isReset) => {
  if (isReset) {
    const created = await User.insertMany(usersList);
    console.log(`👤 Users: ${created.length} inserted (reset mode).`);
    return created;
  }
  const emails = usersList.map((u) => u.email);
  const existing = await User.find({ email: { $in: emails } });
  const existingMap = new Map(existing.map((u) => [u.email, u]));
  const toInsert = usersList.filter((u) => !existingMap.has(u.email));
  const inserted = toInsert.length > 0 ? await User.insertMany(toInsert) : [];
  console.log(`👤 Users: ${inserted.length} inserted, ${existing.length} already existed.`);
  return usersList.map((u) => existingMap.get(u.email) || inserted.find((i) => i.email === u.email));
};

const seedMenuItems = async (itemsList, isReset) => {
  if (isReset) {
    const created = await MenuItem.insertMany(itemsList);
    console.log(`🍽️  Menu Items: ${created.length} inserted (reset mode).`);
    return created;
  }
  const names = itemsList.map((item) => item.name);
  const existing = await MenuItem.find({ name: { $in: names } });
  const existingMap = new Map(existing.map((item) => [item.name, item]));
  const toInsert = itemsList.filter((item) => !existingMap.has(item.name));
  const inserted = toInsert.length > 0 ? await MenuItem.insertMany(toInsert) : [];
  console.log(`🍽️  Menu Items: ${inserted.length} inserted, ${existing.length} already existed.`);
  return itemsList.map((item) => existingMap.get(item.name) || inserted.find((i) => i.name === item.name));
};

const seedTables = async (tablesList, isReset) => {
  if (isReset) {
    const created = await Table.insertMany(tablesList);
    console.log(`🪑 Tables: ${created.length} inserted (reset mode).`);
    return created;
  }
  const numbers = tablesList.map((t) => t.tableNumber);
  const existing = await Table.find({ tableNumber: { $in: numbers } });
  const existingMap = new Map(existing.map((t) => [t.tableNumber, t]));
  const toInsert = tablesList.filter((t) => !existingMap.has(t.tableNumber));
  const inserted = toInsert.length > 0 ? await Table.insertMany(toInsert) : [];
  console.log(`🪑 Tables: ${inserted.length} inserted, ${existing.length} already existed.`);
  return tablesList.map((t) => existingMap.get(t.tableNumber) || inserted.find((i) => i.tableNumber === t.tableNumber));
};

const seedSampleReservation = async (targetUser, targetTable) => {
  const existing = await Reservation.findOne({
    table: targetTable._id,
    date: '2026-10-15',
    time: '19:00',
  });

  if (existing) {
    console.log('📅 Sample reservation already exists (skipped).');
    return existing;
  }

  const sampleReservation = await Reservation.create({
    user: targetUser._id,
    customerName: targetUser.name,
    phone: targetUser.phone,
    table: targetTable._id,
    date: '2026-10-15',
    time: '19:00',
    guests: 2,
    status: 'Confirmed',
    specialRequests: 'Anniversary celebration by the window',
  });
  console.log(`📅 Created sample reservation for ${sampleReservation.customerName}.`);
  return sampleReservation;
};

const seedSampleOrder = async (targetUser, menuItems) => {
  const existing = await Order.findOne({
    user: targetUser._id,
    tableNumber: 'A-01',
    orderType: 'Dine-in',
  });

  if (existing) {
    console.log('🧾 Sample order already exists (skipped).');
    return existing;
  }

  const item1 = menuItems[0];
  const item2 = menuItems[4] || menuItems[1];
  const subtotal = item1.price * 2 + item2.price * 1;

  const sampleOrder = await Order.create({
    user: targetUser._id,
    customerName: targetUser.name,
    items: [
      {
        menuItem: item1._id,
        name: item1.name,
        price: item1.price,
        quantity: 2,
      },
      {
        menuItem: item2._id,
        name: item2.name,
        price: item2.price,
        quantity: 1,
      },
    ],
    subtotal,
    totalAmount: subtotal,
    orderType: 'Dine-in',
    tableNumber: 'A-01',
    status: 'Preparing',
    notes: 'No shellfish allergy notes, extra bread requested',
  });
  console.log(`🧾 Created sample order #${sampleOrder._id} (Total: Rs. ${sampleOrder.totalAmount}).`);
  return sampleOrder;
};

// ── Orchestration Runner ────────────────────────────────────

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Connecting to database for seeding...');

    const isReset = process.argv.includes('--reset') || process.argv.includes('--wipe');

    if (isReset) {
      await wipeCollections();
    } else {
      console.log('\n🔒 Safe Idempotent Mode Active (no --reset flag passed).');
      console.log('ℹ️  Existing collections will NOT be wiped.');
      console.log('ℹ️  To wipe and recreate fresh baseline data, run:');
      console.log('    npm run seed -- --reset   (or: node seed.js --reset)\n');
    }

    // 1. Password hashing
    const salt = await bcrypt.genSalt(10);
    const customerPasswordHash = await bcrypt.hash('Password123', salt);
    const managerPasswordHash = await bcrypt.hash('Admin1234', salt);
    const secondUserPasswordHash = await bcrypt.hash('Password1', salt);

    // 2. Batch seed entities
    const users = await seedUsers(
      getInitialUsers(customerPasswordHash, managerPasswordHash, secondUserPasswordHash),
      isReset
    );
    const menuItems = await seedMenuItems(initialMenuItems, isReset);
    const tables = await seedTables(initialTables, isReset);

    // 3. Sample records
    await seedSampleReservation(users[0], tables[0]);
    await seedSampleOrder(users[0], menuItems);

    console.log('\n✨ Database seeding completed successfully! ✨');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData().catch((err) => {
  console.error('❌ Unhandled seed error:', err);
  process.exit(1);
});
