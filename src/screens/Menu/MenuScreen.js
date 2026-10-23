import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useMenu } from '../../context/MenuContext';
import { useOrders } from '../../context/OrdersContext';
import MenuItemCard from '../../components/MenuItemCard';
import NotificationBell from '../../components/NotificationBell';
import { EmptyState, BranchChip } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { useApi } from '../../hooks/useApi';
import brand from '../../config/brand';
import safeStorage from '../../utils/safeStorage';

import {
  styles,
  CATEGORIES,
  CATEGORY_ICONS,
  SORT_OPTIONS,
  PRICE_FILTERS,
  DEALS_FOR_YOU,
  FAVOURITES_KEY,
  filterAndSortDishes,
  resolveReorderItems,
} from './menuStyles';
import HeroCarousel from './HeroCarousel';
import CategoryRow from './CategoryRow';
import OrderAgainRow from './OrderAgainRow';
import DealsSection from './DealsSection';
import TopRatedRow from './TopRatedRow';
import DishGrid from './DishGrid';
import FilterSheet from './FilterSheet';

export default function MenuScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, fonts, typography, radius, shadows } = useTheme();
  const { user } = useAuth();
  const { addItem, totalItemCount, cartState, applyPromo } = useCart();
  const { menuItems: contextMenuItems, syncMenuItems } = useMenu();
  const { orders } = useOrders();

  // Active kitchen order for live tracking banner
  const activeOrder = orders?.find((o) =>
    ['Pending', 'Preparing', 'Ready'].includes(o.status)
  );

  // Completed / Past orders for "Order Again" row
  const pastOrders = useMemo(() => {
    return (orders || []).filter(
      (o) => !['Pending', 'Preparing', 'Ready'].includes(o.status)
    );
  }, [orders]);

  // Derived cart total
  const cartTotal = useMemo(
    () =>
      (cartState?.items || []).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cartState?.items]
  );

  // Base state
  const [menuItems, setMenuItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('default');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [specialsOnly, setSpecialsOnly] = useState(false);
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  // Favourites state saved to device storage
  const [favouriteIds, setFavouriteIds] = useState([]);

  // Search states & refs (using custom useDebounce hook)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 400);

  // Filter Sheet Modal
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const filterSheetAnim = useRef(new Animated.Value(0)).current;

  // Hero carousel active index
  const [heroIndex, setHeroIndex] = useState(0);

  // Explore Dish Modal state
  const [exploredItem, setExploredItem] = useState(null);

  // Back to Top button animation
  const [showBackToTop, setShowBackToTop] = useState(false);
  const backToTopAnim = useRef(new Animated.Value(0)).current;

  // Accessibility motion check
  const [reduceMotion, setReduceMotion] = useState(false);

  const flatListRef = useRef(null);
  const searchInputRef = useRef(null);

  // Check accessibility reduce motion
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (isMounted) setReduceMotion(!!enabled);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) setReduceMotion(!!enabled);
      }
    );
    return () => {
      isMounted = false;
      sub?.remove?.();
    };
  }, []);

  // Load favourites from safeStorage on mount
  useEffect(() => {
    void (async () => {
      try {
        const stored = await safeStorage.getItem(FAVOURITES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavouriteIds(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load favourites from storage', err);
      }
    })();
  }, []);

  // Data fetching hook
  const {
    data: rawMenuData,
    loading: isLoading,
    error,
    refetch: refetchMenu,
  } = useApi('/api/menu');

  // Synchronize server menu data into component state & MenuContext
  useEffect(() => {
    if (rawMenuData && Array.isArray(rawMenuData)) {
      const normalized = rawMenuData.map((item) => ({
        ...item,
        id: item._id || item.id,
        _id: item._id || item.id,
      }));
      setMenuItems((prev) => {
        if (
          prev &&
          prev.length === normalized.length &&
          prev.every((p, idx) => p.id === normalized[idx]?.id && p.price === normalized[idx]?.price)
        ) {
          return prev;
        }
        return normalized;
      });
      if (syncMenuItems) {
        syncMenuItems(normalized);
      }
    }
  }, [rawMenuData, syncMenuItems]);

  // Synchronize live menu modifications made in Manager Dashboard
  useEffect(() => {
    if (contextMenuItems && contextMenuItems.length > 0) {
      setMenuItems((prev) => {
        if (
          prev &&
          prev.length === contextMenuItems.length &&
          prev.every(
            (p, idx) =>
              p.id === contextMenuItems[idx]?.id &&
              p.price === contextMenuItems[idx]?.price &&
              p.isAvailable === contextMenuItems[idx]?.isAvailable
          )
        ) {
          return prev;
        }
        return contextMenuItems;
      });
    }
  }, [contextMenuItems]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const freshData = await refetchMenu();
      if (freshData && Array.isArray(freshData)) {
        const normalized = freshData.map((item) => ({
          ...item,
          id: item._id || item.id,
          _id: item._id || item.id,
        }));
        setMenuItems(normalized);
        if (syncMenuItems) {
          syncMenuItems(normalized);
        }
      }
    } catch {
      // Error handled by useApi
    } finally {
      setRefreshing(false);
    }
  };

  // Refetch menu whenever MenuScreen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      refetchMenu()
        .then((freshData) => {
          if (isMounted && freshData && Array.isArray(freshData)) {
            const normalized = freshData.map((item) => ({
              ...item,
              id: item._id || item.id,
              _id: item._id || item.id,
            }));
            setMenuItems((prev) => {
              if (
                prev &&
                prev.length === normalized.length &&
                prev.every((p, idx) => p.id === normalized[idx]?.id && p.price === normalized[idx]?.price)
              ) {
                return prev;
              }
              return normalized;
            });
            if (syncMenuItems) {
              syncMenuItems(normalized);
            }
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }, [refetchMenu, syncMenuItems])
  );

  /**
   * Single useMemo for filtering and sorting dishes as required by architecture.
   */
  const displayedItems = useMemo(
    () =>
      filterAndSortDishes(menuItems, {
        selectedCategory,
        favouritesOnly,
        favouriteIds,
        specialsOnly,
        availableOnly,
        selectedPriceRange,
        debouncedQuery,
        selectedSort,
      }),
    [
      menuItems,
      selectedCategory,
      favouritesOnly,
      favouriteIds,
      specialsOnly,
      availableOnly,
      selectedPriceRange,
      debouncedQuery,
      selectedSort,
    ]
  );

  // Chef's picks for carousel
  const chefPicks = useMemo(() => {
    const specials = menuItems.filter((m) => m.isSpecial);
    if (specials.length >= 2) return specials.slice(0, 4);
    return menuItems.slice(0, 4);
  }, [menuItems]);

  // Top rated items for horizontal list
  const topRatedItems = useMemo(() => {
    return [...menuItems]
      .filter((m) => (m.rating || 0) >= 4.7)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [menuItems]);

  // Stable Add to Cart handler
  const handleAddToCart = useCallback(
    (item) => {
      if (!item.isAvailable) {
        Alert.alert('Item Sold Out', `${item.name} is currently unavailable.`);
        return;
      }
      addItem(item);
    },
    [addItem]
  );

  // Toggle favourite handler with safeStorage persistence
  const handleToggleFavourite = useCallback(
    async (dishId) => {
      let updated;
      if (favouriteIds.includes(dishId)) {
        updated = favouriteIds.filter((id) => id !== dishId);
      } else {
        updated = [...favouriteIds, dishId];
      }
      setFavouriteIds(updated);
      try {
        await safeStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save favourites to storage', err);
      }
    },
    [favouriteIds]
  );

  // "Order Again" Reorder handler
  const handleReorder = useCallback(
    (order) => {
      if (!order?.items || !Array.isArray(order.items) || order.items.length === 0) {
        Alert.alert('Empty Order', 'This order has no dishes to reorder.');
        return;
      }

      const { toAdd, skipped } = resolveReorderItems(order.items, menuItems);
      toAdd.forEach((item) => addItem(item));

      if (skipped.length > 0 && toAdd.length > 0) {
        Alert.alert(
          'Tray Updated',
          `${toAdd.length} items re-added to your tray with current prices. Skipped unavailable: ${skipped.join(', ')}.`
        );
      } else if (skipped.length > 0 && toAdd.length === 0) {
        Alert.alert(
          'Dishes Unavailable',
          `The items in this order (${skipped.join(', ')}) are currently sold out.`
        );
      } else if (toAdd.length > 0) {
        Alert.alert(
          'Re-added to Tray',
          `${toAdd.length} items re-added at current menu prices.`
        );
      }
    },
    [menuItems, addItem]
  );

  // Apply promo deal
  const handleApplyDeal = useCallback(
    (code) => {
      try {
        applyPromo(code);
        Alert.alert(
          'Promotion Applied',
          `Voucher code "${code}" is now active on your tray!`,
          [
            { text: 'View Tray', onPress: () => navigation.navigate('Cart') },
            { text: 'Continue Ordering', style: 'cancel' },
          ]
        );
      } catch (err) {
        Alert.alert('Promo Notice', err.message);
      }
    },
    [applyPromo, navigation]
  );

  // Filter Sheet controls
  const openFilterSheet = () => {
    setIsFilterSheetVisible(true);
    Animated.timing(filterSheetAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterSheet = () => {
    Animated.timing(filterSheetAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsFilterSheetVisible(false);
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedSort('default');
    setSelectedPriceRange('all');
    setAvailableOnly(false);
    setSpecialsOnly(false);
    setFavouritesOnly(false);
    setSearchQuery('');
    closeFilterSheet();
  };

  // Scroll handler for Back-to-Top Button
  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollOffset > 400;

    if (shouldShow !== showBackToTop) {
      setShowBackToTop(shouldShow);
      if (reduceMotion) {
        backToTopAnim.setValue(shouldShow ? 1 : 0);
      } else {
        Animated.spring(backToTopAnim, {
          toValue: shouldShow ? 1 : 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // User display name
  const customerFirstName = user?.name
    ? user.name.trim().split(' ')[0]
    : 'Esteemed Patron';

  // Memoised 2-column Grid Item
  const renderItem = useCallback(
    ({ item }) => {
      const isFav = favouriteIds.includes(item.id);
      return (
        <MenuItemCard
          item={item}
          isFavourite={isFav}
          onAddToCart={handleAddToCart}
          onToggleFavourite={handleToggleFavourite}
          onExplore={(dish) => setExploredItem(dish)}
          colors={colors}
          shadows={shadows}
          fonts={fonts}
          typography={typography}
          radius={radius}
        />
      );
    },
    [favouriteIds, handleAddToCart, handleToggleFavourite, colors, shadows, fonts, typography, radius]
  );

  const keyExtractor = useCallback((item) => item.id || item._id, []);

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  if (isLoading && menuItems.length === 0) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View
          style={[
            styles.loadingBox,
            { backgroundColor: colors.card, borderColor: colors.subtleBorder },
            shadows.cardLight,
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.stateHeading,
              { color: colors.textPrimary, fontFamily: fonts.bold },
            ]}
          >
            Curating Artisan Menu
          </Text>
          <Text
            style={[
              styles.stateSubheading,
              { color: colors.mutedText, fontFamily: fonts.regular },
            ]}
          >
            Sourcing seasonal selections from {brand.restaurantName}...
          </Text>
        </View>
      </View>
    );
  }

  // ─── ERROR STATE WITH RETRY ───────────────────────────────────────────────
  if (error && menuItems.length === 0) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View
          style={[
            styles.loadingBox,
            { backgroundColor: colors.card, borderColor: colors.subtleBorder },
            shadows.cardLight,
          ]}
        >
          <Ionicons name="cloud-offline-outline" size={54} color={colors.cancelled} />
          <Text
            style={[
              styles.stateHeading,
              { color: colors.textPrimary, fontFamily: fonts.bold },
            ]}
          >
            Connection Interrupted
          </Text>
          <Text
            style={[
              styles.stateSubheading,
              { color: colors.mutedText, fontFamily: fonts.regular },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => refetchMenu()}
            style={[
              styles.retryBtn,
              { backgroundColor: colors.primary },
              shadows.buttonPrimary,
            ]}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
            <Text
              style={[
                styles.retryBtnText,
                { color: colors.onPrimary, fontFamily: fonts.semiBold },
              ]}
            >
              Retry Menu
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── EXTENSIVE HEADER COMPONENT ───────────────────────────────────────────
  const listHeaderComponent = (
    <View style={styles.headerContainer}>
      {/* Top Bar: Time-of-day Greeting & Profile Initials */}
      <View style={[styles.greetingRow, { paddingTop: insets.top + 8 }]}>
        <View style={styles.greetingTextColumn}>
          <Text
            style={[
              styles.greetingSubtitle,
              { color: colors.mutedText, fontFamily: fonts.semiBold },
            ]}
          >
            {brand.tagline.toUpperCase()}
          </Text>
          <Text
            style={[
              styles.greetingTitle,
              { color: colors.textPrimary, fontFamily: fonts.bold },
            ]}
          >
            {getGreeting()}, {customerFirstName}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <BranchChip compact />
          <NotificationBell />
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={[
              styles.profileAvatarBadge,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.subtleBorder,
              },
            ]}
            activeOpacity={0.8}
            accessibilityLabel="Open Profile"
          >
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.avatarInitials,
                  { color: colors.onPrimary, fontFamily: fonts.bold },
                ]}
              >
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'AP'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Active Kitchen Order Banner */}
      {activeOrder && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('OrderTracking', {
              orderId: activeOrder.id || activeOrder._id,
            })
          }
          style={[
            styles.activeOrderBanner,
            {
              backgroundColor: colors.card,
              borderColor: colors.primary,
            },
            shadows.cardLight,
          ]}
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.activeOrderPulseRing,
              { backgroundColor: colors.primaryTint },
            ]}
          >
            <View
              style={[
                styles.activeOrderDot,
                { backgroundColor: colors.primary },
              ]}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.activeOrderHeaderRow}>
              <Text
                style={[
                  styles.activeOrderTitle,
                  { color: colors.textPrimary, fontFamily: fonts.semiBold },
                ]}
              >
                Kitchen Order • {activeOrder.status}
              </Text>
              <Text
                style={[
                  styles.activeOrderActionText,
                  { color: colors.primary, fontFamily: fonts.bold },
                ]}
              >
                Track Live →
              </Text>
            </View>
            <Text
              style={[
                styles.activeOrderSubtitle,
                { color: colors.mutedText, fontFamily: fonts.regular },
              ]}
              numberOfLines={1}
            >
              {activeOrder.items?.length || 1} course selection • #
              {String(activeOrder.id || activeOrder._id).slice(-6)}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Hero Carousel */}
      <HeroCarousel
        chefPicks={chefPicks}
        searchQuery={searchQuery}
        heroIndex={heroIndex}
        setHeroIndex={setHeroIndex}
        onExploreItem={(pick) => setExploredItem(pick)}
        colors={colors}
        fonts={fonts}
        shadows={shadows}
      />

      {/* Overlapping Search Bar */}
      <View
        style={[
          styles.searchBarWrapper,
          !searchQuery && chefPicks.length > 0 && styles.overlappingSearchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.subtleBorder,
          },
          shadows.cardLight,
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={colors.mutedText}
          style={styles.searchLeadingIcon}
        />

        <TextInput
          ref={searchInputRef}
          style={[
            styles.searchInput,
            {
              color: colors.textPrimary,
              fontFamily: fonts.regular,
            },
          ]}
          placeholder="Search exquisite dishes, pairings..."
          placeholderTextColor={colors.mutedText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.searchActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.mutedText} />
          </TouchableOpacity>
        )}

        {/* Filter Sheet Trigger Icon */}
        <TouchableOpacity
          onPress={openFilterSheet}
          style={[
            styles.searchActionBtn,
            styles.searchDividerBtn,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.subtleBorder,
            },
          ]}
          activeOpacity={0.8}
          accessibilityLabel="Open Filter Sheet"
        >
          <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Favourites Only Filter Icon */}
        <TouchableOpacity
          onPress={() => setFavouritesOnly(!favouritesOnly)}
          style={[
            styles.searchActionBtn,
            {
              backgroundColor: favouritesOnly
                ? colors.cancelledTint
                : colors.surfaceSubtle,
              borderColor: favouritesOnly
                ? colors.cancelled
                : colors.subtleBorder,
            },
          ]}
          activeOpacity={0.8}
          accessibilityLabel="Toggle Favourites"
        >
          <Ionicons
            name={favouritesOnly ? 'heart' : 'heart-outline'}
            size={18}
            color={favouritesOnly ? colors.cancelled : colors.mutedText}
          />
        </TouchableOpacity>
      </View>

      {/* Category Row */}
      <CategoryRow
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryIcons={CATEGORY_ICONS}
        colors={colors}
      />

      {/* Order Again Row */}
      <OrderAgainRow
        pastOrders={pastOrders}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onReorder={handleReorder}
        colors={colors}
        fonts={fonts}
        shadows={shadows}
      />

      {/* Deals for You Promo Cards */}
      <DealsSection
        deals={DEALS_FOR_YOU}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        appliedPromo={cartState?.promoCode}
        onApplyDeal={handleApplyDeal}
        colors={colors}
        fonts={fonts}
      />

      {/* Top Rated Row */}
      <TopRatedRow
        topRatedItems={topRatedItems}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onExploreItem={(dish) => setExploredItem(dish)}
        onAddToCart={handleAddToCart}
        colors={colors}
        fonts={fonts}
        shadows={shadows}
      />

      {/* Grid Section Title */}
      <View style={styles.gridSectionHeader}>
        <View>
          <Text
            style={[
              styles.gridSectionTitle,
              { color: colors.textPrimary, fontFamily: fonts.bold },
            ]}
          >
            {favouritesOnly ? 'Your Favourites' : 'Artisan Repertoire'}
          </Text>
          <Text
            style={[
              styles.gridSectionSubtitle,
              { color: colors.mutedText, fontFamily: fonts.regular },
            ]}
          >
            Showing {displayedItems.length} {selectedCategory === 'All' ? 'creations' : selectedCategory.toLowerCase()}
          </Text>
        </View>

        {/* Active Filter Reset Pill */}
        {(selectedSort !== 'default' || selectedPriceRange !== 'all' || availableOnly || specialsOnly) && (
          <TouchableOpacity
            onPress={handleResetFilters}
            style={[
              styles.activeFiltersPill,
              { backgroundColor: colors.primaryTint, borderColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.activeFiltersPillText,
                { color: colors.primary, fontFamily: fonts.medium },
              ]}
            >
              Reset Filters
            </Text>
            <Ionicons name="close-circle" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <DishGrid
        flatListRef={flatListRef}
        displayedItems={displayedItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        handleScroll={handleScroll}
        refreshing={refreshing}
        handleRefresh={handleRefresh}
        colors={colors}
        insets={insets}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={
          <EmptyState
            icon={favouritesOnly ? 'heart-dislike-outline' : 'search-outline'}
            title={favouritesOnly ? 'No Favourites Saved' : 'No Dishes Found'}
            description={
              favouritesOnly
                ? 'Tap the heart icon on any culinary dish to build your personal sanctuary collection.'
                : `No creations match your search "${searchQuery}" or selected filters.`
            }
            actionLabel="Reset Filter & Search"
            onAction={handleResetFilters}
            style={{ marginVertical: 32 }}
          />
        }
        totalItemCount={totalItemCount}
        cartTotal={cartTotal}
        navigation={navigation}
        showBackToTop={showBackToTop}
        backToTopAnim={backToTopAnim}
        scrollToTop={scrollToTop}
        exploredItem={exploredItem}
        onCloseExploredItem={() => setExploredItem(null)}
        onAddToCart={handleAddToCart}
        fonts={fonts}
        shadows={shadows}
      />

      <FilterSheet
        visible={isFilterSheetVisible}
        onClose={closeFilterSheet}
        filterSheetAnim={filterSheetAnim}
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        sortOptions={SORT_OPTIONS}
        selectedSort={selectedSort}
        onSelectSort={setSelectedSort}
        priceFilters={PRICE_FILTERS}
        selectedPriceRange={selectedPriceRange}
        onSelectPriceRange={setSelectedPriceRange}
        availableOnly={availableOnly}
        onToggleAvailable={() => setAvailableOnly(!availableOnly)}
        specialsOnly={specialsOnly}
        onToggleSpecials={() => setSpecialsOnly(!specialsOnly)}
        onResetFilters={handleResetFilters}
        totalCount={displayedItems.length}
        colors={colors}
        fonts={fonts}
        shadows={shadows}
        insets={insets}
      />
    </View>
  );
}
