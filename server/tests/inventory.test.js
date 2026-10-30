const {
  depleteOrderIngredients,
} = require('../services/inventoryService');
const MenuItem = require('../models/MenuItem');

describe('Inventory Depletion Service', () => {
  beforeAll(() => {
    jest.spyOn(MenuItem, 'findById').mockResolvedValue(null);
    jest.spyOn(MenuItem, 'findOne').mockResolvedValue(null);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('handles empty or null order safely without throwing', async () => {
    const res = await depleteOrderIngredients(null);
    expect(res).toEqual({ depleted: [] });

    const res2 = await depleteOrderIngredients({ items: [] });
    expect(res2).toEqual({ depleted: [] });
  });

  it('runs depletion algorithm with dish items', async () => {
    const mockOrder = {
      items: [
        { name: 'Nonexistent Test Dish', quantity: 2 },
      ],
    };
    const res = await depleteOrderIngredients(mockOrder);
    expect(Array.isArray(res.depleted)).toBe(true);
  });
});
