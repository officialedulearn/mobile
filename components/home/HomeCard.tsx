import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';

interface HomeCardProps {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function HomeCard({ icon, title, subtitle, onPress }: HomeCardProps) {
  const { isDark, colors, spacing } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.dark.surface : colors.background.white,
          borderColor: isDark ? colors.dark.border : colors.border.hub,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        }
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Image
        source={icon}
        style={{ width: 44, height: 44 }}
      />
      <Text style={[
        styles.title,
        { color: isDark ? colors.text.darkPrimary : colors.text.primary }
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.subtitle,
        { color: isDark ? colors.text.darkSecondary : colors.text.slateSecondary }
      ]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flex: 1,
    marginHorizontal: Design.spacing.sm,
    borderWidth: 1,
    height: 150,
    justifyContent: 'flex-start',
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    lineHeight: Design.typography.lineHeight.base,
    fontWeight: Design.typography.fontWeight.medium,
    marginTop: Design.spacing.md,
  },
  subtitle: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
    marginTop: Design.spacing.xs,
  },
});
