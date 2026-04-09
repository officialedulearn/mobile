import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';

interface QuizCardProps {
  title: string;
  description: string;
  tested?: boolean;
  onPress: () => void;
}

export function QuizCard({ title, description, tested = false, onPress }: QuizCardProps) {
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
      disabled={tested}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.title,
            { color: isDark ? colors.text.darkPrimary : colors.text.primary }
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.description,
            { color: isDark ? colors.text.darkSecondary : colors.text.slateSecondary }
          ]}
          numberOfLines={3}
        >
          {description}
        </Text>
      </View>
      {!tested && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Start</Text>
        </View>
      )}
      {tested && (
        <View style={styles.testedBadge}>
          <Image
            source={require('@/assets/images/icons/medal-05.png')}
            style={{ width: 20, height: 20 }}
          />
          <Text style={styles.testedText}>Completed</Text>
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
    paddingRight: Design.spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: Design.spacing.sm,
    marginBottom: Design.spacing.md,
    minHeight: 100,
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    lineHeight: Design.typography.lineHeight.base,
    marginBottom: Design.spacing.sm,
  },
  description: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
    lineHeight: Design.typography.lineHeight.sm,
  },
  badge: {
    backgroundColor: Design.colors.primary.accentDarkest,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  badgeText: {
    color: Design.colors.mint.DEFAULT,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
    fontWeight: Design.typography.fontWeight.medium,
  },
  testedBadge: {
    flexDirection: 'row',
    gap: Design.spacing.xs,
    alignItems: 'center',
  },
  testedText: {
    color: Design.colors.semantic.success,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
    fontWeight: Design.typography.fontWeight.medium,
  },
});
