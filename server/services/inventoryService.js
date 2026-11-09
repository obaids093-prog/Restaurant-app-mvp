/**
 * server/services/inventoryService.js
 * ═══════════════════════════════════════════════════════════
 * Handles ingredient depletion, stock levels, auto sold-out toggle,
 * and stock replenishment.
 * ═══════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');

/**
 * Deducts raw ingredients and dish stock portions when an order is prepared.
 * Uses atomic decrements and enforces non-negative stock lower bounds.
 */
async function depleteOrderIngredients(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return { depleted: [] };
  }

  const results = [];

  for (const item of order.items) {
    const menuItemId = item.menuItem || item.id || item._id;
    const qty = Math.max(1, Number(item.quantity) || 1);

    let dish = null;
    if (menuItemId && mongoose.Types.ObjectId.isValid(menuItemId)) {
      dish = await MenuItem.findById(menuItemId);
    }
    if (!dish && item.name) {
      dish = await MenuItem.findOne({ name: new RegExp(`^${item.name}$`, 'i') });
    }

    if (dish) {
      const currentStock = typeof dish.stockCount === 'number' ? dish.stockCount : 25;
      const decQty = Math.min(currentStock, qty);
      const nextStock = Math.max(0, currentStock - decQty);

      const updatePayload = {
        $inc: { stockCount: -decQty },
      };
      if (nextStock === 0) {
        updatePayload.$set = { isAvailable: false };
      }

      const updated = (await MenuItem.findByIdAndUpdate(dish._id, updatePayload, { new: true })) || dish;

      // Deplete recipe ingredients with lower bound floor (never drop below 0)
      if (Array.isArray(dish.recipe) && dish.recipe.length > 0) {
        for (const ing of dish.recipe) {
          const reqQty = (Number(ing.quantity) || 1) * qty;
          const ingredientDoc = await Ingredient.findOne({ name: new RegExp(`^${ing.ingredient}$`, 'i') });
          if (ingredientDoc) {
            const ingCurrentStock = typeof ingredientDoc.stock === 'number' ? ingredientDoc.stock : 100;
            const ingDec = Math.min(ingCurrentStock, reqQty);
            await Ingredient.findByIdAndUpdate(ingredientDoc._id, {
              $inc: { stock: -ingDec },
            });
          }
        }
      }

      results.push({
        dishId: dish._id,
        name: dish.name,
        remainingStock: updated.stockCount !== undefined ? updated.stockCount : nextStock,
        autoSoldOut: (updated.stockCount !== undefined ? updated.stockCount : nextStock) === 0,
      });
    }
  }

  return { depleted: results };
}

/**
 * Restores raw ingredients and dish stock portions when an order is cancelled
 * @param {object} order - The cancelled order document
 */
async function restoreOrderIngredients(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return { restored: [] };
  }

  const results = [];

  for (const item of order.items) {
    const menuItemId = item.menuItem || item.id || item._id;
    const qty = Math.max(1, Number(item.quantity) || 1);

    let dish = null;
    if (menuItemId && mongoose.Types.ObjectId.isValid(menuItemId)) {
      dish = await MenuItem.findById(menuItemId);
    }
    if (!dish && item.name) {
      dish = await MenuItem.findOne({ name: new RegExp(`^${item.name}$`, 'i') });
    }

    if (dish) {
      // Restore portion count atomically and reactivate dish availability
      const updatedDish = await MenuItem.findByIdAndUpdate(
        dish._id,
        {
          $inc: { stockCount: qty },
          $set: { isAvailable: true },
        },
        { new: true }
      );

      // Restore recipe ingredients
      if (Array.isArray(dish.recipe) && dish.recipe.length > 0) {
        for (const ing of dish.recipe) {
          const restoreQty = (Number(ing.quantity) || 1) * qty;
          await Ingredient.findOneAndUpdate(
            { name: new RegExp(`^${ing.ingredient}$`, 'i') },
            { $inc: { stock: restoreQty } }
          );
        }
      }

      results.push({
        dishId: dish._id,
        name: dish.name,
        restoredQty: qty,
        newStock: updatedDish?.stockCount !== undefined ? updatedDish.stockCount : (dish.stockCount || 0) + qty,
      });
    }
  }

  return { restored: results };
}

/**
 * Replenishes stock for a dish and reactivates availability
 */
async function replenishDishStock(dishId, addedQty = 25) {
  const dish = await MenuItem.findById(dishId);
  if (!dish) throw new Error('Menu item not found for replenishment');

  const currentStock = typeof dish.stockCount === 'number' ? dish.stockCount : 0;
  dish.stockCount = currentStock + Number(addedQty);
  dish.isAvailable = true;

  await dish.save();
  return dish;
}

/**
 * Returns inventory overview, low stock alerts, and auto-sold-out summary
 */
async function getInventoryOverview(branchId = 'lhr_gulberg') {
  let dishes = [];
  let ingredients = [];

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    dishes = await MenuItem.find().lean();
    ingredients = await Ingredient.find().lean();
  }

  const lowStockThreshold = 5;
  const lowStockDishes = dishes.filter((d) => (d.stockCount || 0) > 0 && (d.stockCount || 0) <= lowStockThreshold);
  const soldOutDishes = dishes.filter((d) => d.isAvailable === false || (d.stockCount || 0) === 0);

  return {
    branchId,
    totalDishes: dishes.length,
    activeDishes: dishes.length - soldOutDishes.length,
    soldOutCount: soldOutDishes.length,
    lowStockCount: lowStockDishes.length,
    soldOutDishes: soldOutDishes.map((d) => ({ id: d._id, name: d.name, stockCount: d.stockCount || 0 })),
    lowStockDishes: lowStockDishes.map((d) => ({ id: d._id, name: d.name, stockCount: d.stockCount || 0 })),
    ingredients,
  };
}

module.exports = {
  depleteOrderIngredients,
  restoreOrderIngredients,
  replenishDishStock,
  getInventoryOverview,
};
