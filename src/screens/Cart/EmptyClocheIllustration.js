import React from 'react';
import { View } from 'react-native';
import { styles } from './cartStyles';

export default function EmptyClocheIllustration({ colors, isDark }) {
  return (
    <View style={styles.clocheCanvas}>
      {/* Ambient Glow */}
      <View
        style={[
          styles.clocheAmbientGlow,
          { backgroundColor: colors.primaryTint, opacity: isDark ? 0.25 : 0.6 },
        ]}
      />

      {/* Steam Sparks */}
      <View style={styles.sparksContainer}>
        <View style={[styles.sparkDot, { top: 0, left: '38%', backgroundColor: colors.primary }]} />
        <View style={[styles.sparkDot, { top: 8, left: '50%', backgroundColor: colors.secondary }]} />
        <View style={[styles.sparkDot, { top: 4, left: '62%', backgroundColor: colors.primary }]} />
      </View>

      {/* Cloche Dome & Handle */}
      <View style={styles.clocheStructure}>
        {/* Handle */}
        <View
          style={[
            styles.clocheHandle,
            { backgroundColor: isDark ? '#3A3A3A' : '#D1D5DB', borderColor: colors.primary },
          ]}
        />
        {/* Dome */}
        <View
          style={[
            styles.clocheDome,
            {
              backgroundColor: isDark ? '#262626' : '#F3F4F6',
              borderColor: isDark ? '#3A3A3A' : '#E5E7EB',
            },
          ]}
        >
          <View
            style={[
              styles.clocheHighlight,
              { backgroundColor: isDark ? '#404040' : '#FFFFFF' },
            ]}
          />
        </View>
        {/* Base Rim */}
        <View
          style={[
            styles.clocheRim,
            { backgroundColor: colors.primary },
          ]}
        />
        {/* Platter Plate */}
        <View
          style={[
            styles.clochePlatter,
            { backgroundColor: isDark ? '#333333' : '#E5E7EB' },
          ]}
        />
      </View>
    </View>
  );
}
