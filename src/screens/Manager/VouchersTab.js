import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVouchers } from '../../hooks/useVouchers';
import VoucherModal from './VoucherModal';

export default function VouchersTab({ colors, fonts, radius, shadows, insets }) {
  const {
    vouchers,
    isLoading,
    isRefreshing,
    error,
    statusFilter,
    setStatusFilter,
    refreshVouchers,
    createVoucher,
    updateVoucher,
    toggleVoucher,
    deleteVoucher,
  } = useVouchers();

  const [modalVisible, setModalVisible] = useState(false);
  const [voucherToEdit, setVoucherToEdit] = useState(null);

  const handleOpenCreate = () => {
    setVoucherToEdit(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (v) => {
    setVoucherToEdit(v);
    setModalVisible(true);
  };

  const handleSaveVoucher = async (payload, id) => {
    if (id) {
      return updateVoucher(id, payload);
    }
    return createVoucher(payload);
  };

  const handleConfirmDelete = (v) => {
    Alert.alert(
      'Delete Voucher',
      `Are you sure you want to permanently delete "${v.code}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteVoucher(v._id);
            if (!res.success) {
              Alert.alert('Error', res.message || 'Could not delete voucher');
            }
          },
        },
      ]
    );
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date() > new Date(validUntil);
  };

  const formatExpiry = (validUntil) => {
    if (!validUntil) return 'No expiration';
    try {
      return new Date(validUntil).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const renderVoucherCard = ({ item: v }) => {
    const expired = isExpired(v.validUntil);
    const active = v.isActive && !expired;

    let badgeColor = '#10B981';
    let badgeText = 'ACTIVE';
    if (expired) {
      badgeColor = '#EF4444';
      badgeText = 'EXPIRED';
    } else if (!v.isActive) {
      badgeColor = '#6B7280';
      badgeText = 'INACTIVE';
    }

    return (
      <View
        style={[
          styles.voucherCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
      >
        {/* Card Header: Code & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.codeRow}>
            <View style={[styles.codeIconWrap, { backgroundColor: colors.primaryTint }]}>
              <Ionicons name="pricetag" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.voucherCodeText, { color: colors.textPrimary }]}>
              {v.code}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${badgeColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
            <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{badgeText}</Text>
          </View>
        </View>

        {/* Description if present */}
        {v.description ? (
          <Text style={[styles.descriptionText, { color: colors.mutedText }]}>
            {v.description}
          </Text>
        ) : null}

        {/* Privilege Value Line */}
        <View style={styles.benefitRow}>
          <Text style={[styles.benefitText, { color: colors.primary }]}>
            {v.discountType === 'percentage'
              ? `${v.discountValue}% OFF`
              : `Rs. ${v.discountValue?.toLocaleString()} FIXED OFF`}
          </Text>
          {v.maxDiscountAmount ? (
            <Text style={[styles.maxCapText, { color: colors.mutedText }]}>
              (Max Rs. {v.maxDiscountAmount?.toLocaleString()})
            </Text>
          ) : null}
        </View>

        {/* Condition Metadata Chips */}
        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="basket-outline" size={11} color={colors.textSecondary} />
            <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
              {v.minOrderAmount > 0
                ? `Min Rs. ${v.minOrderAmount?.toLocaleString()}`
                : 'No minimum'}
            </Text>
          </View>

          <View style={[styles.metaChip, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="repeat-outline" size={11} color={colors.textSecondary} />
            <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
              {v.usageLimit ? `${v.usageCount || 0}/${v.usageLimit} used` : `${v.usageCount || 0} used`}
            </Text>
          </View>

          <View style={[styles.metaChip, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
            <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
              {formatExpiry(v.validUntil)}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
          <TouchableOpacity
            onPress={() => toggleVoucher(v._id)}
            style={[
              styles.actionBtn,
              { backgroundColor: v.isActive ? '#EF444415' : '#10B98115' },
            ]}
          >
            <Ionicons
              name={v.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
              size={13}
              color={v.isActive ? '#EF4444' : '#10B981'}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: v.isActive ? '#EF4444' : '#10B981' },
              ]}
            >
              {v.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOpenEdit(v)}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Ionicons name="create-outline" size={13} color={colors.textPrimary} />
            <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleConfirmDelete(v)}
            style={[styles.actionBtn, { backgroundColor: '#EF444415' }]}
          >
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar: Title & Add Button */}
      <View style={styles.headerBar}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Privilege Vouchers
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
            Dynamic promotional discounts & codes
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenCreate}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Code</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All Vouchers' },
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' },
        ].map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceSubtle,
                  borderColor: active ? colors.primary : colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: active ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main List Area */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading vouchers...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
            Failed to Load Vouchers
          </Text>
          <Text style={[styles.errorSub, { color: colors.mutedText }]}>{error}</Text>
          <TouchableOpacity
            onPress={refreshVouchers}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vouchers}
          keyExtractor={(item) => item._id}
          renderItem={renderVoucherCard}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshVouchers}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="pricetags-outline" size={40} color={colors.mutedText} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Vouchers Found
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedText }]}>
                {statusFilter === 'all'
                  ? 'Create your first promotional discount voucher above.'
                  : `No ${statusFilter} vouchers currently.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Create / Edit Modal */}
      <VoucherModal
        visible={modalVisible}
        voucherToEdit={voucherToEdit}
        onSave={handleSaveVoucher}
        onClose={() => setModalVisible(false)}
        colors={colors}
        fonts={fonts}
        radius={radius}
        shadows={shadows}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  voucherCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherCodeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 12,
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '700',
  },
  maxCapText: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
