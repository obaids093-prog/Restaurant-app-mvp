const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');

const TIER_CONFIG = {
  Bronze: {
    minLifetime: 0,
    multiplier: 1.0,
    bonusPercent: 0,
    nextTier: 'Silver',
    threshold: 500,
    perks: 'Standard patron privileges • 1 point per Rs. 100 spent',
  },
  Silver: {
    minLifetime: 500,
    multiplier: 1.05,
    bonusPercent: 5,
    nextTier: 'Gold',
    threshold: 1500,
    perks: '5% bonus points on culinary orders • Silver VIP badge',
  },
  Gold: {
    minLifetime: 1500,
    multiplier: 1.1,
    bonusPercent: 10,
    nextTier: 'Platinum',
    threshold: 4000,
    perks: '10% bonus points • Priority reservation confirmations • Gold VIP badge',
  },
  Platinum: {
    minLifetime: 4000,
    multiplier: 1.15,
    bonusPercent: 15,
    nextTier: null,
    threshold: null,
    perks: '15% bonus points • Executive concierge • Signature chef tasting invitations',
  },
};

/**
 * Determine loyalty tier based on cumulative lifetime points
 */
function calculateTier(lifetimePoints = 0) {
  const points = Math.max(0, Number(lifetimePoints) || 0);
  if (points >= 4000) return 'Platinum';
  if (points >= 1500) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
}

/**
 * Get comprehensive loyalty profile, tier status, and transaction ledger
 */
async function getLoyaltySummary(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('Invalid user ID');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Patron not found');
    error.status = 404;
    throw error;
  }

  const currentPoints = Math.max(0, user.loyaltyPoints || 0);
  const lifetimePoints = Math.max(0, user.lifetimePoints || 0);
  const computedTier = calculateTier(lifetimePoints);

  // Auto-upgrade tier in DB if newly crossed threshold
  if (user.loyaltyTier !== computedTier) {
    user.loyaltyTier = computedTier;
    await user.save();
  }

  const tierInfo = TIER_CONFIG[computedTier];
  let pointsToNextTier = 0;
  let progressPercent = 100;

  if (tierInfo.threshold) {
    const prevThreshold = tierInfo.minLifetime;
    const range = tierInfo.threshold - prevThreshold;
    const progressIntoTier = Math.max(0, lifetimePoints - prevThreshold);
    progressPercent = Math.min(100, Math.round((progressIntoTier / range) * 100));
    pointsToNextTier = Math.max(0, tierInfo.threshold - lifetimePoints);
  }

  const history = await LoyaltyTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    points: currentPoints,
    lifetimePoints,
    tier: computedTier,
    multiplier: tierInfo.multiplier,
    bonusPercent: tierInfo.bonusPercent,
    perks: tierInfo.perks,
    nextTier: tierInfo.nextTier,
    nextTierThreshold: tierInfo.threshold,
    pointsToNextTier,
    progressPercent,
    history,
  };
}

/**
 * Quote points redemption: checks balance, caps at 50% order subtotal
 */
async function quoteRedemption(userId, pointsToRedeem, orderSubtotal = 0) {
  const subtotal = Math.max(0, Number(orderSubtotal) || 0);
  const points = Math.max(0, Math.floor(Number(pointsToRedeem) || 0));

  if (points < 50) {
    const error = new Error('Minimum redemption is 50 loyalty points');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Patron not found');
    error.status = 404;
    throw error;
  }

  if ((user.loyaltyPoints || 0) < points) {
    const error = new Error(
      `Insufficient points. You have ${user.loyaltyPoints || 0} points, but attempted to redeem ${points}.`
    );
    error.status = 400;
    throw error;
  }

  // Max 50% of subtotal can be covered by points
  const maxAllowedPoints = Math.floor(subtotal * 0.5);
  if (points > maxAllowedPoints && maxAllowedPoints > 0) {
    const error = new Error(
      `Points redemption cannot exceed 50% of food subtotal (max ${maxAllowedPoints} points for this order).`
    );
    error.status = 400;
    throw error;
  }

  return {
    valid: true,
    pointsToRedeem: points,
    discountAmount: points, // 1 point = Rs. 1
    remainingPoints: user.loyaltyPoints - points,
  };
}

/**
 * Atomically redeem points for an order
 */
async function redeemPoints(userId, pointsToRedeem, orderId, orderSubtotal = 0) {
  const quote = await quoteRedemption(userId, pointsToRedeem, orderSubtotal);
  const points = quote.pointsToRedeem;

  // Atomically deduct points ensuring balance doesn't drop below zero
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, loyaltyPoints: { $gte: points } },
    { $inc: { loyaltyPoints: -points } },
    { new: true }
  );

  if (!updatedUser) {
    const error = new Error('Could not redeem points: insufficient balance or concurrent modification');
    error.status = 400;
    throw error;
  }

  // Record ledger entry
  await LoyaltyTransaction.create({
    user: userId,
    order: orderId || null,
    type: 'redeem',
    points: -points,
    balanceAfter: updatedUser.loyaltyPoints,
    description: `Redeemed ${points} points at checkout (-Rs. ${points})`,
  });

  return {
    pointsRedeemed: points,
    discountAmount: points,
    newBalance: updatedUser.loyaltyPoints,
  };
}

/**
 * Award loyalty points when an order is completed / served
 */
async function awardOrderPoints(orderId) {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return { pointsEarned: 0 };
  }

  const order = await Order.findById(orderId);
  if (!order) return { pointsEarned: 0 };

  // Strict idempotency: never award points twice for the same order
  if (order.pointsAwarded) {
    return { pointsEarned: order.pointsEarned || 0 };
  }

  // Net spend is subtotal minus promotional voucher discount minus points discount
  const netSpend = Math.max(
    0,
    (order.subtotal || 0) - (order.discountAmount || 0) - (order.pointsDiscountAmount || 0)
  );

  // 1 Base point per Rs. 100 net spend
  const basePoints = Math.floor(netSpend / 100);
  if (basePoints <= 0) {
    order.pointsAwarded = true;
    order.pointsEarned = 0;
    await order.save();
    return { pointsEarned: 0 };
  }

  const user = await User.findById(order.user);
  if (!user) return { pointsEarned: 0 };

  const currentTier = user.loyaltyTier || 'Bronze';
  const multiplier = TIER_CONFIG[currentTier]?.multiplier || 1.0;
  const totalPointsEarned = Math.round(basePoints * multiplier);

  // Atomically credit user points and update lifetime points
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $inc: {
        loyaltyPoints: totalPointsEarned,
        lifetimePoints: totalPointsEarned,
      },
    },
    { new: true }
  );

  // Upgrade tier if lifetime points crossed a milestone
  const newTier = calculateTier(updatedUser.lifetimePoints);
  if (updatedUser.loyaltyTier !== newTier) {
    updatedUser.loyaltyTier = newTier;
    await updatedUser.save();
  }

  // Record ledger transaction
  await LoyaltyTransaction.create({
    user: user._id,
    order: order._id,
    type: 'earn',
    points: totalPointsEarned,
    balanceAfter: updatedUser.loyaltyPoints,
    description: `Earned ${totalPointsEarned} points (${currentTier} Tier${
      multiplier > 1 ? ` • ${Math.round((multiplier - 1) * 100)}% Bonus` : ''
    }) for order #${order._id.toString().slice(-6).toUpperCase()}`,
  });

  // Mark order as awarded
  order.pointsEarned = totalPointsEarned;
  order.pointsAwarded = true;
  await order.save();

  // Dispatch notifications for points earned and potential tier upgrade
  try {
    const notificationService = require('./notificationService');
    await notificationService.notifyLoyaltyPoints(
      user._id,
      totalPointsEarned,
      updatedUser.loyaltyPoints
    );
    if (currentTier !== newTier) {
      await notificationService.notifyTierUpgrade(user._id, newTier);
    }
  } catch (notifErr) {
    console.warn('Failed to dispatch loyalty notification:', notifErr.message);
  }

  return {
    pointsEarned: totalPointsEarned,
    newBalance: updatedUser.loyaltyPoints,
    tier: updatedUser.loyaltyTier,
  };
}

module.exports = {
  TIER_CONFIG,
  calculateTier,
  getLoyaltySummary,
  quoteRedemption,
  redeemPoints,
  awardOrderPoints,
};
