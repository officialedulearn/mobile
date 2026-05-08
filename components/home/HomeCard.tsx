import { useTheme } from "@/hooks/useTheme";
import { Design } from "@/utils/design";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface HomeCardProps {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function HomeCard({ icon, title, subtitle, onPress }: HomeCardProps) {
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
        },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Image source={icon} style={{ width: 44, height: 44 }} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flex: 1,
    marginHorizontal: Design.spacing.sm,
    borderWidth: 1,
    height: 150,
    justifyContent: "flex-start",
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
