import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function FilterTabs({
  tabs = [],
  activeTab,
  onSelectTab,
  scrollable = false,
  style,
}) {
  const { colors, typography, radius } = useTheme();

  const renderTabs = () =>
    tabs.map((tab) => {
      const key = typeof tab === 'string' ? tab : tab.id;
      const label = typeof tab === 'string' ? tab : tab.label;
      const count = typeof tab === 'object' ? tab.count : undefined;
      const isActive = activeTab === key;

      return (
        <TouchableOpacity
          key={key}
          onPress={() => onSelectTab && onSelectTab(key)}
          activeOpacity={0.8}
          style={[
            styles.tabItem,
            {
              backgroundColor: isActive ? colors.primary : colors.surfaceSubtle,
              borderColor: isActive ? colors.primary : colors.subtleBorder,
              borderRadius: radius.pill,
            },
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
        >
          <Text
            style={[
              typography.caption,
              styles.tabText,
              {
                color: isActive ? colors.onPrimary : colors.textPrimary,
                fontWeight: isActive ? '700' : '500',
              },
            ]}
          >
            {label}
          </Text>
          {count !== undefined ? (
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: isActive
                    ? 'rgba(255, 255, 255, 0.25)'
                    : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  { color: isActive ? colors.onPrimary : colors.textSecondary },
                ]}
              >
                {count}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, style]}
      >
        {renderTabs()}
      </ScrollView>
    );
  }

  return <View style={[styles.flexContainer, style]}>{renderTabs()}</View>;
}

const styles = StyleSheet.create({
  flexContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 24,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
