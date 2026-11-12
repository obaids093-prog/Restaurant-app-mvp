// server/validators/schemas.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Defines comprehensive, strict Zod schemas for validating
//   request bodies, parameters, and queries across all endpoints.
//   Rejects unknown fields (.strict()), enforces field lengths,
//   and checks data types.
// ═══════════════════════════════════════════════════════════

const { z } = require('zod');

// 24-character hexadecimal string check for MongoDB ObjectId
const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const idParamSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

// ── Auth Schemas ─────────────────────────────────────────────
const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be under 100 characters'),
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Please provide a valid email address under 100 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be under 128 characters')
      .regex(/\d/, 'Password must contain at least one digit'),
    phone: z.string().trim().max(30).optional().default(''),
  })
  .strict();

const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Please provide a valid email address under 100 characters'),
    password: z.string().min(1, 'Password is required').max(128),
  })
  .strict();

const refreshTokenSchema = z
  .object({
    refreshToken: z.string().trim().min(10, 'Refresh token is required').max(512),
  })
  .strict();

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().max(100).optional(),
    phone: z.string().trim().max(30).optional(),
    dob: z.string().trim().max(20).optional(),
    avatar: z.string().max(200000).optional(),
    currentPassword: z.string().max(128).optional(),
    newPassword: z.string().min(8).max(128).regex(/\d/, 'Password must contain at least one digit').optional(),
  })
  .strict();

const staffCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Please provide a valid email address under 100 characters'),
    password: z.string().min(8).max(128).regex(/\d/, 'Password must contain at least one digit'),
    role: z.enum(['manager', 'staff']).optional().default('manager'),
  })
  .strict();

const staffUpdateSchema = z
  .object({
    isActive: z.boolean().optional(),
    role: z.enum(['manager', 'customer']).optional(),
  })
  .strict();

const phoneSendOtpSchema = z
  .object({
    phone: z.string().trim().min(10, 'Phone number is required').max(30),
  })
  .strict();

const phoneVerifyOtpSchema = z
  .object({
    phone: z.string().trim().min(10).max(30),
    otp: z.string().trim().regex(/^\d{6}$/, 'Must be a 6-digit numeric verification code'),
    name: z.string().trim().max(100).optional(),
  })
  .strict();

// ── Menu Schemas ─────────────────────────────────────────────
const menuItemCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional().default(''),
    price: z.number().min(0, 'Price must be non-negative').max(500000),
    category: z.string().trim().min(2).max(50),
    image: z.string().trim().max(1000).optional().default(''),
    isAvailable: z.boolean().optional().default(true),
    isPopular: z.boolean().optional().default(false),
    rating: z.number().min(0).max(5).optional(),
    calories: z.number().min(0).max(10000).optional(),
    preparationTime: z.string().trim().max(50).optional(),
    allergens: z.array(z.string().trim().max(50)).optional(),
    spicyLevel: z.number().min(0).max(5).optional(),
    stockCount: z.number().int().min(0).max(100000).optional(),
  })
  .strict();

const menuItemUpdateSchema = menuItemCreateSchema.partial().strict();

const menuQuerySchema = z
  .object({
    category: z.string().trim().max(50).optional(),
    search: z.string().trim().max(100).optional(),
    popular: z.string().trim().max(10).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).optional(),
  })
  .strip();

// ── Order Schemas ────────────────────────────────────────────
const orderItemSchema = z
  .object({
    menuItem: z.string().trim().max(100).optional(),
    id: z.string().trim().max(100).optional(),
    _id: z.string().trim().max(100).optional(),
    name: z.string().trim().max(120).optional(),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(99),
    specialInstructions: z.string().trim().max(300).optional().default(''),
  })
  .strip();

const orderCreateSchema = z
  .object({
    items: z.array(orderItemSchema).min(1, 'Order must contain at least 1 item').max(50, 'Cannot order more than 50 items'),
    orderType: z.string().trim().max(50).optional(),
    tableNumber: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(500).optional(),
    branchId: z.string().trim().max(80).optional(),
    branchName: z.string().trim().max(150).optional(),
    branchCity: z.string().trim().max(80).optional(),
    promoCode: z.string().trim().max(50).optional(),
    pointsToRedeem: z.coerce.number().int().min(0).max(100000).optional(),
    paymentMethod: z.enum(['cash', 'pay_at_table']).optional(),
  })
  .strip();

const orderStatusUpdateSchema = z
  .object({
    status: z.enum(['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled']),
  })
  .strict();

// ── Reservation Schemas ──────────────────────────────────────
const reservationCreateSchema = z
  .object({
    tableId: objectIdSchema,
    date: z.string().trim().min(8, 'Date is required').max(30),
    time: z.string().trim().min(2, 'Time is required').max(30),
    guests: z.coerce.number().int().min(1, 'At least 1 guest required').max(50),
    customerName: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(30).optional(),
    specialRequests: z.string().trim().max(500).optional(),
    branchId: z.string().trim().max(80).optional(),
    branchName: z.string().trim().max(150).optional(),
    branchCity: z.string().trim().max(80).optional(),
  })
  .strict();

const reservationStatusUpdateSchema = z
  .object({
    status: z.enum(['Pending', 'Confirmed', 'Seated', 'Completed', 'No-Show', 'Declined', 'Cancelled']),
  })
  .strict();

// ── Table QR Schemas ─────────────────────────────────────────
const tableQRVerifySchema = z
  .object({
    qrData: z.string().trim().min(5, 'QR payload is required').max(2048),
  })
  .strict();

// ── Review Schemas ───────────────────────────────────────────
const reviewCreateSchema = z
  .object({
    orderId: objectIdSchema,
    menuItemId: objectIdSchema,
    rating: z.coerce.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
    comment: z.string().trim().max(500).optional().default(''),
  })
  .strict();

const reviewUpdateSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(500).optional(),
  })
  .strict();

const reviewReplySchema = z
  .object({
    reply: z.string().trim().min(1, 'Reply cannot be empty').max(1000).optional(),
    managerReply: z.string().trim().min(1, 'Reply cannot be empty').max(1000).optional(),
  })
  .strict()
  .refine((data) => data.reply || data.managerReply, {
    message: 'Reply text is required',
  });

// ── Voucher Schemas ──────────────────────────────────────────
const voucherValidateSchema = z
  .object({
    code: z.string().trim().min(2, 'Voucher code is required').max(50),
    subtotal: z.coerce.number().min(0).max(10000000).optional().default(0),
    branchId: z.string().trim().max(80).optional().default('all'),
  })
  .strict();

const voucherCreateSchema = z
  .object({
    code: z.string().trim().min(2).max(50),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().min(1),
    maxDiscountAmount: z.number().min(0).optional(),
    minOrderAmount: z.number().min(0).optional().default(0),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
    usageLimit: z.number().int().min(1).optional(),
    perUserLimit: z.number().int().min(1).optional(),
    applicableBranchId: z.string().trim().max(80).optional().default('all'),
    description: z.string().trim().max(300).optional().default(''),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

const voucherUpdateSchema = voucherCreateSchema.partial().strict();

// ── Loyalty Schemas ──────────────────────────────────────────
const loyaltyQuoteSchema = z
  .object({
    points: z.coerce.number().int().min(50, 'Minimum redemption is 50 points'),
    subtotal: z.coerce.number().min(0).max(10000000).optional().default(0),
  })
  .strict();

// ── Analytics Schemas ────────────────────────────────────────
const analyticsQuerySchema = z
  .object({
    range: z.enum(['today', '7d', '30d']).optional().default('today'),
    branch: z.string().trim().max(80).optional().default('all'),
  })
  .strip();

// ── Inventory Schemas ────────────────────────────────────────
const inventoryRestockSchema = z
  .object({
    stockCount: z.coerce.number().int().min(0, 'Stock cannot be negative').max(100000),
    isAvailable: z.boolean().optional(),
  })
  .strict();

// ── Password Reset Schemas ───────────────────────────────────
const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Please provide a valid email address under 100 characters'),
  })
  .strict();

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(10, 'Reset token is required').max(512),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be under 128 characters')
      .regex(/\d/, 'Password must contain at least one digit'),
  })
  .strict();

module.exports = {
  objectIdSchema,
  idParamSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  staffCreateSchema,
  staffUpdateSchema,
  phoneSendOtpSchema,
  phoneVerifyOtpSchema,
  menuItemCreateSchema,
  menuItemUpdateSchema,
  menuQuerySchema,
  orderCreateSchema,
  orderStatusUpdateSchema,
  reservationCreateSchema,
  reservationStatusUpdateSchema,
  tableQRVerifySchema,
  reviewCreateSchema,
  reviewUpdateSchema,
  reviewReplySchema,
  voucherValidateSchema,
  voucherCreateSchema,
  voucherUpdateSchema,
  loyaltyQuoteSchema,
  analyticsQuerySchema,
  inventoryRestockSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
