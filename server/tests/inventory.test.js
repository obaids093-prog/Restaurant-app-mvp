const {
  depleteOrderIngredients,
  restoreOrderIngredients,
  replenishDishStock,
  getInventoryOverview,
} = require('../services/inventoryService');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');

describe('Inventory Depletion & Restitution Service (Safety Fix #3)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Depletion safety & boundary checks', () => {
    it('handles empty or null order safely without throwing', async () => {
      const res = await depleteOrderIngredients(null);
      expect(res).toEqual({ depleted: [] });

      const res2 = await depleteOrderIngredients({ items: [] });
      expect(res2).toEqual({ depleted: [] });
    });

    it('runs depletion algorithm with non-existent dish items safely', async () => {
      jest.spyOn(MenuItem, 'findById').mockResolvedValue(null);
      jest.spyOn(MenuItem, 'findOne').mockResolvedValue(null);

      const mockOrder = {
        items: [{ name: 'Nonexistent Test Dish', quantity: 2 }],
      };
      const res = await depleteOrderIngredients(mockOrder);
      expect(Array.isArray(res.depleted)).toBe(true);
      expect(res.depleted).toHaveLength(0);
    });

    it('atomically decrements stock and auto-toggles sold-out when stock reaches zero', async () => {
      const fakeDish = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Wagyu Beef Slider',
        stockCount: 2,
        isAvailable: true,
        recipe: [{ ingredient: 'Wagyu Patty', quantity: 1 }],
      };

      jest.spyOn(MenuItem, 'findById').mockResolvedValue(fakeDish);
      const findOneAndUpdateSpy = jest.spyOn(MenuItem, 'findOneAndUpdate').mockResolvedValue({
        ...fakeDish,
        stockCount: 0,
        isAvailable: false,
      });
      const updateSpy = jest.spyOn(MenuItem, 'findByIdAndUpdate').mockResolvedValue({
        ...fakeDish,
        stockCount: 0,
        isAvailable: false,
      });
      jest.spyOn(Ingredient, 'findOneAndUpdate').mockResolvedValue({ _id: 'ing_1', stock: 8 });

      const mockOrder = {
        items: [{ menuItem: fakeDish._id, quantity: 2 }],
      };

      const result = await depleteOrderIngredients(mockOrder);
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { _id: fakeDish._id, stockCount: { $gte: 2 } },
        { $inc: { stockCount: -2 } },
        { new: true }
      );
      expect(result.depleted[0].remainingStock).toBe(0);
      expect(result.depleted[0].autoSoldOut).toBe(true);
    });

    it('clamps decrement so stockCount never drops below zero', async () => {
      const fakeDish = {
        _id: '507f1f77bcf86cd799439022',
        name: 'Molten Lava Cake',
        stockCount: 1,
        isAvailable: true,
        recipe: [],
      };

      jest.spyOn(MenuItem, 'findById').mockImplementation((id) => ({
        select: () => ({
          lean: () => Promise.resolve({ stockCount: 1 }),
        }),
        then: (resolve) => resolve(fakeDish),
      }));

      // Full qty (5) fails on $gte: 5
      jest.spyOn(MenuItem, 'findOneAndUpdate').mockImplementation((filter) => {
        if (filter.stockCount && filter.stockCount.$gte === 5) {
          return Promise.resolve(null);
        }
        if (filter.stockCount && filter.stockCount.$gte === 1) {
          return Promise.resolve({ ...fakeDish, stockCount: 0, isAvailable: false });
        }
        return Promise.resolve(null);
      });

      jest.spyOn(MenuItem, 'findByIdAndUpdate').mockResolvedValue({
        ...fakeDish,
        stockCount: 0,
        isAvailable: false,
      });

      // Requesting 5 when only 1 exists
      const mockOrder = {
        items: [{ menuItem: fakeDish._id, quantity: 5 }],
      };

      const result = await depleteOrderIngredients(mockOrder);
      expect(result.depleted[0].remainingStock).toBe(0);
      expect(result.depleted[0].autoSoldOut).toBe(true);
    });

    it('simulates concurrent simultaneous orders on same dish without going negative', async () => {
      let currentStock = 3;
      const fakeDishId = '507f1f77bcf86cd799439099';

      jest.spyOn(MenuItem, 'findById').mockImplementation(() =>
        Promise.resolve({
          _id: fakeDishId,
          name: 'Concurrent Slider',
          stockCount: currentStock,
          recipe: [],
        })
      );

      jest.spyOn(MenuItem, 'findOneAndUpdate').mockImplementation((filter, update) => {
        const required = filter.stockCount?.$gte || 1;
        if (currentStock >= required) {
          const dec = Math.abs(update.$inc?.stockCount || 0);
          currentStock = Math.max(0, currentStock - dec);
          return Promise.resolve({
            _id: fakeDishId,
            name: 'Concurrent Slider',
            stockCount: currentStock,
          });
        }
        return Promise.resolve(null);
      });

      jest.spyOn(MenuItem, 'findByIdAndUpdate').mockResolvedValue({});

      // Fire 3 simultaneous orders of 2 items each when only 3 items exist in total
      const order1 = depleteOrderIngredients({ items: [{ menuItem: fakeDishId, quantity: 2 }] });
      const order2 = depleteOrderIngredients({ items: [{ menuItem: fakeDishId, quantity: 2 }] });
      const order3 = depleteOrderIngredients({ items: [{ menuItem: fakeDishId, quantity: 2 }] });

      const [res1, res2, res3] = await Promise.all([order1, order2, order3]);
      expect(currentStock).toBeGreaterThanOrEqual(0);
      expect(currentStock).toBe(0); // 3 items depleted down to 0, never negative
    });
  });

  describe('Cancellation restitution', () => {
    it('handles empty or null order safely during restitution', async () => {
      const res = await restoreOrderIngredients(null);
      expect(res).toEqual({ restored: [] });

      const res2 = await restoreOrderIngredients({ items: [] });
      expect(res2).toEqual({ restored: [] });
    });

    it('atomically restores dish portions and reactivates availability on order cancellation', async () => {
      const fakeDish = {
        _id: '507f1f77bcf86cd799439033',
        name: 'Crispy Truffle Fries',
        stockCount: 0,
        isAvailable: false,
        recipe: [{ ingredient: 'Potatoes', quantity: 1 }],
      };

      jest.spyOn(MenuItem, 'findById').mockResolvedValue(fakeDish);
      const updateSpy = jest.spyOn(MenuItem, 'findByIdAndUpdate').mockResolvedValue({
        ...fakeDish,
        stockCount: 3,
        isAvailable: true,
      });
      const ingUpdateSpy = jest.spyOn(Ingredient, 'findOneAndUpdate').mockResolvedValue({
        name: 'Potatoes',
        stock: 50,
      });

      const cancelledOrder = {
        items: [{ menuItem: fakeDish._id, quantity: 3 }],
      };

      const res = await restoreOrderIngredients(cancelledOrder);
      expect(updateSpy).toHaveBeenCalledWith(
        fakeDish._id,
        expect.objectContaining({
          $inc: { stockCount: 3 },
          $set: { isAvailable: true },
        }),
        { new: true }
      );
      expect(ingUpdateSpy).toHaveBeenCalledWith(
        { name: expect.any(RegExp) },
        { $inc: { stock: 3 } }
      );
      expect(res.restored[0].newStock).toBe(3);
    });
  });

  describe('Replenishment & Overview', () => {
    it('replenishes dish stock and reactivates availability', async () => {
      const fakeDish = {
        _id: '507f1f77bcf86cd799439044',
        name: 'Gourmet Burger',
        stockCount: 0,
        isAvailable: false,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(MenuItem, 'findById').mockResolvedValue(fakeDish);

      const result = await replenishDishStock(fakeDish._id, 30);
      expect(result.stockCount).toBe(30);
      expect(result.isAvailable).toBe(true);
      expect(fakeDish.save).toHaveBeenCalled();
    });

    it('computes inventory overview with low-stock and sold-out metrics', async () => {
      const overview = await getInventoryOverview('lhr_gulberg');
      expect(overview).toHaveProperty('totalDishes');
      expect(overview).toHaveProperty('activeDishes');
      expect(overview).toHaveProperty('soldOutCount');
      expect(overview).toHaveProperty('lowStockCount');
    });
  });
});
