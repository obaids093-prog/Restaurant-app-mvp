import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './tableQRStyles';
import TableQRViewfinder from './TableQRViewfinder';
import TableStandeeCard from './TableStandeeCard';

const DEMO_BRANCHES = [
  { id: 'lhr_gulberg', name: 'Lahore (Gulberg)' },
  { id: 'isb_blue_area', name: 'Islamabad (Blue Area)' },
];

export default function TableQRScannerScreen({ navigation }) {
  const { colors, isDark, shadows, typography, fonts } = useTheme();

  const [selectedBranch, setSelectedBranch] = useState('lhr_gulberg');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);

  // Generate 12 sample tables for the active branch
  const tables = Array.from({ length: 12 }, (_, i) => ({
    tableNumber: String(i + 1),
    name: `Table ${i + 1}`,
    seats: (i + 1) % 3 === 0 ? 6 : (i + 1) % 2 === 0 ? 4 : 2,
    location: i < 4 ? 'Window View' : i > 8 ? 'Executive Terrace' : 'Main Dining Hall',
    branchId: selectedBranch,
  }));

  const handleVerifyTable = async (payload) => {
    if (isVerifying) return;
    setIsVerifying(true);

    try {
      let reqBody = {};
      if (typeof payload === 'string') {
        reqBody = { code: payload };
      } else if (payload?.tableNumber) {
        reqBody = {
          tableNumber: payload.tableNumber,
          branchId: payload.branchId || selectedBranch,
        };
      }

      const res = await apiClient.post('/tables/verify-qr', reqBody);
      const verified = res.data;

      if (verified && verified.valid) {
        Alert.alert(
          'Seated Successfully',
          `You are seated at ${verified.tableName} (${verified.branch.branchName}).\n\nYour orders will now be served directly to this table!`,
          [
            {
              text: 'View Menu & Order',
              onPress: () => {
                navigation.navigate('CustomerApp', {
                  screen: 'Menu',
                  params: { seatedTable: verified },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Table Not Found', verified?.message || 'Could not verify table QR code.');
      }
    } catch (err) {
      // Local fallback for offline/demo reliability
      const tableNum = typeof payload === 'string' ? payload.replace(/\D/g, '') || '4' : payload?.tableNumber || '4';
      const fallbackTable = {
        valid: true,
        tableNumber: tableNum,
        tableName: `Table ${tableNum}`,
        seats: 4,
        location: 'Main Dining Hall',
        branch: {
          branchId: selectedBranch,
          branchName: selectedBranch === 'isb_blue_area' ? 'AURA • Blue Area, Islamabad' : 'AURA • Gulberg III, Lahore',
          branchCity: selectedBranch === 'isb_blue_area' ? 'Islamabad' : 'Lahore',
        },
        scannedAt: new Date().toISOString(),
      };

      Alert.alert(
        'Table Verified',
        `Seated at ${fallbackTable.tableName} (${fallbackTable.branch.branchName}).`,
        [
          {
            text: 'Browse Menu',
            onPress: () => {
              navigation.navigate('CustomerApp', {
                screen: 'Menu',
                params: { seatedTable: fallbackTable },
              });
            },
          },
        ]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerBtn, { backgroundColor: colors.surfaceSubtle }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.textPrimary, fontFamily: fonts?.bold },
            ]}
          >
            Table QR Standee Scanner
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.mutedText, fontFamily: fonts?.regular },
            ]}
          >
            Instant Dine-In Table Link
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsFlashlightOn((prev) => !prev)}
          style={[
            styles.headerBtn,
            {
              backgroundColor: isFlashlightOn ? colors.primary : colors.surfaceSubtle,
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFlashlightOn ? 'flash' : 'flash-outline'}
            size={18}
            color={isFlashlightOn ? colors.onPrimary : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Main Viewfinder Section */}
      <TableQRViewfinder
        isFlashlightOn={isFlashlightOn}
        colors={colors}
        typography={typography}
        fonts={fonts}
      />

      {/* Manual Input Row */}
      <View style={styles.manualInputSection}>
        <View
          style={[
            styles.manualInputRow,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons
            name="keypad-outline"
            size={18}
            color={colors.mutedText}
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="Enter table (e.g. 4 or aura://table?table=4)"
            placeholderTextColor={colors.mutedText}
            style={[styles.manualInput, { color: colors.textPrimary }]}
            returnKeyType="done"
            onSubmitEditing={() => manualCode && handleVerifyTable(manualCode)}
          />
          {isVerifying ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity
              onPress={() => manualCode && handleVerifyTable(manualCode)}
              disabled={!manualCode.trim()}
              style={[
                styles.manualApplyBtn,
                {
                  backgroundColor: manualCode.trim() ? colors.primary : colors.surfaceSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.manualApplyText,
                  { color: manualCode.trim() ? colors.onPrimary : colors.mutedText },
                ]}
              >
                Seat
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom Section: Interactive Standees Grid */}
      <View
        style={[
          styles.demoSection,
          { backgroundColor: colors.surface, borderTopColor: colors.cardBorder },
        ]}
      >
        <View style={styles.demoHeader}>
          <Text
            style={[
              styles.demoTitle,
              { color: colors.textPrimary, fontFamily: fonts?.bold },
            ]}
          >
            Acrylic Table Standees (Tap to Simulate)
          </Text>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        </View>

        {/* Branch Toggle Tabs */}
        <View style={styles.branchToggleRow}>
          {DEMO_BRANCHES.map((b) => {
            const isSelected = selectedBranch === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                onPress={() => setSelectedBranch(b.id)}
                activeOpacity={0.7}
                style={[
                  styles.branchToggleBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.subtleBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.branchToggleText,
                    { color: isSelected ? colors.onPrimary : colors.textSecondary },
                  ]}
                >
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Standees 2-Column Grid */}
        <FlatList
          data={tables}
          keyExtractor={(item) => item.tableNumber}
          numColumns={2}
          contentContainerStyle={styles.standeeListContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TableStandeeCard
              item={item}
              onSelectTable={(table) => handleVerifyTable(table)}
              colors={colors}
              shadows={shadows}
              typography={typography}
              fonts={fonts}
            />
          )}
        />
      </View>
    </View>
  );
}
