import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './tableQRStyles';

export default function TableQRViewfinder({
  isFlashlightOn,
  colors,
  typography,
  fonts,
}) {
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 200,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    sweep.start();

    return () => sweep.stop();
  }, [laserAnim]);

  return (
    <View style={styles.scannerArea}>
      <View
        style={[
          styles.viewfinderOuter,
          {
            backgroundColor: isFlashlightOn ? colors.surface + '88' : colors.surfaceSubtle,
            borderColor: colors.cardBorder,
            borderWidth: 1,
          },
        ]}
      >
        {/* 4 Corner Crosshairs */}
        <View style={[styles.viewfinderCornerTL, { borderColor: colors.primary }]} />
        <View style={[styles.viewfinderCornerTR, { borderColor: colors.primary }]} />
        <View style={[styles.viewfinderCornerBL, { borderColor: colors.primary }]} />
        <View style={[styles.viewfinderCornerBR, { borderColor: colors.primary }]} />

        {/* Center Cloche QR Target */}
        <Ionicons
          name="qr-code-outline"
          size={72}
          color={colors.primary}
          style={styles.viewfinderCenterIcon}
        />

        {/* Animated Laser Sweep Beam */}
        <Animated.View
          style={[
            styles.laserLine,
            {
              backgroundColor: colors.primary,
              transform: [{ translateY: laserAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.laserGlow,
            {
              backgroundColor: colors.primary,
              transform: [{ translateY: laserAnim }],
            },
          ]}
        />
      </View>

      {/* Instruction Pill */}
      <View
        style={[
          styles.instructionPill,
          { backgroundColor: colors.surface, borderColor: colors.subtleBorder, borderWidth: 1 },
        ]}
      >
        <Ionicons name="scan-outline" size={15} color={colors.primary} />
        <Text
          style={[
            styles.instructionText,
            { color: colors.textPrimary, fontFamily: fonts?.bold || typography.caption?.fontFamily },
          ]}
        >
          Align Table QR standee within frame
        </Text>
      </View>
    </View>
  );
}
