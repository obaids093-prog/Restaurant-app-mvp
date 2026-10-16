import { Alert, Platform } from 'react-native';

export function showTrackingAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export function getOrderListTitle(activeTab) {
  if (activeTab === 'active') return 'Past Dining Folios';
  if (activeTab === 'completed') return 'Completed Dining Folios';
  return 'All Dining Folios';
}

/**
 * Reorder action — verifies dishes against current menu catalog and availability
 */
export function reorderDishes({ order, menuItems, addItem, navigation }) {
  if (!order?.items || order.items.length === 0) return;

  let addedCount = 0;
  const skippedItems = [];

  (order.items || []).forEach((orderItem) => {
    const dishId = orderItem.menuItem || orderItem.id || orderItem._id;
    const currentDish = (menuItems || []).find(
      (m) =>
        String(m.id || m._id) === String(dishId) ||
        (m.name && orderItem.name && m.name.toLowerCase().trim() === orderItem.name.toLowerCase().trim())
    );

    if (currentDish && currentDish.isAvailable !== false) {
      const qty = orderItem.quantity || 1;
      for (let i = 0; i < qty; i++) {
        addItem({
          ...currentDish,
          id: currentDish.id || currentDish._id,
          price: Number(currentDish.price),
        });
      }
      addedCount += qty;
    } else {
      skippedItems.push(orderItem.name || 'Sold out dish');
    }
  });

  const viewTrayAction = [
    { text: 'Keep Browsing', style: 'cancel' },
    { text: 'View Tray', onPress: () => navigation.navigate('CustomerApp', { screen: 'Cart' }) },
  ];

  if (skippedItems.length > 0 && addedCount > 0) {
    Alert.alert(
      'Tray Updated',
      `${addedCount} item(s) re-added at current menu prices. Note: ${skippedItems.join(
        ', '
      )} is currently unavailable and was omitted.`,
      viewTrayAction
    );
  } else if (skippedItems.length > 0 && addedCount === 0) {
    Alert.alert(
      'Dishes Unavailable',
      `None of the creations in this order (${skippedItems.join(
        ', '
      )}) are currently available in the menu catalog.`
    );
  } else if (addedCount > 0) {
    Alert.alert(
      'Dishes Re-added to Tray',
      `${addedCount} creation(s) have been placed in your tray at current menu prices.`,
      viewTrayAction
    );
  }
}
