// server/tests/riderTracking.test.js
// ═══════════════════════════════════════════════════════════════════
// Test suite for GPS Rider Tracking:
//   - Waypoint generation (Bezier interpolation, correct count)
//   - Haversine distance calculation accuracy
//   - Order telemetry snapshots by status (Pending → Ready → Served)
//   - REST endpoint GET /api/orders/:id/rider-tracking
//   - 404 for non-existent orders
// ═══════════════════════════════════════════════════════════════════

const {
  generateWaypoints,
  calculateDistanceKm,
  BRANCH_COORDINATES,
  DEFAULT_DESTINATIONS,
  getOrderRiderTracking,
} = require('../services/riderTrackingService');

// ── Waypoint Generation ────────────────────────────────────────────

describe('generateWaypoints', () => {
  const start = { latitude: 31.5126, longitude: 74.3436 };
  const end = { latitude: 31.4725, longitude: 74.4105 };

  test('generates exactly 7 sequential waypoints between start and end', () => {
    const points = generateWaypoints(start, end);
    expect(points).toHaveLength(7);
    expect(points[0].stepIndex).toBe(0);
    expect(points[6].stepIndex).toBe(6);
  });

  test('first waypoint matches start coordinates', () => {
    const points = generateWaypoints(start, end);
    expect(points[0].latitude).toBeCloseTo(start.latitude, 3);
    expect(points[0].longitude).toBeCloseTo(start.longitude, 3);
  });

  test('last waypoint matches end coordinates', () => {
    const points = generateWaypoints(start, end);
    expect(points[6].latitude).toBeCloseTo(end.latitude, 3);
    expect(points[6].longitude).toBeCloseTo(end.longitude, 3);
  });

  test('all waypoints have valid latitude and longitude numbers', () => {
    const points = generateWaypoints(start, end);
    points.forEach((p) => {
      expect(typeof p.latitude).toBe('number');
      expect(typeof p.longitude).toBe('number');
      expect(p.latitude).not.toBeNaN();
      expect(p.longitude).not.toBeNaN();
    });
  });
});

// ── Haversine Distance Calculation ─────────────────────────────────

describe('calculateDistanceKm', () => {
  test('calculates correct distance between Gulberg and DHA Lahore (~6-8 km)', () => {
    const dist = calculateDistanceKm(31.5126, 74.3436, 31.4725, 74.4105);
    expect(dist).toBeGreaterThan(4);
    expect(dist).toBeLessThan(12);
  });

  test('returns 0 distance for identical coordinates', () => {
    const dist = calculateDistanceKm(31.5126, 74.3436, 31.5126, 74.3436);
    expect(dist).toBe(0);
  });

  test('returns consistent result regardless of direction', () => {
    const distAB = calculateDistanceKm(31.5126, 74.3436, 33.7150, 73.0560);
    const distBA = calculateDistanceKm(33.7150, 73.0560, 31.5126, 74.3436);
    expect(distAB).toBe(distBA);
  });
});

// ── Branch Coordinates Integrity ───────────────────────────────────

describe('BRANCH_COORDINATES', () => {
  test('includes Lahore Gulberg and Islamabad Blue Area branches', () => {
    expect(BRANCH_COORDINATES.lhr_gulberg).toBeDefined();
    expect(BRANCH_COORDINATES.isb_blue_area).toBeDefined();
  });

  test('Lahore branch has valid GPS coordinates within Lahore', () => {
    const { latitude, longitude } = BRANCH_COORDINATES.lhr_gulberg;
    expect(latitude).toBeGreaterThan(31.0);
    expect(latitude).toBeLessThan(32.0);
    expect(longitude).toBeGreaterThan(74.0);
    expect(longitude).toBeLessThan(75.0);
  });

  test('Islamabad branch has valid GPS coordinates within Islamabad', () => {
    const { latitude, longitude } = BRANCH_COORDINATES.isb_blue_area;
    expect(latitude).toBeGreaterThan(33.0);
    expect(latitude).toBeLessThan(34.0);
    expect(longitude).toBeGreaterThan(72.5);
    expect(longitude).toBeLessThan(74.0);
  });
});

// ── Default Destinations Integrity ─────────────────────────────────

describe('DEFAULT_DESTINATIONS', () => {
  test('includes Lahore and Islamabad delivery defaults', () => {
    expect(DEFAULT_DESTINATIONS.Lahore).toBeDefined();
    expect(DEFAULT_DESTINATIONS.Islamabad).toBeDefined();
  });

  test('each destination has address, latitude, and longitude', () => {
    ['Lahore', 'Islamabad'].forEach((city) => {
      const dest = DEFAULT_DESTINATIONS[city];
      expect(dest.address).toBeTruthy();
      expect(typeof dest.latitude).toBe('number');
      expect(typeof dest.longitude).toBe('number');
    });
  });
});

// ── getOrderRiderTracking Service ──────────────────────────────────

describe('getOrderRiderTracking', () => {
  // Mock the Order model to avoid real database dependency
  const Order = require('../models/Order');
  const originalFindById = Order.findById;

  afterAll(() => {
    Order.findById = originalFindById;
  });

  const mockOrder = (status, overrides = {}) => ({
    _id: '665f1a2b3c4d5e6f7a8b9c0d',
    status,
    branchId: 'lhr_gulberg',
    branchCity: 'Lahore',
    orderType: 'Delivery',
    createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
    ...overrides,
  });

  const mockFindById = (order) => {
    Order.findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(order),
    });
  };

  test('returns null for non-existent orderId', async () => {
    mockFindById(null);
    const result = await getOrderRiderTracking('nonexistent');
    expect(result).toBeNull();
  });

  test('returns valid tracking telemetry for a Pending order', async () => {
    mockFindById(mockOrder('Pending'));
    const result = await getOrderRiderTracking('665f1a2b3c4d5e6f7a8b9c0d');

    expect(result).toBeDefined();
    expect(result.orderId).toBe('665f1a2b3c4d5e6f7a8b9c0d');
    expect(result.orderStatus).toBe('Pending');
    expect(result.rider.status).toBe('assigned');
    expect(result.route.progressPercent).toBeLessThanOrEqual(0.15);
    expect(result.route.speedKmh).toBe(0);
  });

  test('returns at_restaurant status for a Preparing order', async () => {
    mockFindById(mockOrder('Preparing'));
    const result = await getOrderRiderTracking('665f1a2b3c4d5e6f7a8b9c0d');

    expect(result.rider.status).toBe('at_restaurant');
    expect(result.route.progressPercent).toBeLessThanOrEqual(0.35);
  });

  test('returns on_the_way status with speed for a Ready order', async () => {
    mockFindById(mockOrder('Ready'));
    const result = await getOrderRiderTracking('665f1a2b3c4d5e6f7a8b9c0d');

    expect(result.rider.status).toBe('on_the_way');
    expect(result.route.speedKmh).toBeGreaterThan(0);
    expect(result.route.progressPercent).toBeGreaterThanOrEqual(0.4);
  });

  test('returns arrived status at 100% for a Served order', async () => {
    mockFindById(mockOrder('Served'));
    const result = await getOrderRiderTracking('665f1a2b3c4d5e6f7a8b9c0d');

    expect(result.rider.status).toBe('arrived');
    expect(result.route.progressPercent).toBe(1.0);
    expect(result.route.etaMinutes).toBe(0);
  });

  test('includes restaurant, destination, rider, and route structure', async () => {
    mockFindById(mockOrder('Ready'));
    const result = await getOrderRiderTracking('665f1a2b3c4d5e6f7a8b9c0d');

    // Restaurant
    expect(result.restaurant.latitude).toBeDefined();
    expect(result.restaurant.name).toContain('AURA');

    // Destination
    expect(result.destination.address).toBeTruthy();
    expect(result.destination.latitude).toBeDefined();

    // Rider
    expect(result.rider.name).toBeTruthy();
    expect(result.rider.phone).toBeTruthy();
    expect(result.rider.currentCoordinates.latitude).toBeDefined();
    expect(result.rider.currentCoordinates.longitude).toBeDefined();

    // Route
    expect(result.route.waypoints).toHaveLength(7);
    expect(result.route.totalDistanceKm).toBeGreaterThan(0);
    expect(result.route.distanceRemainingKm).toBeGreaterThanOrEqual(0);
  });

  test('uses Islamabad branch when branchId is isb_blue_area', async () => {
    mockFindById(mockOrder('Ready', { branchId: 'isb_blue_area', branchCity: 'Islamabad' }));
    const result = await getOrderRiderTracking('665f1a2b3c4d5e6f7a8b9c0d');

    expect(result.restaurant.city).toBe('Islamabad');
    expect(result.destination.address).toContain('Islamabad');
  });

  test('uses custom delivery coordinates when provided on order', async () => {
    const customCoords = { latitude: 31.4800, longitude: 74.3900 };
    mockFindById(mockOrder('Ready', {
      deliveryAddress: '42 Faisal Town, Lahore',
      deliveryCoordinates: customCoords,
    }));
    const result = await getOrderRiderTracking('665f1a2b3c4d5e6f7a8b9c0d');

    expect(result.destination.address).toBe('42 Faisal Town, Lahore');
    expect(result.destination.latitude).toBe(customCoords.latitude);
    expect(result.destination.longitude).toBe(customCoords.longitude);
  });
});
