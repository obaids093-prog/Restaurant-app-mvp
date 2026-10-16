import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { DealCard } from '../../components/ui';
import { styles, DEALS_FOR_YOU } from './menuStyles';

export default function DealsSection({
  deals = DEALS_FOR_YOU,
  selectedCategory = 'All',
  searchQuery = '',
  appliedPromo = null,
  onApplyDeal,
  colors,
  fonts,
}) {
  if (selectedCategory !== 'All' || searchQuery) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderRow}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textPrimary, fontFamily: fonts.bold },
          ]}
        >
          Deals for You
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            { color: colors.mutedText, fontFamily: fonts.medium },
          ]}
        >
          Tap to apply voucher
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {deals.map((deal) => {
          const isApplied = appliedPromo === deal.code;
          return (
            <DealCard
              key={deal.code}
              code={deal.code}
              discountPercent={deal.discountPercent}
              description={deal.description}
              isApplied={isApplied}
              onApply={() => onApplyDeal(deal.code)}
              style={styles.dealCardItem}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
