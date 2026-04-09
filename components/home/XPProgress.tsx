import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';

interface XPProgressProps {
  currentXP: number;
  progress: number;
  xpNeeded: number;
}

export function XPProgress({ currentXP, progress, xpNeeded }: XPProgressProps) {
  const { isDark, colors, spacing } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.primary.accentDarkest, paddingHorizontal: spacing.md, paddingVertical: spacing.md }
    ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Image
          source={require('@/assets/images/icons/medal.png')}
          style={{ width: 24, height: 24 }}
        />
        <Text style={[
          styles.xpText,
          { color: colors.mint.DEFAULT, fontSize: Design.typography.fontSize.lg, fontWeight: Design.typography.fontWeight.bold }
        ]}>
          {currentXP} XP
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color={isDark ? colors.primary.accentDarkest : colors.mint.DEFAULT}
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.60)' : 'rgba(255, 255, 255, 0.10)',
        }}
      />
      <Text style={[
        styles.subtitle,
        { color: isDark ? colors.text.darkSecondary : colors.text.tertiary }
      ]}>
        {xpNeeded > 0
          ? `Great work! You're just ${xpNeeded} XP away from the next badge 🔥`
          : "Congratulations! You've reached the highest level! 🏆"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    marginTop: Design.spacing.lg,
    gap: Design.spacing.md,
  },
  xpText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
  },
});
