import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { styles, SANCTUARY_ZONES } from './reservationStyles';

export default function ZonePicker({
  selectedZone,
  setSelectedZone,
}) {
  const { colors, typography, radius, shadows } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[typography.caption, styles.sectionHeaderLabel, { color: colors.mutedText }]}>
          TABLE AREA & AMBIENCE
        </Text>
        <Text style={[typography.caption, { color: colors.mutedText }]}>
          3 Curated Areas
        </Text>
      </View>

      <View style={styles.zonesStack}>
        {SANCTUARY_ZONES.map((zone) => {
          const isSelected = selectedZone === zone.id;
          return (
            <TouchableOpacity
              key={zone.id}
              onPress={() => setSelectedZone(zone.id)}
              activeOpacity={0.88}
              style={[
                styles.zoneCard,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                  borderRadius: radius.card,
                },
                isSelected && shadows.soft,
              ]}
            >
              <Image source={{ uri: zone.image }} style={[styles.zoneImage, { borderRadius: radius.button }]} />
              <View style={styles.zoneContent}>
                <View style={styles.zoneTagRow}>
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', fontSize: 11 }]}>
                    {zone.tag}
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}>
                    • {zone.capacity}
                  </Text>
                </View>
                <Text
                  style={[
                    typography.headingSm,
                    { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
                  ]}
                  numberOfLines={1}
                >
                  {zone.name}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]}
                  numberOfLines={1}
                >
                  {zone.desc}
                </Text>
              </View>

              <View
                style={[
                  styles.zoneRadioCircle,
                  {
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
