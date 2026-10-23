import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VoucherModal({
  visible,
  voucherToEdit,
  onSave,
  onClose,
  colors,
  fonts,
  radius,
  shadows,
}) {
  const isEditing = Boolean(voucherToEdit);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [usageLimit, setUsageLimit] = useState('');
  const [branch, setBranch] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (voucherToEdit) {
      setCode(voucherToEdit.code || '');
      setDescription(voucherToEdit.description || '');
      setDiscountType(voucherToEdit.discountType || 'percentage');
      setDiscountValue(String(voucherToEdit.discountValue ?? ''));
      setMinOrderAmount(voucherToEdit.minOrderAmount ? String(voucherToEdit.minOrderAmount) : '');
      setMaxDiscountAmount(voucherToEdit.maxDiscountAmount ? String(voucherToEdit.maxDiscountAmount) : '');
      setUsageLimit(voucherToEdit.usageLimit ? String(voucherToEdit.usageLimit) : '');
      setBranch(voucherToEdit.applicableBranchId || 'all');
      setValidDays('30');
    } else {
      setCode('');
      setDescription('');
      setDiscountType('percentage');
      setDiscountValue('');
      setMinOrderAmount('');
      setMaxDiscountAmount('');
      setValidDays('30');
      setUsageLimit('');
      setBranch('all');
    }
    setErrorMessage('');
  }, [voucherToEdit, visible]);

  if (!visible) return null;

  const handleSubmit = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Voucher code is required');
      return;
    }
    const val = Number(discountValue);
    if (!val || val <= 0) {
      setErrorMessage('Please enter a valid discount value');
      return;
    }
    if (discountType === 'percentage' && val > 100) {
      setErrorMessage('Percentage discount cannot exceed 100%');
      return;
    }

    const days = Math.max(1, Number(validDays) || 30);
    const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      code: cleanCode,
      description: description.trim(),
      discountType,
      discountValue: val,
      minOrderAmount: minOrderAmount ? Math.max(0, Number(minOrderAmount)) : 0,
      maxDiscountAmount: maxDiscountAmount ? Math.max(0, Number(maxDiscountAmount)) : null,
      validUntil,
      usageLimit: usageLimit ? Math.max(1, Number(usageLimit)) : null,
      applicableBranchId: branch,
    };

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await onSave(payload, voucherToEdit?._id);
      if (res && res.success) {
        onClose();
      } else {
        setErrorMessage(res?.message || 'Failed to save voucher');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error saving voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View
          style={[
            modalStyles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            shadows.cardLight,
          ]}
        >
          {/* Header */}
          <View style={modalStyles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.title, { color: colors.textPrimary }]}>
                {isEditing ? 'Edit Voucher' : 'Create Privilege Voucher'}
              </Text>
              <Text style={[modalStyles.subtitle, { color: colors.mutedText }]}>
                Configure discount rules and usage conditions
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={modalStyles.errorBox}>
              <Text style={modalStyles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView style={modalStyles.formBody} showsVerticalScrollIndicator={false}>
            {/* Voucher Code */}
            <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
              VOUCHER CODE *
            </Text>
            <TextInput
              style={[
                modalStyles.input,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.surfaceBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="e.g. VIPSUMMER25"
              placeholderTextColor={colors.mutedText}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              editable={!isEditing}
            />

            {/* Description */}
            <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
              DESCRIPTION
            </Text>
            <TextInput
              style={[
                modalStyles.input,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.surfaceBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="e.g. 25% off patron tasting menu"
              placeholderTextColor={colors.mutedText}
              value={description}
              onChangeText={setDescription}
            />

            {/* Discount Type Selector */}
            <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
              DISCOUNT TYPE
            </Text>
            <View style={modalStyles.typeRow}>
              {[
                { type: 'percentage', label: 'Percentage (%)', icon: 'pie-chart-outline' },
                { type: 'fixed', label: 'Fixed Amount (Rs.)', icon: 'cash-outline' },
              ].map((item) => {
                const active = discountType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    onPress={() => setDiscountType(item.type)}
                    style={[
                      modalStyles.typeBtn,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceSubtle,
                        borderColor: active ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={active ? '#FFFFFF' : colors.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        modalStyles.typeBtnText,
                        { color: active ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Value & Cap Row */}
            <View style={modalStyles.rowTwo}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
                  DISCOUNT VALUE *
                </Text>
                <TextInput
                  style={[
                    modalStyles.input,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.surfaceBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                  placeholderTextColor={colors.mutedText}
                  keyboardType="numeric"
                  value={discountValue}
                  onChangeText={setDiscountValue}
                />
              </View>

              {discountType === 'percentage' && (
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
                    MAX DISCOUNT (RS.)
                  </Text>
                  <TextInput
                    style={[
                      modalStyles.input,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.surfaceBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="e.g. 1000"
                    placeholderTextColor={colors.mutedText}
                    keyboardType="numeric"
                    value={maxDiscountAmount}
                    onChangeText={setMaxDiscountAmount}
                  />
                </View>
              )}
            </View>

            {/* Min Order & Usage Limit Row */}
            <View style={modalStyles.rowTwo}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
                  MIN ORDER (RS.)
                </Text>
                <TextInput
                  style={[
                    modalStyles.input,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.surfaceBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="0 (no min)"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="numeric"
                  value={minOrderAmount}
                  onChangeText={setMinOrderAmount}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
                  MAX REDEMPTIONS
                </Text>
                <TextInput
                  style={[
                    modalStyles.input,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.surfaceBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="No limit"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="numeric"
                  value={usageLimit}
                  onChangeText={setUsageLimit}
                />
              </View>
            </View>

            {/* Validity Duration */}
            {!isEditing && (
              <View>
                <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
                  VALID DURATION (DAYS FROM TODAY)
                </Text>
                <View style={modalStyles.daysRow}>
                  {['7', '14', '30', '60', '90'].map((d) => {
                    const sel = validDays === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setValidDays(d)}
                        style={[
                          modalStyles.dayPill,
                          {
                            backgroundColor: sel ? colors.primary : colors.surfaceSubtle,
                            borderColor: sel ? colors.primary : colors.surfaceBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            modalStyles.dayPillText,
                            { color: sel ? '#FFFFFF' : colors.textPrimary },
                          ]}
                        >
                          {d}d
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Branch Restriction */}
            <Text style={[modalStyles.fieldLabel, { color: colors.textSecondary }]}>
              OUTLET APPLICABILITY
            </Text>
            <View style={modalStyles.branchRow}>
              {[
                { id: 'all', name: 'All Outlets' },
                { id: 'lhr_gulberg', name: 'Gulberg (LHR)' },
                { id: 'isb_f7', name: 'F-7 (ISB)' },
                { id: 'khi_clifton', name: 'Clifton (KHI)' },
              ].map((b) => {
                const active = branch === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setBranch(b.id)}
                    style={[
                      modalStyles.branchPill,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceSubtle,
                        borderColor: active ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        modalStyles.branchPillText,
                        { color: active ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={modalStyles.btnRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[modalStyles.cancelBtn, { borderColor: colors.surfaceBorder }]}
              disabled={isSubmitting}
            >
              <Text style={[modalStyles.cancelBtnText, { color: colors.mutedText }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[modalStyles.saveBtn, { backgroundColor: colors.primary }]}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.saveBtnText}>
                  {isEditing ? 'Save Changes' : 'Activate Voucher'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  errorBox: {
    backgroundColor: '#EF444415',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  formBody: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowTwo: {
    flexDirection: 'row',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  branchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  branchPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  branchPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
