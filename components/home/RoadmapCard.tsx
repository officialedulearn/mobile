import { useTheme } from '@/hooks/useTheme';
import { Design, iconCaretRight } from '@/utils/design';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RoadmapCardProps {
  roadmapId: string;
  title: string;
  completed: number;
  total: number;
}

export function RoadmapCard({ roadmapId, title, completed, total }: RoadmapCardProps) {
  const { colors, spacing, theme, palette, isDark } = useTheme();
  const percentage = Math.round((completed / total) * 100);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderMuted,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          marginTop: spacing.lg,
        }
      ]}
      activeOpacity={0.8}
      onPress={() => router.push(`/roadmaps/${roadmapId}`)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: colors.canvas, borderColor: colors.borderMuted }
        ]}>
          <Image
            source={require('@/assets/images/icons/roadmap.png')}
            style={{ width: 20, height: 20 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[
            styles.label,
            { color: colors.textSecondary }
          ]}>
            Continue Learning
          </Text>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary }
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Image
          source={iconCaretRight(theme)}
          style={{ width: 24, height: 24 }}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[
            styles.progressText,
            { color: colors.textSecondary }
          ]}>
            {completed} of {total} steps completed
          </Text>
          <Text style={[
            styles.percentageText,
            { color: colors.brand }
          ]}>
            {percentage}%
          </Text>
        </View>
        <View style={[
          styles.progressBar,
          { backgroundColor: isDark ? colors.canvas : palette.background.surfaceAlt }
        ]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: colors.hubFabBg }
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
    fontWeight: Design.typography.fontWeight.medium,
    marginBottom: Design.spacing.xs,
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.semibold,
    lineHeight: Design.typography.lineHeight.base,
  },
  progressText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
  },
  percentageText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.semibold,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
