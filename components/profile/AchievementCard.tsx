import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';

const ACHIEVEMENT_IMAGES: { [key: string]: any } = {
  xp: require('@/assets/images/icons/medal-06.png'),
  nft: require('@/assets/images/icons/nft.png'),
  quiz: require('@/assets/images/icons/brain-03.png'),
};

interface AchievementCardProps {
  title: string;
  imageKey: string;
  metric: string;
}

export function AchievementCard({ title, imageKey, metric }: AchievementCardProps) {
  const { isDark, colors, spacing } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.surface : colors.background.white }
    ]}>
      <Image
        source={ACHIEVEMENT_IMAGES[imageKey]}
        style={{ width: 30, height: 30 }}
      />
      <Text style={[
        styles.metric,
        { color: isDark ? colors.text.darkPrimary : colors.text.primary }
      ]}>
        {metric}
      </Text>
      <Text style={[
        styles.title,
        { color: isDark ? colors.text.darkSecondary : colors.text.slateSecondary }
      ]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingVertical: Design.spacing.md,
    paddingHorizontal: Design.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Design.colors.border.hub,
    flex: 1,
    marginHorizontal: Design.spacing.xs,
  },
  metric: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.lg,
    fontWeight: Design.typography.fontWeight.semibold,
    marginTop: Design.spacing.sm,
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.xs,
    fontWeight: Design.typography.fontWeight.regular,
    marginTop: Design.spacing.xs,
    textAlign: 'center',
  },
});
