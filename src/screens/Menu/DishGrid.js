import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './menuStyles';

export default function DishGrid({
  flatListRef,
  displayedItems = [],
  keyExtractor,
  renderItem,
  handleScroll,
  refreshing,
  handleRefresh,
  colors,
  insets,
  ListHeaderComponent,
  ListEmptyComponent,
  totalItemCount = 0,
  cartTotal = 0,
  navigation,
  backToTopAnim,
  scrollToTop,
  exploredItem = null,
  onCloseExploredItem,
  onAddToCart,
  fonts,
  shadows,
}) {
  return (
    <>
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
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
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

      {/* EXPLORE DISH CULINARY MODAL */}
      <Modal
        visible={Boolean(exploredItem)}
        transparent
        animationType="fade"
        onRequestClose={onCloseExploredItem}
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
                onPress={onCloseExploredItem}
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
                onPress={onCloseExploredItem}
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
                    onAddToCart(exploredItem);
                    onCloseExploredItem();
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
    </>
  );
}
