const voucherService = require('../services/voucherService');

// @desc    Get active vouchers for customer Deals row
// @route   GET /api/vouchers/active
// @access  Public
exports.getActiveVouchers = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const vouchers = await voucherService.getActiveVouchers(userId);
    res.status(200).json({ success: true, data: vouchers });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error fetching active vouchers',
    });
  }
};

// @desc    Validate voucher code against subtotal and branch
// @route   POST /api/vouchers/validate
// @access  Public / Authenticated
exports.validateVoucher = async (req, res) => {
  try {
    const { code, subtotal, branchId } = req.body;
    const userId = req.user ? req.user._id : null;
    const result = await voucherService.validateVoucher(code, subtotal, branchId, userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error validating voucher',
    });
  }
};

// @desc    Get all vouchers (Manager only)
// @route   GET /api/vouchers
// @access  Private (Manager only)
exports.getAllVouchers = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const data = await voucherService.getAllVouchers({ page, limit, status });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error retrieving vouchers',
    });
  }
};

// @desc    Create new voucher (Manager only)
// @route   POST /api/vouchers
// @access  Private (Manager only)
exports.createVoucher = async (req, res) => {
  try {
    const voucher = await voucherService.createVoucher(req.body, req.user._id);
    res.status(201).json({ success: true, data: voucher });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error creating voucher',
    });
  }
};

// @desc    Update voucher (Manager only)
// @route   PUT /api/vouchers/:id
// @access  Private (Manager only)
exports.updateVoucher = async (req, res) => {
  try {
    const updated = await voucherService.updateVoucher(req.params.id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error updating voucher',
    });
  }
};

// @desc    Toggle voucher status active/inactive (Manager only)
// @route   PATCH /api/vouchers/:id/toggle
// @access  Private (Manager only)
exports.toggleVoucher = async (req, res) => {
  try {
    const updated = await voucherService.toggleVoucher(req.params.id);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error toggling voucher status',
    });
  }
};

// @desc    Delete voucher (Manager only)
// @route   DELETE /api/vouchers/:id
// @access  Private (Manager only)
exports.deleteVoucher = async (req, res) => {
  try {
    const result = await voucherService.deleteVoucher(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error deleting voucher',
    });
  }
};

// @desc    Deactivate all demo vouchers (Manager only)
// @route   POST /api/vouchers/deactivate-demo
// @access  Private (Manager only)
exports.deactivateDemoVouchers = async (req, res) => {
  try {
    const result = await voucherService.deactivateDemoVouchers();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error deactivating demo vouchers',
    });
  }
};
