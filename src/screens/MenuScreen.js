import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Platform,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { useOrders } from '../context/OrdersContext';
import MenuItemCard from '../components/MenuItemCard';
import { useDebounce } from '../hooks/useDebounce';
import { useApi } from '../hooks/useApi';

const { width } = Dimensions.get('window');
const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];
const SORT_OPTIONS = [
  { id: 'default', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name-asc', label: 'Name: A to Z' },
];

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECTURAL COMMENTARY: WHEN useMemo / useCallback SHOULD NOT BE USED
 * ─────────────────────────────────────────────────────────────────────────────
 * useMemo and useCallback introduce overhead: JavaScript must allocate dependency
 * arrays, retain previous values in memory, and execute shallow comparison checks
 * on every render.
 *
 * DO NOT use them for:
 * 1. Cheap primitives or trivial computations (e.g., simple string concatenation,
 *    basic arithmetic, filtering arrays with fewer than ~50 items). The overhead
 *    of cache lookup exceeds the cost of recalculation.
 * 2. Unstable dependencies: If dependencies change on every render, the memoization
 *    cache will miss every time, rendering the caching effort purely wasteful.
 * 3. Components not wrapped in React.memo: Passing a useCallback handler to a
 *    standard component provides zero performance gain because standard components
 *    re-render whenever their parent renders regardless of prop equality.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MenuHeaderRight = ({ renderCount, role, colors }) => (
  <View style={styles.headerRightContainer}>
    {/* Debug Render Count Label */}
    <View style={[styles.renderBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
      <Text style={[styles.renderBadgeText, { color: colors.textMuted }]}>
        r:{renderCount}
      </Text>
    </View>

    {/* Role Pill */}
    <View style={[styles.customerRolePill, { backgroundColor: colors.badge }]}>
      <Ionicons name="sparkles" size={12} color={colors.primary} />
      <Text style={[styles.customerRoleText, { color: colors.badgeText }]}>
        {role === 'manager' ? 'MANAGER' : 'GUEST'}
      </Text>
    </View>
  </View>
);

export default function MenuScreen({ navigation }) {
  const { colors, isDark, shadows } = useTheme();
  const { user } = useAuth();
  const { addItem, totalItemCount, cartState } = useCart();
  const { menuItems: contextMenuItems } = useMenu();
  const { orders } = useOrders();

  const activeOrder = orders?.find((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status));
  const insets = useSafeAreaInsets();

  const cartTotal = useMemo(
    () => (cartState?.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0),
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
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Question 8: Single state array of favourite item IDs
  const [favouriteIds, setFavouriteIds] = useState(['art_s1', 'art_m1', 'art_d1']);

  // Search states & refs (Question 9: using custom useDebounce hook)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 400);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['Lobster Bisque', 'Angus Tenderloin', 'Matcha', 'Fondant']);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const searchInputRef = useRef(null);
  const flatListRef = useRef(null);
  const categoryFlatListRef = useRef(null);
  const backToTopAnim = useRef(new Animated.Value(0)).current;

  // Explore Dish Modal state
  const [exploredItem, setExploredItem] = useState(null);

  const scrollCategories = (direction) => {
    if (categoryFlatListRef.current) {
      categoryFlatListRef.current.scrollToOffset({
        offset: direction === 'right' ? 240 : 0,
        animated: true,
      });
    }
  };

  // Question 6 Requirement: Use custom useApi hook for data fetching
  const {
    data: rawMenuData,
    loading: isLoading,
    error,
    refetch: refetchMenu,
  } = useApi('/api/menu');

  // Synchronize server menu data into component state
  useEffect(() => {
    if (rawMenuData && Array.isArray(rawMenuData)) {
      const normalized = rawMenuData.map((item) => ({
        ...item,
        id: item._id || item.id,
        _id: item._id || item.id,
      }));
      setMenuItems(normalized);
    }
  }, [rawMenuData]);

  // Synchronize live menu modifications made in Manager Dashboard
  useEffect(() => {
    if (!isLoading && contextMenuItems && contextMenuItems.length > 0) {
      setMenuItems(contextMenuItems);
    }
  }, [contextMenuItems, isLoading]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchMenu();
    } catch {
      // Error handled by useApi
    } finally {
      setRefreshing(false);
    }
  };

  // Update recent searches whenever debouncedQuery changes and has length > 1
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length > 1) {
      setRecentSearches((prev) => {
        const exists = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        return [trimmed, ...exists].slice(0, 5);
      });
    }
  }, [debouncedQuery]);

  // Direct search input handler - useDebounce automatically delays filtering
  const handleSearchTextChange = (text) => {
    setSearchQuery(text);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleSelectRecentSearch = (term) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
  };

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * WHY DERIVED DATA SHOULD NOT BE STORED IN STATE (Task 6 requirement):
   *
   * Storing filtered/sorted items in separate state creates redundant state
   * synchronization bugs: any change to source data (menuItems) requires manual
   * state updates in multiple places. If a developer forgets to sync, data drifts.
   * Furthermore, calling setState inside an effect causes an extra cascading render
   * cycle (render with old filtered data -> effect runs -> setState -> second render).
   *
   * Computing derived data synchronously with useMemo guarantees immediate
   * mathematical consistency in a single render pass without state drift.
   * ───────────────────────────────────────────────────────────────────────────
   */
  const displayedItems = useMemo(() => {
    let result = [...menuItems];

    // 1. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // 2. Search Query Filter
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // 3. Sorting Options
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
      default:
        // Keep default curated order
        break;
    }

    return result;
  }, [menuItems, selectedCategory, debouncedQuery, selectedSort]);

  // Stable handlers passed to MenuItemCard via useCallback
  const handleAddToCart = useCallback(
    (item) => {
      if (!item.isAvailable) {
        Alert.alert('Item Sold Out', `${item.name} is currently out of stock.`);
        return;
      }
      addItem(item);
      Alert.alert('Added to Cart', `${item.name} (Rs. ${item.price.toLocaleString()}) added to your tray.`);
    },
    [addItem]
  );

  const handleToggleFavourite = useCallback((id) => {
    setFavouriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const renderHeaderRight = useCallback(
    () => (
      <MenuHeaderRight
        renderCount={renderCountRef.current}
        role={user?.role}
        colors={colors}
      />
    ),
    [colors, user?.role]
  );

  // Update Navigation Header Title with dynamic count
  useEffect(() => {
    navigation.setOptions({
      title: `AURA Kitchen (${displayedItems.length})`,
      headerRight: renderHeaderRight,
    });
  }, [displayedItems.length, navigation, renderHeaderRight]);

  // Scroll Handler for Back-to-Top Button
  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollOffset > 300;

    if (shouldShow !== showBackToTop) {
      setShowBackToTop(shouldShow);
      Animated.spring(backToTopAnim, {
        toValue: shouldShow ? 1 : 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const CATEGORY_ICONS = {
    All: 'restaurant',
    Starters: 'flame',
    Mains: 'restaurant-outline',
    Desserts: 'ice-cream-outline',
    Drinks: 'wine-outline',
  };

  // Category Chip Component
  const renderCategoryChip = (cat) => {
    const isSelected = selectedCategory === cat;
    const count =
      cat === 'All'
        ? menuItems.length
        : menuItems.filter((m) => m.category === cat).length;

    return (
      <TouchableOpacity
        key={cat}
        onPress={() => setSelectedCategory(cat)}
        style={[
          styles.categoryChip,
          {
            backgroundColor: isSelected ? '#f59e0b' : colors.surface,
            borderColor: isSelected ? '#ffc174' : colors.surfaceBorder,
          },
          isSelected && shadows.button3D,
        ]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={CATEGORY_ICONS[cat] || 'restaurant'}
          size={14}
          color={isSelected ? '#472a00' : colors.textMuted}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.categoryChipText,
            { color: isSelected ? '#472a00' : colors.textSecondary, fontWeight: isSelected ? '700' : '600' },
          ]}
        >
          {cat}
        </Text>
        <View
          style={[
            styles.chipBadge,
            {
              backgroundColor: isSelected
                ? 'rgba(71, 42, 0, 0.18)'
                : colors.surfaceSubtle,
            },
          ]}
        >
          <Text
            style={[
              styles.chipBadgeText,
              { color: isSelected ? '#472a00' : colors.textMuted },
            ]}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // FlatList Render Item
  const renderItem = ({ item }) => {
    const isFavourite = favouriteIds.includes(item.id);
    return (
      <MenuItemCard
        item={item}
        isFavourite={isFavourite}
        onAddToCart={handleAddToCart}
        onToggleFavourite={handleToggleFavourite}
        colors={colors}
        shadows={shadows}
      />
    );
  };

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.loadingBox, { backgroundColor: colors.card }, shadows.deep3D]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateHeading, { color: colors.textPrimary }]}>
            Preparing The Menu
          </Text>
          <Text style={[styles.stateSubheading, { color: colors.textSecondary }]}>
            Fetching artisan specials and kitchen inventory...
          </Text>
        </View>
      </View>
    );
  }

  // ─── ERROR STATE WITH RETRY ───────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.loadingBox, { backgroundColor: colors.card }, shadows.deep3D]}>
          <Ionicons name="cloud-offline-outline" size={54} color={colors.error} />
          <Text style={[styles.stateHeading, { color: colors.textPrimary }]}>
            Connection Interrupted
          </Text>
          <Text style={[styles.stateSubheading, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => refetchMenu()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }, shadows.button3D]}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryBtnText}>Retry Fetch</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── MAIN CONTENT ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <FlatList
        ref={flatListRef}
        data={displayedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderWrapper}>
            {/* Header Greeting & Loyalty Status from Stitch Design */}
            <View style={styles.bannerRow}>
              <View style={styles.cellarHeaderRow}>
                <View style={styles.cellarTag}>
                  <Ionicons name="moon-outline" size={12} color="#ffc174" />
                  <Text style={styles.cellarTagText}>PRIVATE CELLAR EDITION</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.loyaltyPill}>
                    <Ionicons name="sparkles" size={12} color="#f59e0b" />
                    <Text style={styles.loyaltyPillText}>AURA Gold</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    style={styles.headerProfileBadge}
                    activeOpacity={0.8}
                    accessibilityLabel="Open Profile"
                  >
                    {user?.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.headerAvatarImg} />
                    ) : (
                      <View style={[styles.headerAvatarImg, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="person" size={13} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.welcomeGreeting, { color: colors.textPrimary }]}>
                {user?.name ? `Good Evening, ${user.name.split(' ')[0]}` : 'Good Evening, Esteemed Patron'}
              </Text>
              <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
                Wood-Fired Gastronomy • Rare Botanicals • Lahore Sanctuary
              </Text>
            </View>

            {/* LIVE ACTIVE ORDER TRACKING BANNER */}
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
                  shadows.medium3D,
                ]}
                activeOpacity={0.88}
              >
                <View style={styles.activeOrderPulseCircle}>
                  <View style={styles.activeOrderGreenDot} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.activeOrderTitle, { color: colors.textPrimary }]}>
                      Order in Kitchen • {activeOrder.status}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                      Track Live →
                    </Text>
                  </View>
                  <Text style={[styles.activeOrderSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {activeOrder.items?.length || 1} delicacy selection • #{String(activeOrder.id || activeOrder._id).slice(-6)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* SEARCH BAR with Micro-actions */}
            <View
              style={[
                styles.searchBarWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSearchFocused ? colors.primary : colors.surfaceBorder,
                },
                shadows.subtle3D,
              ]}
            >
              <TouchableOpacity
                onPress={() => searchInputRef.current?.focus()}
                activeOpacity={0.7}
                style={styles.searchIconBtn}
              >
                <Ionicons
                  name="search"
                  size={18}
                  color={isSearchFocused ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>

              <TextInput
                ref={searchInputRef}
                style={[
                  styles.searchInput,
                  {
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Search infusions, wood-fired cuts, pairings..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleSearchTextChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                returnKeyType="search"
              />

              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={styles.clearBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchMicroActions}>
                  <TouchableOpacity
                    style={styles.searchMicroBtn}
                    onPress={() => Alert.alert('AURA Voice Search', 'Listening for culinary pairing requests...')}
                  >
                    <Ionicons name="mic-outline" size={17} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.searchMicroBtn,
                      styles.searchTuneBtn,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                    ]}
                    onPress={() => setShowSortDropdown(!showSortDropdown)}
                  >
                    <Ionicons name="options-outline" size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* FEATURED SPOTLIGHT HERO CARD */}
            {!searchQuery && selectedCategory === 'All' && (
              <View style={styles.heroCardContainer}>
                <View style={[styles.heroCard, shadows.deep3D]}>
                  <View style={styles.heroImageWrapper}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
                      }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                    <View style={styles.heroImageGradient} />
                    <View style={styles.heroBadgeTopLeft}>
                      <Ionicons name="sparkles" size={12} color="#ffc174" />
                      <Text style={styles.heroBadgeTopLeftText}>SIGNATURE CHEF TASTING</Text>
                    </View>
                    <View style={styles.heroBadgeTopRight}>
                      <Ionicons name="leaf" size={11} color="#4edea3" />
                      <Text style={styles.heroBadgeTopRightText}>A5 Miyazaki</Text>
                    </View>
                  </View>

                  <View style={styles.heroContent}>
                    <View style={styles.heroTitleRow}>
                      <Text style={styles.heroTitle}>Prime Black Angus Tenderloin</Text>
                      <Text style={styles.heroPrice}>Rs. 3,650</Text>
                    </View>
                    <Text style={styles.heroDescription} numberOfLines={2}>
                      Charcoal-grilled center-cut beef tenderloin, roasted bone marrow jus, wild maitake mushrooms, and truffled potato mousseline.
                    </Text>
                    <View style={styles.heroFooter}>
                      <View style={styles.heroMetaRow}>
                        <View style={styles.heroMetaChip}>
                          <Text style={styles.heroMetaChipText}>Wine Pairing No. 4</Text>
                        </View>
                        <Text style={styles.heroPrepText}>• 24 min prep</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.heroExploreBtn}
                        onPress={() => {
                          const featured =
                            menuItems.find((m) => m.name?.includes('Angus')) ||
                            menuItems.find((m) => m.isSpecial && m.category === 'Mains') ||
                            menuItems[0] || {
                              name: 'Prime Black Angus Tenderloin',
                              price: 3650,
                              category: 'Mains',
                              isAvailable: true,
                              description: 'Charcoal-grilled center-cut beef tenderloin, roasted bone marrow jus, wild maitake mushrooms, and truffled potato mousseline.',
                              image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop',
                              prepTime: '24 min',
                              pairing: 'Wine Pairing No. 4 (Cellar Reserve)',
                              chefStory: 'Handcrafted by Executive Chef Farhan using prime dry-aged tenderloin slow-glazed over artisanal Bincho-tan charcoal.',
                            };
                          setExploredItem(featured);
                        }}
                        activeOpacity={0.88}
                      >
                        <LinearGradient
                          colors={['#f59e0b', '#ffc174']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.heroExploreGradient}
                        >
                          <Text style={styles.heroExploreText}>Explore Dish</Text>
                          <Ionicons name="arrow-forward" size={13} color="#472a00" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* RECENT SEARCH SUGGESTIONS */}
            {isSearchFocused && !searchQuery && recentSearches.length > 0 && (
              <View style={styles.recentSearchesBox}>
                <Text style={[styles.recentTitle, { color: colors.textMuted }]}>
                  RECENT CULINARY SEARCHES
                </Text>
                <View style={styles.recentChipsRow}>
                  {recentSearches.map((term) => (
                    <TouchableOpacity
                      key={term}
                      onPress={() => handleSelectRecentSearch(term)}
                      style={[
                        styles.recentChip,
                        { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                      ]}
                    >
                      <Ionicons name="time-outline" size={12} color={colors.primary} />
                      <Text style={[styles.recentChipText, { color: colors.textPrimary }]}>
                        {term}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* HORIZONTAL CATEGORY CHIPS WITH NAVIGATION ARROWS */}
            <View style={styles.categoryScrollContainer}>
              <TouchableOpacity
                onPress={() => scrollCategories('left')}
                style={[
                  styles.categoryArrowBtn,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  shadows.subtle3D,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={14} color={colors.primary} />
              </TouchableOpacity>

              <FlatList
                ref={categoryFlatListRef}
                horizontal
                data={CATEGORIES}
                keyExtractor={(cat) => cat}
                renderItem={({ item }) => renderCategoryChip(item)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsList}
              />

              <TouchableOpacity
                onPress={() => scrollCategories('right')}
                style={[
                  styles.categoryArrowBtn,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  shadows.subtle3D,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* SORTING CONTROLS BAR (Task 6) */}
            <View style={styles.sortBar}>
              <Text style={[styles.sortLabel, { color: colors.textMuted }]}>
                Showing {displayedItems.length} artisan culinary creations
              </Text>

              <TouchableOpacity
                onPress={() => setShowSortDropdown(!showSortDropdown)}
                style={[
                  styles.sortButton,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-vertical" size={14} color={colors.primary} />
                <Text style={[styles.sortButtonText, { color: colors.textPrimary }]}>
                  {SORT_OPTIONS.find((s) => s.id === selectedSort)?.label}
                </Text>
                <Ionicons
                  name={showSortDropdown ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* SORT SELECTION DROPDOWN */}
            {showSortDropdown && (
              <View
                style={[
                  styles.sortDropdown,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  shadows.medium3D,
                ]}
              >
                {SORT_OPTIONS.map((opt) => {
                  const isOptSelected = selectedSort === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => {
                        setSelectedSort(opt.id);
                        setShowSortDropdown(false);
                      }}
                      style={[
                        styles.sortDropdownItem,
                        isOptSelected && { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sortItemText,
                          {
                            color: isOptSelected ? colors.primary : colors.textPrimary,
                            fontWeight: isOptSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isOptSelected && (
                        <Ionicons name="checkmark" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }, shadows.soft]}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Matches Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No items match "{debouncedQuery || searchQuery}" in {selectedCategory}.
            </Text>
            <TouchableOpacity
              onPress={() => {
                handleClearSearch();
                setSelectedCategory('All');
                setSelectedSort('default');
              }}
              style={[styles.resetSearchBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}
            >
              <Text style={[styles.resetSearchText, { color: colors.primary }]}>
                Reset Filter & Search
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FLOATING GLASS ORDER CART PILL */}
      {totalItemCount > 0 && (
        <View style={[styles.floatingCartWrapper, { bottom: 24 + insets.bottom }]} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.floatingCartPill, shadows.goldGlow || shadows.button3D]}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartPillBag}>
              <Ionicons name="bag-handle" size={17} color="#472a00" />
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountBadgeText}>{totalItemCount}</Text>
              </View>
            </View>
            <View style={styles.cartPillTextGroup}>
              <Text style={styles.cartPillItemsLabel}>
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} selected
              </Text>
              <Text style={styles.cartPillTotalLabel}>
                Rs. {cartTotal.toLocaleString()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#a08e7a" />
          </TouchableOpacity>
        </View>
      )}

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
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              shadows.deep3D,
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
                style={styles.modalCloseCircle}
                onPress={() => setExploredItem(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.modalImageBadge}>
                <Ionicons name="sparkles" size={12} color="#ffc174" />
                <Text style={styles.modalImageBadgeText}>CHEF SPECIALTY</Text>
              </View>
            </View>

            {/* Modal Scrollable Details */}
            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.modalItemCategory, { color: colors.primary }]}>
                    {exploredItem?.category?.toUpperCase() || 'MAINS'} • ARTISAN CUT
                  </Text>
                  <Text style={[styles.modalItemTitle, { color: colors.textPrimary }]}>
                    {exploredItem?.name}
                  </Text>
                </View>
                <Text style={[styles.modalItemPrice, { color: colors.primary }]}>
                  Rs. {exploredItem?.price?.toLocaleString()}
                </Text>
              </View>

              <Text style={[styles.modalItemDescription, { color: colors.textSecondary }]}>
                {exploredItem?.description}
              </Text>

              {/* Culinary Pairing & Prep Badges */}
              <View style={styles.modalMetaRow}>
                <View style={[styles.modalMetaChip, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="wine-outline" size={14} color={colors.primary} />
                  <Text style={[styles.modalMetaChipText, { color: colors.textPrimary }]}>
                    Cellar Wine Pairing
                  </Text>
                </View>
                <View style={[styles.modalMetaChip, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="flame-outline" size={14} color="#f59e0b" />
                  <Text style={[styles.modalMetaChipText, { color: colors.textPrimary }]}>
                    Wood-Fired Oak
                  </Text>
                </View>
                <View style={[styles.modalMetaChip, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="time-outline" size={14} color="#10B981" />
                  <Text style={[styles.modalMetaChipText, { color: colors.textPrimary }]}>
                    8-10 Min Prep
                  </Text>
                </View>
              </View>

              {/* Chef Notes / Story */}
              <View style={[styles.chefStoryBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                <View style={styles.chefStoryHeader}>
                  <Ionicons name="restaurant" size={14} color={colors.primary} />
                  <Text style={[styles.chefStoryTitle, { color: colors.primary }]}>
                    EXECUTIVE CHEF NOTES
                  </Text>
                </View>
                <Text style={[styles.chefStoryText, { color: colors.textSecondary }]}>
                  {exploredItem?.chefStory ||
                    'Crafted fresh with seasonal farm botanicals, slow-braised to preserve delicate aromatics and rich umami.'}
                </Text>
              </View>
            </ScrollView>

            {/* Modal Actions Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.surfaceBorder }]}>
              <TouchableOpacity
                style={[styles.modalSecondaryBtn, { borderColor: colors.surfaceBorder }]}
                onPress={() => setExploredItem(null)}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: colors.textSecondary }]}>
                  Close
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalAddBtn, { backgroundColor: colors.primary }, shadows.button3D]}
                onPress={() => {
                  if (exploredItem) {
                    handleAddToCart(exploredItem);
                    setExploredItem(null);
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="bag-add" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalAddBtnText}>
                  Add to Tray • Rs. {exploredItem?.price?.toLocaleString()}
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
          { bottom: 90 + insets.bottom },
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
          shadows.button3D,
        ]}
      >
        <TouchableOpacity
          onPress={scrollToTop}
          style={[styles.backToTopButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-up" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.15)',
  },
  stateHeading: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: -0.3,
  },
  stateSubheading: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    gap: 8,
  },
  renderBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  renderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  customerRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  customerRoleText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.6,
  },
  listContent: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  listHeaderWrapper: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  bannerRow: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  halalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  halalBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  welcomeGreeting: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  welcomeSubtext: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchIconBtn: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  clearBtn: {
    padding: 4,
  },
  recentSearchesBox: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  recentTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  recentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  recentChipText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  chipsContainer: {
    marginBottom: 12,
  },
  chipsList: {
    paddingVertical: 4,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortDropdown: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    marginBottom: 12,
  },
  sortDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortItemText: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 20,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetSearchBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetSearchText: {
    fontSize: 13,
    fontWeight: '700',
  },
  floatingBackToTop: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  backToTopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stitch AI Header elements
  cellarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cellarTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cellarTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffc174',
    letterSpacing: 1.5,
  },
  loyaltyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: '#262a33',
    gap: 4,
  },
  loyaltyPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffc174',
  },
  headerProfileBadge: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  searchMicroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchMicroBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTuneBtn: {
    backgroundColor: '#262a33',
  },

  // Featured Hero Card
  heroCardContainer: {
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 20,
    backgroundColor: '#1c2028',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.1)',
  },
  heroImageWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0a0e16',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 19, 28, 0.25)',
  },
  heroBadgeTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 14, 22, 0.8)',
  },
  heroBadgeTopLeftText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffc174',
    letterSpacing: 1,
  },
  heroBadgeTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 14, 22, 0.8)',
  },
  heroBadgeTopRightText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4edea3',
  },
  heroContent: {
    padding: 14,
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#dfe2ee',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  heroPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffc174',
  },
  heroDescription: {
    fontSize: 12,
    color: '#d8c3ad',
    lineHeight: 16,
    marginBottom: 10,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaChip: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: '#262a33',
  },
  heroMetaChipText: {
    fontSize: 10,
    color: '#d8c3ad',
    fontWeight: '600',
  },
  heroPrepText: {
    fontSize: 10,
    color: '#a08e7a',
  },
  heroExploreBtn: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  heroExploreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 5,
  },
  heroExploreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#472a00',
  },

  // Floating Order Cart Pill
  floatingCartWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  // Floating Back To Top button
  floatingBackToTop: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 10,
  },
  backToTopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#262a33',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.25)',
    gap: 10,
  },
  cartPillBag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartCountBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff938c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#68000a',
  },
  cartPillTextGroup: {
    alignItems: 'flex-start',
  },
  cartPillItemsLabel: {
    fontSize: 10,
    color: '#d8c3ad',
  },
  cartPillTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffc174',
  },

  // Category horizontal scroll controls
  categoryScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  categoryArrowBtn: {
    width: 28,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 10,
  },

  // Explore Dish Culinary Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  modalImageWrapper: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseCircle: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalImageBadge: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.3)',
  },
  modalImageBadgeText: {
    color: '#ffc174',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modalScrollBody: {
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalItemCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalItemTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalItemPrice: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalItemDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modalMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  modalMetaChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chefStoryBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  chefStoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  chefStoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  chefStoryText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  modalSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activeOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  activeOrderPulseCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOrderGreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  activeOrderTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  activeOrderSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
