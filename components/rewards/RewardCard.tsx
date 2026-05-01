import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';

interface RewardCardProps {
  title: string;
  description: string;
  icon: any;
  level?: number;
  color?: string;
  onPress: () => void;
}

export function RewardCard({
  title,
  description,
  icon,
  level,
  color = Design.colors.primary.accentDark,
  onPress,
}: RewardCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderMuted,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        }
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Image source={icon} style={{ width: 32, height: 32 }} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[
          styles.title,
          { color: colors.textPrimary }
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.description,
          { color: colors.textSecondary }
        ]}>
          {description}
        </Text>
      </View>

      {level && (
        <View style={[styles.levelBadge, { backgroundColor: color }]}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Design.spacing.md,
    marginBottom: Design.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
  },
  description: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.xs,
    fontWeight: Design.typography.fontWeight.regular,
    marginTop: Design.spacing.xs,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    color: 'white',
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.semibold,
  },
});
