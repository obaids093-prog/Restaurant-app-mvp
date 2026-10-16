import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui';
import { styles } from './managerStyles';

export default function AddDishModal({
  visible,
  onClose,
  newDishName,
  setNewDishName,
  newDishPrice,
  setNewDishPrice,
  newDishDesc,
  setNewDishDesc,
  newDishImage,
  setNewDishImage,
  newDishCat,
  setNewDishCat,
  isUploadingNewImage,
  handlePickAndUploadNewImage,
  handleAddDish,
  colors,
  typography,
  radius,
  shadows,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.card * 1.5 },
            shadows.deep3D,
          ]}
        >
          <View style={styles.modalHeaderRow}>
            <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '800' }]}>
              Add Gourmet Creation
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <Input
            label="Dish Name"
            placeholder="e.g. Lobster Thermidor"
            value={newDishName}
            onChangeText={setNewDishName}
          />

          <Input
            label="Price (PKR)"
            placeholder="e.g. 2850"
            value={newDishPrice}
            onChangeText={setNewDishPrice}
            keyboardType="numeric"
          />

          <Input
            label="Description"
            placeholder="e.g. Fresh rock lobster with creamy Dijon reduction"
            value={newDishDesc}
            onChangeText={setNewDishDesc}
            multiline
            numberOfLines={2}
          />

          {/* Photo Selection: Device Upload, Live Preview, and Presets */}
          <View style={{ marginBottom: 14 }}>
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600', marginBottom: 6, fontSize: 11 }]}>
              DISH PHOTO (DEVICE / URL / PRESET)
            </Text>

            {/* Device Photo Picker Button */}
            <TouchableOpacity
              onPress={handlePickAndUploadNewImage}
              disabled={isUploadingNewImage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: radius.button,
                backgroundColor: colors.primary + '15',
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.primary,
                gap: 8,
                marginBottom: 8,
              }}
              activeOpacity={0.7}
            >
              {isUploadingNewImage ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                    Optimizing & Uploading Photo...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                    Choose from Device / PC (Auto-Cropped 4:3)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Live Preview Card */}
            {newDishImage ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 8,
                  borderRadius: radius.card,
                  backgroundColor: colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  marginBottom: 8,
                  gap: 10,
                }}
              >
                <Image
                  source={{ uri: newDishImage }}
                  style={{ width: 56, height: 42, borderRadius: radius.card / 2, backgroundColor: colors.surface }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700', fontSize: 11 }]} numberOfLines={1}>
                    Photo Selected (4:3 Standard)
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedText, fontSize: 10 }]} numberOfLines={1}>
                    {newDishImage}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setNewDishImage('')} style={{ padding: 6 }}>
                  <Ionicons name="trash-outline" size={16} color={colors.cancelled} />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Manual URL Input */}
            <Input
              label="Or Photo URL (Optional)"
              placeholder="Paste web image link or pick a preset below"
              value={newDishImage}
              onChangeText={setNewDishImage}
            />

            {/* Quick Photo Presets */}
            <View style={{ marginTop: 6 }}>
              <Text style={[typography.caption, { color: colors.mutedText, fontWeight: '600', marginBottom: 6, fontSize: 10 }]}>
                QUICK PRESETS
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { label: '🥩 Steak', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop' },
                  { label: '🍝 Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=600&auto=format&fit=crop' },
                  { label: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop' },
                  { label: '🍰 Dessert', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop' },
                  { label: '🍹 Mocktail', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop' },
                  { label: '🥗 Salad', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop' },
                ].map((p) => {
                  const isPicked = newDishImage === p.url;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      onPress={() => setNewDishImage(p.url)}
                      style={{
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: radius.pill,
                        backgroundColor: isPicked ? colors.primary : colors.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: isPicked ? colors.primary : colors.cardBorder,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isPicked ? colors.onPrimary : colors.textPrimary,
                            fontWeight: isPicked ? '700' : '500',
                            fontSize: 11,
                          },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600', marginBottom: 6 }]}>
              CATEGORY
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {['Starters', 'Mains', 'Desserts', 'Beverages'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setNewDishCat(cat)}
                  style={[
                    styles.catSelectChip,
                    {
                      backgroundColor: newDishCat === cat ? colors.primary : colors.surfaceSubtle,
                      borderColor: newDishCat === cat ? colors.primary : colors.cardBorder,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: newDishCat === cat ? colors.onPrimary : colors.textPrimary,
                        fontWeight: newDishCat === cat ? '700' : '500',
                        fontSize: 12,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.modalCancelBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.button },
              ]}
            >
              <Text style={[typography.button, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddDish}
              style={[styles.modalSaveBtn, { backgroundColor: colors.primary, borderRadius: radius.button }]}
            >
              <Text style={[typography.button, { color: colors.onPrimary }]}>Add to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
