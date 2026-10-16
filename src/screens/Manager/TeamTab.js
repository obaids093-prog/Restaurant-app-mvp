import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components/ui';
import { styles } from './managerStyles';

export default function TeamTab({
  staffList,
  staffName,
  setStaffName,
  staffEmail,
  setStaffEmail,
  staffPassword,
  setStaffPassword,
  isCreatingStaff,
  handleCreateStaff,
  handleToggleStaffStatus,
  handleDemoteStaff,
  user,
  colors,
  typography,
  radius,
  shadows,
}) {
  return (
    <View style={styles.tabContentBlock}>
      {/* Create Staff Account Card */}
      <View
        style={[
          styles.cardItem,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card, padding: 14 },
          shadows.soft,
        ]}
      >
        <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700', marginBottom: 4 }]}>
          Register Staff Account
        </Text>
        <Text style={[typography.caption, { color: colors.mutedText, marginBottom: 12, fontSize: 11 }]}>
          Create role-based login credentials for floor and kitchen staff.
        </Text>

        <Input
          label="Staff Name"
          placeholder="e.g. Asad Ali"
          value={staffName}
          onChangeText={setStaffName}
          icon={<Ionicons name="person-outline" size={16} color={colors.mutedText} />}
        />

        <Input
          label="Email Address"
          placeholder="e.g. asad@aurabistro.pk"
          value={staffEmail}
          onChangeText={setStaffEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Ionicons name="mail-outline" size={16} color={colors.mutedText} />}
        />

        <Input
          label="Password (min. 8 chars with number)"
          placeholder="••••••••"
          value={staffPassword}
          onChangeText={setStaffPassword}
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={16} color={colors.mutedText} />}
        />

        <Button
          title={isCreatingStaff ? 'Creating...' : 'Create Staff Member'}
          onPress={handleCreateStaff}
          variant="primary"
          size="medium"
          disabled={isCreatingStaff}
        />
      </View>

      {/* Existing Team Members */}
      <View style={{ marginTop: 18 }}>
        <Text style={[typography.headingSm, { color: colors.textPrimary, fontWeight: '700', marginBottom: 10 }]}>
          Existing Team Members ({staffList.length})
        </Text>

        {staffList.map((member) => {
          const isSelf = member._id === user?.id || member.id === user?.id;
          const isActive = member.isActive !== false;

          return (
            <View
              key={member._id || member.id}
              style={[
                styles.cardItem,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderRadius: radius.card },
                shadows.soft,
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}>
                      {member.name}
                    </Text>
                    {isSelf && (
                      <View style={[styles.selfBadge, { backgroundColor: colors.primaryTint }]}>
                        <Text style={[typography.caption, { color: colors.primary, fontWeight: '800', fontSize: 10 }]}>
                          You
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isActive ? colors.readyTint : colors.cancelledTint },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          { color: isActive ? colors.ready : colors.cancelled, fontWeight: '700', fontSize: 10 },
                        ]}
                      >
                        {isActive ? 'Active' : 'Disabled'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.caption, { color: colors.mutedText, fontSize: 11, marginTop: 2 }]}>
                    {member.email} • Role: {member.role}
                  </Text>
                </View>
              </View>

              {!isSelf && (
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    onPress={() => handleToggleStaffStatus(member)}
                    style={[
                      styles.staffActionBtn,
                      {
                        backgroundColor: isActive ? colors.cancelledTint : colors.readyTint,
                        borderColor: isActive ? colors.cancelled + '40' : colors.ready + '40',
                        borderRadius: radius.button,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isActive ? 'ban-outline' : 'checkmark-circle-outline'}
                      size={14}
                      color={isActive ? colors.cancelled : colors.ready}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[typography.caption, { color: isActive ? colors.cancelled : colors.ready, fontWeight: '700' }]}>
                      {isActive ? 'Deactivate' : 'Reactivate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDemoteStaff(member)}
                    style={[
                      styles.staffActionBtn,
                      { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: radius.button },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-down-circle-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
                      Demote to Customer
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
