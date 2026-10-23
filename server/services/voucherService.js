const Voucher = require('../models/Voucher');

/**
 * Validate a promotional voucher against cart subtotal and optional branch
 */
async function validateVoucher(code, subtotal = 0, branchId = 'all') {
  if (!code || typeof code !== 'string') {
    const error = new Error('Please provide a voucher code');
    error.status = 400;
    throw error;
  }

  const cleanCode = code.trim().toUpperCase();
  const numericSubtotal = Math.max(0, Number(subtotal) || 0);

  const voucher = await Voucher.findOne({ code: cleanCode });
  if (!voucher) {
    const error = new Error(`Voucher code "${cleanCode}" is invalid`);
    error.status = 404;
    throw error;
  }

  if (!voucher.isActive) {
    const error = new Error(`Voucher code "${cleanCode}" is currently inactive`);
    error.status = 400;
    throw error;
  }

  const now = new Date();
  if (voucher.validFrom && now < new Date(voucher.validFrom)) {
    const error = new Error(`Voucher code "${cleanCode}" is not yet active`);
    error.status = 400;
    throw error;
  }

  if (voucher.validUntil && now > new Date(voucher.validUntil)) {
    const error = new Error(`Voucher code "${cleanCode}" expired on ${new Date(voucher.validUntil).toLocaleDateString()}`);
    error.status = 400;
    throw error;
  }

  if (voucher.usageLimit !== null && voucher.usageLimit !== undefined && voucher.usageCount >= voucher.usageLimit) {
    const error = new Error(`Voucher code "${cleanCode}" has reached its maximum usage limit`);
    error.status = 400;
    throw error;
  }

  if (voucher.applicableBranchId && voucher.applicableBranchId !== 'all' && branchId && branchId !== 'all') {
    if (voucher.applicableBranchId !== branchId) {
      const error = new Error(`Voucher code "${cleanCode}" is only valid for a specific outlet`);
      error.status = 400;
      throw error;
    }
  }

  if (voucher.minOrderAmount && numericSubtotal < voucher.minOrderAmount) {
    const error = new Error(
      `Minimum order of Rs. ${voucher.minOrderAmount.toLocaleString()} required for voucher "${cleanCode}"`
    );
    error.status = 400;
    throw error;
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (voucher.discountType === 'percentage') {
    discountAmount = Math.round((numericSubtotal * voucher.discountValue) / 100);
    if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
      discountAmount = voucher.maxDiscountAmount;
    }
  } else {
    // Fixed amount discount
    discountAmount = Math.min(voucher.discountValue, numericSubtotal);
  }

  const discountedSubtotal = Math.max(0, numericSubtotal - discountAmount);

  return {
    valid: true,
    voucherId: voucher._id,
    code: voucher.code,
    description: voucher.description,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    discountAmount,
    minOrderAmount: voucher.minOrderAmount,
    maxDiscountAmount: voucher.maxDiscountAmount,
    originalSubtotal: numericSubtotal,
    discountedSubtotal,
  };
}

/**
 * Increment usage counter for a voucher when an order is placed
 */
async function recordVoucherUsage(code) {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  return Voucher.findOneAndUpdate(
    { code: cleanCode },
    { $inc: { usageCount: 1 } },
    { new: true }
  );
}

/**
 * Create a new promotional voucher (Manager)
 */
async function createVoucher(voucherData, managerId) {
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    validFrom,
    validUntil,
    usageLimit,
    isActive,
    applicableBranchId,
  } = voucherData;

  if (!code || !discountValue || !validUntil) {
    const error = new Error('Code, discount value, and expiration date are required');
    error.status = 400;
    throw error;
  }

  const cleanCode = code.trim().toUpperCase();
  const existing = await Voucher.findOne({ code: cleanCode });
  if (existing) {
    const error = new Error(`Voucher code "${cleanCode}" already exists`);
    error.status = 409;
    throw error;
  }

  const voucher = await Voucher.create({
    code: cleanCode,
    description: description ? description.trim() : '',
    discountType: discountType || 'percentage',
    discountValue: Number(discountValue),
    minOrderAmount: minOrderAmount ? Math.max(0, Number(minOrderAmount)) : 0,
    maxDiscountAmount: maxDiscountAmount ? Math.max(0, Number(maxDiscountAmount)) : null,
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: new Date(validUntil),
    usageLimit: usageLimit ? Math.max(1, Number(usageLimit)) : null,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    applicableBranchId: applicableBranchId ? applicableBranchId.trim() : 'all',
    createdBy: managerId || null,
  });

  return voucher;
}

/**
 * Retrieve all vouchers with pagination and optional filter (Manager)
 */
async function getAllVouchers({ page = 1, limit = 20, status = 'all' } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  const query = {};
  if (status === 'active') {
    query.isActive = true;
    query.validUntil = { $gte: new Date() };
  } else if (status === 'expired') {
    query.validUntil = { $lt: new Date() };
  } else if (status === 'disabled') {
    query.isActive = false;
  }

  const [vouchers, total] = await Promise.all([
    Voucher.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('createdBy', 'name email')
      .lean(),
    Voucher.countDocuments(query),
  ]);

  return {
    vouchers,
    total,
    page: p,
    totalPages: Math.ceil(total / l) || 1,
  };
}

/**
 * Update an existing voucher
 */
async function updateVoucher(id, updateData) {
  const voucher = await Voucher.findById(id);
  if (!voucher) {
    const error = new Error('Voucher not found');
    error.status = 404;
    throw error;
  }

  const allowedFields = [
    'description',
    'discountType',
    'discountValue',
    'minOrderAmount',
    'maxDiscountAmount',
    'validUntil',
    'validFrom',
    'usageLimit',
    'isActive',
    'applicableBranchId',
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      voucher[field] = updateData[field];
    }
  });

  await voucher.save();
  return voucher;
}

/**
 * Toggle active status
 */
async function toggleVoucher(id) {
  const voucher = await Voucher.findById(id);
  if (!voucher) {
    const error = new Error('Voucher not found');
    error.status = 404;
    throw error;
  }

  voucher.isActive = !voucher.isActive;
  await voucher.save();
  return voucher;
}

/**
 * Delete a voucher
 */
async function deleteVoucher(id) {
  const voucher = await Voucher.findByIdAndDelete(id);
  if (!voucher) {
    const error = new Error('Voucher not found');
    error.status = 404;
    throw error;
  }
  return { success: true, message: 'Voucher deleted successfully' };
}

module.exports = {
  validateVoucher,
  recordVoucherUsage,
  createVoucher,
  getAllVouchers,
  updateVoucher,
  toggleVoucher,
  deleteVoucher,
};
