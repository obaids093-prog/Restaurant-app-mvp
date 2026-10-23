const Order = require('../models/Order');

const TIMEZONE = process.env.TIMEZONE || '+05:00'; // Default: Pakistan Standard Time (PKT)

/**
 * Calculate start date based on range string
 */
function getStartDateForRange(range = 'today') {
  const now = new Date();
  if (range === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }

  // 'today': beginning of today in current timezone (+05:00)
  // Shift by timezone offset to compute local midnight in UTC
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Compute executive analytics summary
 */
async function getAnalyticsSummary({ range = 'today', branch = 'all' } = {}) {
  const startDate = getStartDateForRange(range);

  // Match condition for base orders
  const baseMatch = {
    createdAt: { $gte: startDate },
  };

  if (branch && branch !== 'all') {
    baseMatch.branchId = branch;
  }

  // 1. Core KPIs: Revenue, Order Count, AOV (excluding Cancelled)
  const [kpiResult] = await Order.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        validOrders: {
          $sum: { $cond: [{ $ne: ['$status', 'Cancelled'] }, 1, 0] },
        },
        revenue: {
          $sum: {
            $cond: [{ $ne: ['$status', 'Cancelled'] }, '$totalAmount', 0],
          },
        },
      },
    },
  ]);

  const revenue = kpiResult ? Math.round(kpiResult.revenue * 100) / 100 : 0;
  const validOrders = kpiResult ? kpiResult.validOrders : 0;
  const totalOrders = kpiResult ? kpiResult.totalOrders : 0;
  const averageOrderValue = validOrders > 0 ? Math.round((revenue / validOrders) * 100) / 100 : 0;

  // 2. Orders by Status
  const statusAggregation = await Order.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const ordersByStatus = {
    Pending: 0,
    Preparing: 0,
    Ready: 0,
    Served: 0,
    Cancelled: 0,
  };
  statusAggregation.forEach((s) => {
    if (s._id && ordersByStatus[s._id] !== undefined) {
      ordersByStatus[s._id] = s.count;
    }
  });

  // 3. Top 5 Dishes by Quantity and Revenue (excluding Cancelled)
  const topDishes = await Order.aggregate([
    {
      $match: {
        ...baseMatch,
        status: { $ne: 'Cancelled' },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { quantity: -1, revenue: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        name: '$_id',
        quantity: 1,
        revenue: { $round: ['$revenue', 2] },
      },
    },
  ]);

  // 4. Orders and Revenue by Hour of Day (0..23)
  const hourlyAggregation = await Order.aggregate([
    {
      $match: {
        ...baseMatch,
        status: { $ne: 'Cancelled' },
      },
    },
    {
      $project: {
        hour: {
          $hour: {
            date: '$createdAt',
            timezone: TIMEZONE,
          },
        },
        totalAmount: 1,
      },
    },
    {
      $group: {
        _id: '$hour',
        orderCount: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in 24 hours (0 to 23)
  const hourlyMap = new Map();
  hourlyAggregation.forEach((h) => {
    hourlyMap.set(h._id, {
      orderCount: h.orderCount,
      revenue: Math.round(h.revenue * 100) / 100,
    });
  });

  const hourly = [];
  for (let i = 0; i < 24; i++) {
    const data = hourlyMap.get(i) || { orderCount: 0, revenue: 0 };
    hourly.push({
      hour: i,
      label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
      orderCount: data.orderCount,
      revenue: data.revenue,
    });
  }

  // 5. By Branch
  const byBranch = await Order.aggregate([
    {
      $match: {
        ...baseMatch,
        status: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: {
          branchId: '$branchId',
          branchName: '$branchName',
        },
        orderCount: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    {
      $project: {
        _id: 0,
        branchId: '$_id.branchId',
        branchName: '$_id.branchName',
        orderCount: 1,
        revenue: { $round: ['$revenue', 2] },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // 6. Repeat Customers (users who placed >1 order overall)
  const repeatCustomersAgg = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $count: 'repeatCount',
    },
  ]);

  const repeatCustomers = repeatCustomersAgg.length > 0 ? repeatCustomersAgg[0].repeatCount : 0;

  return {
    range,
    branch,
    revenue,
    orderCount: validOrders,
    totalOrders,
    averageOrderValue,
    ordersByStatus,
    topDishes,
    hourly,
    byBranch,
    repeatCustomers,
  };
}

module.exports = {
  getAnalyticsSummary,
};
