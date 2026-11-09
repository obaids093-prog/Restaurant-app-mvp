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
      const updateSpy = jest.spyOn(MenuItem, 'findByIdAndUpdate').mockResolvedValue({
        ...fakeDish,
        stockCount: 0,
        isAvailable: false,
      });
      jest.spyOn(Ingredient, 'findOne').mockResolvedValue({ _id: 'ing_1', stock: 10 });
      jest.spyOn(Ingredient, 'findByIdAndUpdate').mockResolvedValue({ _id: 'ing_1', stock: 8 });

      const mockOrder = {
        items: [{ menuItem: fakeDish._id, quantity: 2 }],
      };

      const result = await depleteOrderIngredients(mockOrder);
      expect(updateSpy).toHaveBeenCalledWith(
        fakeDish._id,
        expect.objectContaining({
          $inc: { stockCount: -2 },
          $set: { isAvailable: false },
        }),
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

      jest.spyOn(MenuItem, 'findById').mockResolvedValue(fakeDish);
      const updateSpy = jest.spyOn(MenuItem, 'findByIdAndUpdate').mockResolvedValue({
        ...fakeDish,
        stockCount: 0,
        isAvailable: false,
      });

      // Requesting 5 when only 1 exists
      const mockOrder = {
        items: [{ menuItem: fakeDish._id, quantity: 5 }],
      };

      const result = await depleteOrderIngredients(mockOrder);
      // decQty should be clamped to min(stockCount, qty) = 1
      expect(updateSpy).toHaveBeenCalledWith(
        fakeDish._id,
        expect.objectContaining({
          $inc: { stockCount: -1 },
          $set: { isAvailable: false },
        }),
        { new: true }
      );
      expect(result.depleted[0].remainingStock).toBe(0);
      expect(result.depleted[0].autoSoldOut).toBe(true);
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
