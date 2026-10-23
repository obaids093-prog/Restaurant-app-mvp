/**
 * server/seedDemo.js
 * ═══════════════════════════════════════════════════════════
 * Demo Voucher Seed Script (Development Only)
 *
 * Creates sample demo vouchers for development/testing.
 * ABORTS if NODE_ENV === 'production'.
 * Idempotent: skips codes that already exist.
 * Tags all created vouchers with isDemo: true.
 *
 * Usage:
 *   cd server && npm run seed:demo
 *   (or: node seedDemo.js)
 * ═══════════════════════════════════════════════════════════
 */

const dotenv = require('dotenv');
dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ ABORT: seed:demo cannot run in production (NODE_ENV === "production").\n');
  process.exit(1);
}

const connectDB = require('./config/db');
const Voucher = require('./models/Voucher');

const DEMO_VOUCHERS = [
  {
    code: 'SAVE20',
    description: 'Save 20% on your order',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 500,
    validUntil: new Date(Date.now() + 90 * 86400000), // 90 days
    isDemo: true,
  },
  {
    code: 'FEAST20',
    description: 'Artisan Feast 20% celebration discount',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 2000,
    maxDiscountAmount: 800,
    validUntil: new Date(Date.now() + 90 * 86400000),
    isDemo: true,
  },
  {
    code: 'WELCOME10',
    description: 'Welcome gift for first-time diners',
    discountType: 'percentage',
    discountValue: 10,
    validUntil: new Date(Date.now() + 90 * 86400000),
    perUserLimit: 1,
    isDemo: true,
  },
  {
    code: 'FLAT500',
    description: 'Flat Rs. 500 off on orders above Rs. 3,000',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 3000,
    validUntil: new Date(Date.now() + 90 * 86400000),
    isDemo: true,
  },
];

async function seedDemoVouchers() {
  try {
    await connectDB();
    console.log('🌱 Seeding demo vouchers (development only)...\n');

    let created = 0;
    let skipped = 0;

    for (const v of DEMO_VOUCHERS) {
      const existing = await Voucher.findOne({ code: v.code });
      if (existing) {
        // Update isDemo flag if it was missing
        if (!existing.isDemo) {
          existing.isDemo = true;
          await existing.save();
          console.log(`  🔄 ${v.code} — already exists, marked as demo`);
        } else {
          console.log(`  ⏭️  ${v.code} — already exists (skipped)`);
        }
        skipped++;
        continue;
      }

      await Voucher.create({
        ...v,
        validFrom: new Date(),
        isActive: true,
      });
      console.log(`  ✅ ${v.code} — created (${v.discountType} ${v.discountValue}${v.discountType === 'percentage' ? '%' : ''})`);
      created++;
    }

    console.log(`\n✨ Demo seed complete: ${created} created, ${skipped} skipped.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Demo seed failed:', err.message);
    process.exit(1);
  }
}

seedDemoVouchers();
