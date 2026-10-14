/**
 * src/screens/MenuScreen.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — Artisan Culinary Menu (Home)
 * Premium Stitch-aligned layout: Greeting, Hero Carousel with
 * overlapping search bar, filter and favourites toggles, category
 * circles, "Order Again" row, "Deals for You" promo cards,
 * Top Rated row, 2-column memoised dish grid, and animated Filter Sheet.
 * ═══════════════════════════════════════════════════════════
 */
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { useOrders } from '../context/OrdersContext';
import MenuItemCard from '../components/MenuItemCard';
import { CategoryChip, DealCard, EmptyState } from '../components/ui';
import { useDebounce } from '../hooks/useDebounce';
import { useApi } from '../hooks/useApi';
import brand from '../config/brand';
import safeStorage from '../utils/safeStorage';

const { width } = Dimensions.get('window');
const FAVOURITES_KEY = '@aura_favourite_dish_ids';

const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];
const CATEGORY_ICONS = {
  All: 'restaurant',
  Starters: 'flame',
  Mains: 'restaurant-outline',
  Desserts: 'ice-cream-outline',
  Drinks: 'wine-outline',
};

const SORT_OPTIONS = [
  { id: 'default', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name-asc', label: 'Name: A to Z' },
  { id: 'rating-desc', label: 'Top Rated' },
];

const PRICE_FILTERS = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-1500', label: 'Under Rs. 1,500' },
  { id: '1500-3000', label: 'Rs. 1,500 - 3,000' },
  { id: 'above-3000', label: 'Above Rs. 3,000' },
];

const DEALS_FOR_YOU = [
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

  // Task 3: Render count tracker using useRef
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

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

  // Question 6 Requirement: Use custom useApi hook for data fetching
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
      setMenuItems(normalized);
      if (syncMenuItems) {
        syncMenuItems(normalized);
      }
    }
  }, [rawMenuData, syncMenuItems]);

  // Synchronize live menu modifications made in Manager Dashboard
  useEffect(() => {
    if (contextMenuItems && contextMenuItems.length > 0) {
      setMenuItems(contextMenuItems);
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

  // Refetch menu whenever MenuScreen comes into focus (switching tabs)
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
            setMenuItems(normalized);
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
  const displayedItems = useMemo(() => {
    let result = [...menuItems];

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
        // Keep default curated order
        break;
    }

    return result;
  }, [
    menuItems,
    selectedCategory,
    favouritesOnly,
    favouriteIds,
    specialsOnly,
    availableOnly,
    selectedPriceRange,
    debouncedQuery,
    selectedSort,
  ]);

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

  // Toggle Favourite with safeStorage persistence
  const handleToggleFavourite = useCallback((id) => {
    setFavouriteIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      safeStorage.setItem(FAVOURITES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // "Order Again" Reorder handler: Re-adds items through ADD_ITEM action with current prices
  const handleReorder = useCallback(
    (order) => {
      let addedCount = 0;
      let skippedItems = [];

      (order.items || []).forEach((orderItem) => {
        const dishId = orderItem.menuItem || orderItem.id || orderItem._id;
        const currentDish = menuItems.find(
          (m) =>
            m.id === dishId ||
            m._id === dishId ||
            m.name.toLowerCase() === (orderItem.name || '').toLowerCase()
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
          skippedItems.push(orderItem.name || 'Unavailable dish');
        }
      });

      if (skippedItems.length > 0 && addedCount > 0) {
        Alert.alert(
          'Tray Updated',
          `${addedCount} items re-added to your tray with current prices. Skipped unavailable: ${skippedItems.join(
            ', '
          )}.`
        );
      } else if (skippedItems.length > 0 && addedCount === 0) {
        Alert.alert(
          'Dishes Unavailable',
          `The items in this order (${skippedItems.join(
            ', '
          )}) are currently sold out.`
        );
      } else if (addedCount > 0) {
        Alert.alert(
          'Re-added to Tray',
          `${addedCount} items re-added at current menu prices.`
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

  // Open & Close Filter Bottom Sheet with 300ms animation
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

  // User display name / avatar
  const customerFirstName = user?.name
    ? user.name.trim().split(' ')[0]
    : 'Esteemed Patron';

  // 2-column Memoised Grid Item
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

  // Key extractor
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

  // ─── MAIN 2-COLUMN LIST WITH EXTENSIVE HEADER ─────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <FlatList
        ref={flatListRef}
        data={displayedItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
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

            {/* LIVE ACTIVE ORDER TRACKING BANNER (If Active Order Exists) */}
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

            {/* HERO BANNER CAROUSEL ("Chef's Pick") */}
            {chefPicks.length > 0 && !searchQuery && (
              <View style={styles.heroCarouselSection}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const slideWidth = width - 32;
                    const nextIdx = Math.round(
                      e.nativeEvent.contentOffset.x / slideWidth
                    );
                    setHeroIndex(nextIdx);
                  }}
                  contentContainerStyle={styles.heroScrollContent}
                >
                  {chefPicks.map((pick) => (
                    <TouchableOpacity
                      key={pick.id}
                      activeOpacity={0.94}
                      onPress={() => setExploredItem(pick)}
                      style={[
                        styles.heroCardSlide,
                        {
                          width: width - 32,
                          backgroundColor: colors.card,
                          borderColor: colors.subtleBorder,
                        },
                        shadows.cardLight,
                      ]}
                    >
                      <Image
                        source={{ uri: pick.image }}
                        style={styles.heroImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                        style={styles.heroImageGradient}
                      />

                      {/* Exclusive Reserve Tag */}
                      <View style={styles.heroTagRow}>
                        <View
                          style={[
                            styles.heroTagBadge,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons name="sparkles" size={11} color={colors.onPrimary} />
                          <Text
                            style={[
                              styles.heroTagText,
                              { color: colors.onPrimary, fontFamily: fonts.bold },
                            ]}
                          >
                            {brand.heroBanner.tag.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Hero Slide Details */}
                      <View style={styles.heroOverlayContent}>
                        <View style={styles.heroTextCol}>
                          <Text
                            style={[
                              styles.heroSubtitleText,
                              { color: colors.secondary, fontFamily: fonts.medium },
                            ]}
                            numberOfLines={1}
                          >
                            Chef's Curated Selection
                          </Text>
                          <Text
                            style={[
                              styles.heroTitleText,
                              { color: colors.onPrimary, fontFamily: fonts.bold },
                            ]}
                            numberOfLines={1}
                          >
                            {pick.name}
                          </Text>
                        </View>

                        <View style={styles.heroPriceCol}>
                          <Text
                            style={[
                              styles.heroPriceAmount,
                              { color: colors.onPrimary, fontFamily: fonts.bold },
                            ]}
                          >
                            Rs. {pick.price.toLocaleString()}
                          </Text>
                          <View
                            style={[
                              styles.heroExploreButton,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.heroExploreBtnText,
                                { color: colors.onPrimary, fontFamily: fonts.semiBold },
                              ]}
                            >
                              Explore
                            </Text>
                            <Ionicons name="arrow-forward" size={12} color={colors.onPrimary} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Hero Carousel Dots */}
                <View style={styles.heroDotsRow}>
                  {chefPicks.map((pick, i) => (
                    <View
                      key={`hdot-${pick.id || pick._id || i}`}
                      style={[
                        styles.heroDot,
                        {
                          backgroundColor:
                            heroIndex === i ? colors.primary : colors.subtleBorder,
                          width: heroIndex === i ? 20 : 6,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* OVERLAPPING SEARCH BAR WITH FILTER & FAVOURITES ICONS */}
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

            {/* CATEGORY CIRCLES */}
            <View style={styles.categorySection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <CategoryChip
                      key={cat}
                      label={cat}
                      active={isActive}
                      onPress={() => setSelectedCategory(cat)}
                      icon={
                        <Ionicons
                          name={CATEGORY_ICONS[cat] || 'restaurant'}
                          size={22}
                          color={isActive ? colors.onPrimary : colors.mutedText}
                        />
                      }
                    />
                  );
                })}
              </ScrollView>
            </View>

            {/* "ORDER AGAIN" ROW (From past orders, shown only if user has any) */}
            {pastOrders.length > 0 && selectedCategory === 'All' && !searchQuery && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWithBadge}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textPrimary, fontFamily: fonts.bold },
                      ]}
                    >
                      Order Again
                    </Text>
                    <View
                      style={[
                        styles.sectionCounterBadge,
                        { backgroundColor: colors.primaryTint },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionCounterText,
                          { color: colors.primary, fontFamily: fonts.semiBold },
                        ]}
                      >
                        {pastOrders.length} Past
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {pastOrders.slice(0, 5).map((order) => {
                    const itemCount = order.items?.reduce(
                      (acc, i) => acc + (i.quantity || 1),
                      0
                    ) || 1;
                    const itemNames = (order.items || [])
                      .map((i) => i.name)
                      .filter(Boolean)
                      .join(' • ');

                    return (
                      <View
                        key={order.id || order._id}
                        style={[
                          styles.orderAgainCard,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.subtleBorder,
                          },
                          shadows.cardLight,
                        ]}
                      >
                        <View style={styles.orderAgainHeader}>
                          <Text
                            style={[
                              styles.orderAgainDate,
                              { color: colors.mutedText, fontFamily: fonts.medium },
                            ]}
                          >
                            Order #{String(order.id || order._id).slice(-5)}
                          </Text>
                          <Text
                            style={[
                              styles.orderAgainAmount,
                              { color: colors.primary, fontFamily: fonts.bold },
                            ]}
                          >
                            Rs. {(order.total || 0).toLocaleString()}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.orderAgainItems,
                            { color: colors.textPrimary, fontFamily: fonts.regular },
                          ]}
                          numberOfLines={2}
                        >
                          {itemNames || `${itemCount} items selection`}
                        </Text>

                        <TouchableOpacity
                          onPress={() => handleReorder(order)}
                          style={[
                            styles.reorderBtn,
                            { backgroundColor: colors.primary },
                          ]}
                          activeOpacity={0.85}
                          accessibilityLabel="Re-add order items to tray"
                        >
                          <Ionicons
                            name="repeat"
                            size={14}
                            color={colors.onPrimary}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.reorderBtnText,
                              { color: colors.onPrimary, fontFamily: fonts.semiBold },
                            ]}
                          >
                            Reorder ({itemCount})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* "DEALS FOR YOU" PROMO CARDS */}
            {selectedCategory === 'All' && !searchQuery && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textPrimary, fontFamily: fonts.bold },
                    ]}
                  >
                    Deals for You
                  </Text>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: colors.mutedText, fontFamily: fonts.medium },
                    ]}
                  >
                    Tap to apply voucher
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {DEALS_FOR_YOU.map((deal) => {
                    const isApplied = cartState?.promoCode === deal.code;
                    return (
                      <DealCard
                        key={deal.code}
                        code={deal.code}
                        discountPercent={deal.discountPercent}
                        description={deal.description}
                        isApplied={isApplied}
                        onApply={() => handleApplyDeal(deal.code)}
                        style={styles.dealCardItem}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* "TOP RATED" ROW */}
            {topRatedItems.length > 0 && selectedCategory === 'All' && !searchQuery && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWithBadge}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textPrimary, fontFamily: fonts.bold },
                      ]}
                    >
                      Top Rated
                    </Text>
                    <View
                      style={[
                        styles.sectionCounterBadge,
                        { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Ionicons name="star" size={11} color={colors.secondary} />
                      <Text
                        style={[
                          styles.sectionCounterText,
                          { color: colors.textSecondary, fontFamily: fonts.semiBold },
                        ]}
                      >
                        Curated
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {topRatedItems.map((dish) => (
                    <TouchableOpacity
                      key={`top-${dish.id}`}
                      activeOpacity={0.92}
                      onPress={() => setExploredItem(dish)}
                      style={[
                        styles.topRatedCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.subtleBorder,
                        },
                        shadows.cardLight,
                      ]}
                    >
                      <View style={styles.topRatedImageContainer}>
                        <Image
                          source={{ uri: dish.image }}
                          style={styles.topRatedImage}
                          resizeMode="cover"
                        />
                        <View
                          style={[
                            styles.topRatedScorePill,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.subtleBorder,
                            },
                          ]}
                        >
                          <Ionicons name="star" size={10} color={colors.secondary} />
                          <Text
                            style={[
                              styles.topRatedScoreText,
                              { color: colors.textPrimary, fontFamily: fonts.bold },
                            ]}
                          >
                            {dish.rating}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.topRatedDetails}>
                        <Text
                          style={[
                            styles.topRatedDishName,
                            { color: colors.textPrimary, fontFamily: fonts.semiBold },
                          ]}
                          numberOfLines={1}
                        >
                          {dish.name}
                        </Text>
                        <Text
                          style={[
                            styles.topRatedDishDesc,
                            { color: colors.mutedText, fontFamily: fonts.regular },
                          ]}
                          numberOfLines={1}
                        >
                          {dish.description}
                        </Text>

                        <View style={styles.topRatedFooter}>
                          <Text
                            style={[
                              styles.topRatedPrice,
                              { color: colors.primary, fontFamily: fonts.bold },
                            ]}
                          >
                            Rs. {dish.price.toLocaleString()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleAddToCart(dish)}
                            style={[
                              styles.topRatedAddBtn,
                              { backgroundColor: colors.primary },
                            ]}
                            activeOpacity={0.85}
                            accessibilityLabel={`Add ${dish.name} to tray`}
                          >
                            <Ionicons name="add" size={16} color={colors.onPrimary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ARTISAN REPERTOIRE SECTION TITLE (Grid Header) */}
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

              {/* Active Filter Indicators */}
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
        }
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
      />

      {/* FLOATING GLASS ORDER CART PILL */}
      {totalItemCount > 0 && (
        <View
          style={[styles.floatingCartWrapper, { bottom: 20 + insets.bottom }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={[
              styles.floatingCartPill,
              { backgroundColor: colors.card, borderColor: colors.subtleBorder },
              shadows.cardLight,
            ]}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.9}
            accessibilityLabel={`View Tray with ${totalItemCount} items`}
          >
            <View style={[styles.cartPillBag, { backgroundColor: colors.primary }]}>
              <Ionicons name="bag-handle" size={16} color={colors.onPrimary} />
              <View
                style={[
                  styles.cartCountBadge,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.cartCountBadgeText,
                    { color: colors.onPrimary, fontFamily: fonts.bold },
                  ]}
                >
                  {totalItemCount}
                </Text>
              </View>
            </View>

            <View style={styles.cartPillTextGroup}>
              <Text
                style={[
                  styles.cartPillItemsLabel,
                  { color: colors.textPrimary, fontFamily: fonts.semiBold },
                ]}
              >
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in Tray
              </Text>
              <Text
                style={[
                  styles.cartPillTotalLabel,
                  { color: colors.primary, fontFamily: fonts.bold },
                ]}
              >
                Rs. {cartTotal.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.cartPillActionCircle,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ANIMATED FILTER BOTTOM SHEET MODAL */}
      <Modal
        visible={isFilterSheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeFilterSheet}
      >
        <View style={styles.filterModalOverlay}>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.filterBackdrop}
            activeOpacity={1}
            onPress={closeFilterSheet}
          />

          {/* Sliding Sheet */}
          <Animated.View
            style={[
              styles.filterSheetCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.subtleBorder,
                paddingBottom: insets.bottom + 20,
                transform: [
                  {
                    translateY: filterSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
              shadows.cardLight,
            ]}
          >
            <View style={styles.filterHandleBar}>
              <View
                style={[
                  styles.filterHandle,
                  { backgroundColor: colors.subtleBorder },
                ]}
              />
            </View>

            <View style={styles.filterHeaderRow}>
              <Text
                style={[
                  styles.filterSheetTitle,
                  { color: colors.textPrimary, fontFamily: fonts.bold },
                ]}
              >
                Filter Repertoire
              </Text>
              <TouchableOpacity onPress={closeFilterSheet}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollBody}
            >
              {/* Sort By Section */}
              <Text
                style={[
                  styles.filterSectionHeading,
                  { color: colors.mutedText, fontFamily: fonts.semiBold },
                ]}
              >
                SORT BY
              </Text>
              <View style={styles.filterOptionsGrid}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = selectedSort === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setSelectedSort(opt.id)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceSubtle,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.subtleBorder,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isSelected
                              ? colors.onPrimary
                              : colors.textPrimary,
                            fontFamily: isSelected
                              ? fonts.semiBold
                              : fonts.regular,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price Range Section */}
              <Text
                style={[
                  styles.filterSectionHeading,
                  { color: colors.mutedText, fontFamily: fonts.semiBold, marginTop: 18 },
                ]}
              >
                PRICE RANGE
              </Text>
              <View style={styles.filterOptionsGrid}>
                {PRICE_FILTERS.map((p) => {
                  const isSelected = selectedPriceRange === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedPriceRange(p.id)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceSubtle,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.subtleBorder,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isSelected
                              ? colors.onPrimary
                              : colors.textPrimary,
                            fontFamily: isSelected
                              ? fonts.semiBold
                              : fonts.regular,
                          },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Availability & Specials Toggles */}
              <Text
                style={[
                  styles.filterSectionHeading,
                  { color: colors.mutedText, fontFamily: fonts.semiBold, marginTop: 18 },
                ]}
              >
                PREFERENCES
              </Text>
              <View style={styles.filterToggleRow}>
                <TouchableOpacity
                  onPress={() => setAvailableOnly(!availableOnly)}
                  style={[
                    styles.filterToggleCard,
                    {
                      backgroundColor: availableOnly
                        ? colors.primaryTint
                        : colors.surfaceSubtle,
                      borderColor: availableOnly
                        ? colors.primary
                        : colors.subtleBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={availableOnly ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={availableOnly ? colors.primary : colors.mutedText}
                  />
                  <Text
                    style={[
                      styles.filterToggleText,
                      {
                        color: availableOnly ? colors.primary : colors.textPrimary,
                        fontFamily: fonts.medium,
                      },
                    ]}
                  >
                    Available Dishes Only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSpecialsOnly(!specialsOnly)}
                  style={[
                    styles.filterToggleCard,
                    {
                      backgroundColor: specialsOnly
                        ? colors.primaryTint
                        : colors.surfaceSubtle,
                      borderColor: specialsOnly
                        ? colors.primary
                        : colors.subtleBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={specialsOnly ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={specialsOnly ? colors.primary : colors.mutedText}
                  />
                  <Text
                    style={[
                      styles.filterToggleText,
                      {
                        color: specialsOnly ? colors.primary : colors.textPrimary,
                        fontFamily: fonts.medium,
                      },
                    ]}
                  >
                    Chef Specials Only
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Filter Actions */}
            <View
              style={[
                styles.filterActionFooter,
                { borderTopColor: colors.subtleBorder },
              ]}
            >
              <TouchableOpacity
                onPress={handleResetFilters}
                style={[
                  styles.filterResetBtn,
                  { borderColor: colors.subtleBorder },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterResetBtnText,
                    { color: colors.mutedText, fontFamily: fonts.semiBold },
                  ]}
                >
                  Reset
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeFilterSheet}
                style={[
                  styles.filterApplyBtn,
                  { backgroundColor: colors.primary },
                  shadows.buttonPrimary,
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.filterApplyBtnText,
                    { color: colors.onPrimary, fontFamily: fonts.semiBold },
                  ]}
                >
                  Apply Filters ({displayedItems.length})
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* EXPLORE DISH CULINARY MODAL */}
      <Modal
        visible={Boolean(exploredItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setExploredItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.subtleBorder },
              shadows.cardLight,
            ]}
          >
            {/* Modal Image Header */}
            <View style={styles.modalImageWrapper}>
              <Image
                source={{
                  uri:
                    exploredItem?.image ||
                    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
                }}
                style={styles.modalImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[
                  styles.modalCloseCircle,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setExploredItem(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <View
                style={[
                  styles.modalImageBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="sparkles" size={11} color={colors.onPrimary} />
                <Text
                  style={[
                    styles.modalImageBadgeText,
                    { color: colors.onPrimary, fontFamily: fonts.bold },
                  ]}
                >
                  ARTISAN CUT
                </Text>
              </View>
            </View>

            {/* Modal Scrollable Details */}
            <ScrollView
              style={styles.modalScrollBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={[
                      styles.modalItemCategory,
                      { color: colors.primary, fontFamily: fonts.semiBold },
                    ]}
                  >
                    {exploredItem?.category?.toUpperCase() || 'MAINS'}
                  </Text>
                  <Text
                    style={[
                      styles.modalItemTitle,
                      { color: colors.textPrimary, fontFamily: fonts.bold },
                    ]}
                  >
                    {exploredItem?.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.modalItemPrice,
                    { color: colors.primary, fontFamily: fonts.bold },
                  ]}
                >
                  Rs. {exploredItem?.price?.toLocaleString()}
                </Text>
              </View>

              <Text
                style={[
                  styles.modalItemDescription,
                  { color: colors.textSecondary, fontFamily: fonts.regular },
                ]}
              >
                {exploredItem?.description}
              </Text>

              {/* Culinary Pairing & Prep Badges */}
              <View style={styles.modalMetaRow}>
                <View
                  style={[
                    styles.modalMetaChip,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.subtleBorder,
                    },
                  ]}
                >
                  <Ionicons name="time-outline" size={13} color={colors.primary} />
                  <Text
                    style={[
                      styles.modalMetaChipText,
                      { color: colors.textPrimary, fontFamily: fonts.medium },
                    ]}
                  >
                    {exploredItem?.prepTime || '15-20 min'}
                  </Text>
                </View>

                {exploredItem?.rating && (
                  <View
                    style={[
                      styles.modalMetaChip,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.subtleBorder,
                      },
                    ]}
                  >
                    <Ionicons name="star" size={12} color={colors.secondary} />
                    <Text
                      style={[
                        styles.modalMetaChipText,
                        { color: colors.textPrimary, fontFamily: fonts.medium },
                      ]}
                    >
                      {exploredItem.rating} Rating
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Actions Footer */}
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: colors.subtleBorder },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalSecondaryBtn,
                  { borderColor: colors.subtleBorder },
                ]}
                onPress={() => setExploredItem(null)}
              >
                <Text
                  style={[
                    styles.modalSecondaryBtnText,
                    { color: colors.mutedText, fontFamily: fonts.medium },
                  ]}
                >
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalAddBtn,
                  {
                    backgroundColor: exploredItem?.isAvailable
                      ? colors.primary
                      : colors.disabled,
                  },
                  exploredItem?.isAvailable && shadows.buttonPrimary,
                ]}
                disabled={!exploredItem?.isAvailable}
                onPress={() => {
                  if (exploredItem) {
                    handleAddToCart(exploredItem);
                    setExploredItem(null);
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={exploredItem?.isAvailable ? 'bag-add' : 'ban'}
                  size={16}
                  color={colors.onPrimary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.modalAddBtnText,
                    { color: colors.onPrimary, fontFamily: fonts.semiBold },
                  ]}
                >
                  {exploredItem?.isAvailable
                    ? `Add to Tray • Rs. ${exploredItem?.price?.toLocaleString()}`
                    : 'Sold Out'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FLOATING "BACK TO TOP" BUTTON */}
      <Animated.View
        style={[
          styles.floatingBackToTop,
          { bottom: 85 + insets.bottom },
          {
            transform: [
              { scale: backToTopAnim },
              {
                translateY: backToTopAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0],
                }),
              },
            ],
          },
          shadows.buttonPrimary,
        ]}
      >
        <TouchableOpacity
          onPress={scrollToTop}
          style={[styles.backToTopButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          accessibilityLabel="Back to top"
        >
          <Ionicons name="chevron-up" size={22} color={colors.onPrimary} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 22,
    letterSpacing: -0.4,
  },
  profileAvatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
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

  // Hero Carousel
  heroCarouselSection: {
    marginBottom: 4,
  },
  heroScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroCardSlide: {
    height: 200,
    borderRadius: 20,
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

  // Overlapping Search Bar
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  overlappingSearchBar: {
    marginTop: -20,
    zIndex: 10,
  },
  searchLeadingIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
  },
  searchActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
    maxWidth: 380,
  },
  cartPillBag: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountBadgeText: {
    fontSize: 9,
  },
  cartPillTextGroup: {
    flex: 1,
    marginLeft: 12,
  },
  cartPillItemsLabel: {
    fontSize: 12,
  },
  cartPillTotalLabel: {
    fontSize: 14,
  },
  cartPillActionCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
