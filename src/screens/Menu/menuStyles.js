import { StyleSheet, Dimensions } from 'react-native';

export const { width } = Dimensions.get('window');
export const FAVOURITES_KEY = '@aura_favourite_dish_ids';

export const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];
export const CATEGORY_ICONS = {
  All: 'restaurant',
  Starters: 'flame',
  Mains: 'restaurant-outline',
  Desserts: 'ice-cream-outline',
  Drinks: 'wine-outline',
};

export const SORT_OPTIONS = [
  { id: 'default', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name-asc', label: 'Name: A to Z' },
  { id: 'rating-desc', label: 'Top Rated' },
];

export const PRICE_FILTERS = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-1500', label: 'Under Rs. 1,500' },
  { id: '1500-3000', label: 'Rs. 1,500 - 3,000' },
  { id: 'above-3000', label: 'Above Rs. 3,000' },
];

export const DEALS_FOR_YOU = [
  {
    code: 'CHEF15',
    discountPercent: 15,
    description: "Chef's Tasting Reserve Special on culinary orders",
  },
  {
    code: 'FEAST20',
    discountPercent: 20,
    description: 'Artisan Feast Celebration for gourmet dining',
  },
  {
    code: 'GOURMET30',
    discountPercent: 30,
    description: 'VIP Chef\'s Privilege on curated trays',
  },
  {
    code: 'WELCOME10',
    discountPercent: 10,
    description: 'Welcome Sanctuary Gift for your first order',
  },
];

/**
 * Pure helper to filter and sort menu dishes outside component
 * to reduce Cognitive Complexity.
 */
export function filterAndSortDishes(items, filters) {
  const {
    selectedCategory,
    favouritesOnly,
    favouriteIds,
    specialsOnly,
    availableOnly,
    selectedPriceRange,
    debouncedQuery,
    selectedSort,
  } = filters;

  let result = [...items];

  // 1. Category Filter
  if (selectedCategory !== 'All') {
    result = result.filter((item) => item.category === selectedCategory);
  }

  // 2. Favourites only filter
  if (favouritesOnly) {
    result = result.filter((item) => favouriteIds.includes(item.id));
  }

  // 3. Specials only filter
  if (specialsOnly) {
    result = result.filter((item) => item.isSpecial);
  }

  // 4. Available only filter
  if (availableOnly) {
    result = result.filter((item) => item.isAvailable);
  }

  // 5. Price Range filter
  if (selectedPriceRange === 'under-1500') {
    result = result.filter((item) => item.price < 1500);
  } else if (selectedPriceRange === '1500-3000') {
    result = result.filter((item) => item.price >= 1500 && item.price <= 3000);
  } else if (selectedPriceRange === 'above-3000') {
    result = result.filter((item) => item.price > 3000);
  }

  // 6. Search Query Filter
  if (debouncedQuery) {
    const q = debouncedQuery.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }

  // 7. Sorting Options
  switch (selectedSort) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'rating-desc':
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default:
      break;
  }

  return result;
}

/**
 * Pure helper to resolve reorder items and availability against menu catalog.
 */
export function resolveReorderItems(orderItems, menuItems) {
  const toAdd = [];
  const skipped = [];

  (orderItems || []).forEach((orderItem) => {
    if (!orderItem) return;
    const dishId = orderItem.menuItem || orderItem.id || orderItem._id;
    const currentDish = (menuItems || []).find(
      (m) =>
        m &&
        (String(m.id || m._id) === String(dishId) ||
          (m.name && orderItem.name && m.name.toLowerCase().trim() === orderItem.name.toLowerCase().trim()))
    );

    if (currentDish && currentDish.isAvailable !== false) {
      const qty = Math.max(1, Number.parseInt(orderItem.quantity, 10) || 1);
      for (let i = 0; i < qty; i++) {
        toAdd.push({
          ...currentDish,
          id: currentDish.id || currentDish._id,
          price: Number(currentDish.price),
        });
      }
    } else {
      skipped.push(orderItem.name || 'Unavailable dish');
    }
  });

  return { toAdd, skipped };
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  stateHeading: {
    fontSize: 18,
    marginTop: 16,
    letterSpacing: -0.2,
  },
  stateSubheading: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 12,
    marginTop: 18,
  },
  retryBtnText: {
    fontSize: 14,
  },

  // Greeting Row
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  greetingTextColumn: {
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: 12,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 22,
    letterSpacing: -0.4,
  },
  headerActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Active Order Banner
  activeOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  activeOrderPulseRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOrderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeOrderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeOrderTitle: {
    fontSize: 13,
  },
  activeOrderActionText: {
    fontSize: 11,
  },
  activeOrderSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  // Hero Carousel / Banner Section
  heroCarouselSection: {
    marginBottom: 16,
  },
  heroScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroCardSlide: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTagRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
  },
  heroTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  heroTagText: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  heroOverlayContent: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroTextCol: {
    flex: 1,
    marginRight: 10,
  },
  heroSubtitleText: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  heroTitleText: {
    fontSize: 18,
    marginTop: 2,
  },
  heroPriceCol: {
    alignItems: 'flex-end',
  },
  heroPriceAmount: {
    fontSize: 16,
    marginBottom: 4,
  },
  heroExploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  heroExploreBtnText: {
    fontSize: 11,
  },
  heroDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  heroDot: {
    height: 6,
    borderRadius: 3,
  },

  // Search Bar
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  overlappingSearchBar: {
    zIndex: 10,
  },
  searchLeadingIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  searchActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  searchDividerBtn: {
    borderLeftWidth: 1,
  },

  // Category Circles
  categorySection: {
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 8,
  },

  // Sections (Order Again, Deals, Top Rated)
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
  },
  sectionCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  sectionCounterText: {
    fontSize: 11,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Order Again Card
  orderAgainCard: {
    width: 220,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  orderAgainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderAgainDate: {
    fontSize: 11,
  },
  orderAgainAmount: {
    fontSize: 13,
  },
  orderAgainItems: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    minHeight: 34,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 10,
    width: '100%',
  },
  reorderBtnText: {
    fontSize: 12,
  },

  // Deal Card in Horizontal Scroll
  dealCardItem: {
    width: 250,
  },

  // Top Rated Card
  topRatedCard: {
    width: 210,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  topRatedImageContainer: {
    height: 110,
    width: '100%',
    position: 'relative',
  },
  topRatedImage: {
    width: '100%',
    height: '100%',
  },
  topRatedScorePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
  },
  topRatedScoreText: {
    fontSize: 10,
  },
  topRatedDetails: {
    padding: 10,
  },
  topRatedDishName: {
    fontSize: 13,
    marginBottom: 2,
  },
  topRatedDishDesc: {
    fontSize: 11,
    marginBottom: 8,
  },
  topRatedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRatedPrice: {
    fontSize: 13,
  },
  topRatedAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2-Column Grid Header
  gridSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  gridSectionTitle: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  gridSectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  activeFiltersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  activeFiltersPillText: {
    fontSize: 11,
  },

  // Floating Cart Pill
  floatingCartWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 20,
  },
  floatingCartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 26,
    borderWidth: 1,
    width: '100%',
    maxWidth: 420,
  },
  cartPillLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cartWhiteBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  cartWhiteBadgeText: {
    fontSize: 12,
  },
  cartTotalAmountText: {
    fontSize: 15,
  },
  cartPillRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewTrayLabel: {
    fontSize: 13,
  },

  // Filter Sheet Modal
  filterModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  filterSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  filterHandleBar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  filterHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  filterSheetTitle: {
    fontSize: 18,
  },
  filterScrollBody: {
    paddingBottom: 16,
  },
  filterSectionHeading: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  filterToggleRow: {
    gap: 8,
  },
  filterToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  filterToggleText: {
    fontSize: 13,
  },
  filterActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  filterResetBtn: {
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtnText: {
    fontSize: 14,
  },
  filterApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyBtnText: {
    fontSize: 14,
  },

  // Explore Dish Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalImageWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalImageBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  modalImageBadgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  modalScrollBody: {
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalItemCategory: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  modalItemTitle: {
    fontSize: 18,
    marginTop: 2,
  },
  modalItemPrice: {
    fontSize: 18,
  },
  modalItemDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modalMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  modalMetaChipText: {
    fontSize: 11,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  modalSecondaryBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 13,
  },
  modalAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
  },
  modalAddBtnText: {
    fontSize: 13,
  },

  // Floating Back to Top Button
  floatingBackToTop: {
    position: 'absolute',
    right: 20,
    zIndex: 15,
  },
  backToTopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
