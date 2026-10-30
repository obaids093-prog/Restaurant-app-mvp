import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './tableQRStyles';

export default function TableStandeeCard({
  item,
  onSelectTable,
  colors,
  shadows,
  typography,
  fonts,
}) {
  const isSelected = false;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onSelectTable(item)}
      style={[
        styles.standeeCard,
        {
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.primary : colors.cardBorder,
        },
        shadows?.cardLight || shadows?.soft,
      ]}
    >
      {/* Table Number Pill */}
      <View
        style={[
          styles.standeeNumberBadge,
          { backgroundColor: colors.primary },
        ]}
      >
        <Text style={[styles.standeeNumberText, { color: colors.onPrimary }]}>
          {item.tableNumber}
        </Text>
      </View>

      {/* Zone Tag */}
      <Text
        style={[
          styles.standeeZoneBadge,
          typography.caption,
          { color: colors.mutedText, fontFamily: fonts?.medium },
        ]}
      >
        {item.seats} Seats
      </Text>

      {/* Simulated QR Pattern Canvas */}
      <View
        style={[
          styles.standeeQrCanvas,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.subtleBorder,
            borderWidth: 1,
          },
        ]}
      >
        <View
          style={[
            styles.qrMatrixMock,
            { borderColor: colors.primary + '66' },
          ]}
        >
          <Ionicons name="qr-code" size={36} color={colors.primary} />
        </View>
      </View>

      {/* Title & Zone */}
      <Text
        style={[
          styles.standeeTitle,
          typography.body,
          { color: colors.textPrimary, fontFamily: fonts?.bold },
        ]}
      >
        {item.name || `Table ${item.tableNumber}`}
      </Text>
      <Text
        style={[
          styles.standeeSubtitle,
          typography.caption,
          { color: colors.mutedText, fontFamily: fonts?.regular },
        ]}
        numberOfLines={1}
      >
        {item.location || 'Main Dining Hall'}
      </Text>

      {/* Action Button */}
      <View
        style={[
          styles.standeeTapBtn,
          { backgroundColor: colors.primary },
        ]}
      >
        <Ionicons
          name="restaurant-outline"
          size={12}
          color={colors.onPrimary}
          style={{ marginRight: 4 }}
        />
        <Text
          style={[
            styles.standeeTapText,
            { color: colors.onPrimary, fontFamily: fonts?.bold },
          ]}
        >
          Seat at Table
        </Text>
      </View>
    </TouchableOpacity>
  );
}
