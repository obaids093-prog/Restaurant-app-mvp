import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './riderTrackingStyles';

export default function DeliveryMilestones({
  tracking,
  colors,
  shadows,
  typography,
  fonts,
}) {
  const route = tracking?.route;
  const etaMinutes = route?.etaMinutes !== undefined ? route.etaMinutes : 16;
  const distanceRemaining = route?.distanceRemainingKm !== undefined ? route.distanceRemainingKm : 2.4;
  const progressPercent = Math.min(1, Math.max(0, route?.progressPercent || 0.45));
  const activeStep = route?.stepIndex || (progressPercent < 0.25 ? 1 : progressPercent < 0.4 ? 2 : progressPercent < 0.85 ? 3 : 4);
  const destinationAddress = tracking?.destination?.address || 'Sector C, Phase 5, DHA, Lahore';

  const steps = [
    {
      step: 1,
      title: 'Order Confirmed',
      desc: 'Order received and kitchen preparation started',
      icon: 'receipt-outline',
    },
    {
      step: 2,
      title: 'Cooked & Thermal Sealed',
      desc: 'Chef packaged hot food in temperature-controlled bag',
      icon: 'flame-outline',
    },
    {
      step: 3,
      title: 'Rider In Transit',
      desc: 'Delivery partner navigating on bike along route',
      icon: 'bicycle-outline',
    },
    {
      step: 4,
      title: 'Delivered at Doorstep',
      desc: 'Handover complete and receipt signed',
      icon: 'checkmark-done-circle-outline',
    },
  ];

  return (
    <View>
      {/* ETA Banner Card */}
      <View
        style={[
          styles.etaBannerCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
      >
        <View style={styles.etaRow}>
          <View style={styles.etaLeft}>
            <Text style={[typography.caption, { color: colors.mutedText, textTransform: 'uppercase' }]}>
              Estimated Delivery
            </Text>
            <Text
              style={[
                typography.headingLg,
                { color: colors.textPrimary, fontWeight: '800', fontFamily: fonts?.extraBold },
              ]}
            >
              {etaMinutes > 0 ? `${etaMinutes} - ${etaMinutes + 4} mins` : 'Arrived at Gate!'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {distanceRemaining > 0 ? `${distanceRemaining} km away • On schedule` : 'Arrived safely'}
            </Text>
          </View>

          <View style={[styles.etaBadge, { backgroundColor: colors.primaryTint }]}>
            <Text
              style={[
                typography.caption,
                { color: colors.primary, fontWeight: '800', fontFamily: fonts?.bold },
              ]}
            >
              {Math.round(progressPercent * 100)}% Complete
            </Text>
          </View>
        </View>

        {/* Progress Bar Track */}
        <View style={[styles.etaProgressTrack, { backgroundColor: colors.surfaceBorder }]}>
          <View
            style={[
              styles.etaProgressBar,
              {
                width: `${Math.round(progressPercent * 100)}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Address Block */}
      <View
        style={[
          styles.addressCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
      >
        <View style={[styles.addressIconWrap, { backgroundColor: colors.primaryTint }]}>
          <Ionicons name="location" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.caption, { color: colors.mutedText, textTransform: 'uppercase' }]}>
            Delivering To
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, fontWeight: '700', fontFamily: fonts?.semiBold },
            ]}
            numberOfLines={2}
          >
            {destinationAddress}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            Contactless delivery at main gate
          </Text>
        </View>
      </View>

      {/* Milestones Stepper Card */}
      <View
        style={[
          styles.milestonesCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          shadows.soft,
        ]}
      >
        <Text
          style={[
            typography.caption,
            { color: colors.mutedText, textTransform: 'uppercase', marginBottom: 16 },
          ]}
        >
          Live Fulfillment Milestones
        </Text>

        {steps.map((st, idx) => {
          const isDone = st.step < activeStep || progressPercent >= 1.0;
          const isCurrent = st.step === activeStep && progressPercent < 1.0;
          const isLast = idx === steps.length - 1;

          return (
            <View key={st.step} style={styles.stepRow}>
              <View style={styles.stepIndicatorCol}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: isDone
                        ? colors.ready
                        : isCurrent
                        ? colors.primary
                        : colors.surface,
                      borderColor: isDone
                        ? colors.ready
                        : isCurrent
                        ? colors.primary
                        : colors.surfaceBorder,
                    },
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                  ) : (
                    <Ionicons
                      name={st.icon}
                      size={12}
                      color={isCurrent ? colors.onPrimary : colors.mutedText}
                    />
                  )}
                </View>

                {!isLast && (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor: isDone ? colors.ready : colors.surfaceBorder,
                      },
                    ]}
                  />
                )}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    typography.body,
                    {
                      color: isCurrent || isDone ? colors.textPrimary : colors.mutedText,
                      fontWeight: isCurrent ? '700' : '600',
                      fontFamily: isCurrent ? fonts?.bold : fonts?.medium,
                    },
                  ]}
                >
                  {st.title}
                </Text>
                <Text style={[typography.caption, { color: colors.mutedText, marginTop: 2 }]}>
                  {st.desc}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
