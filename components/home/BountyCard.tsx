import { useTheme } from "@/hooks/useTheme";
import { Design } from "@/utils/design";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function BountyCard() {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderMuted,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginTop: spacing.lg,
        },
      ]}
    >
      <View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.borderMuted,
            },
          ]}
        >
          <Image
            source={require("@/assets/images/icons/trophy.png")}
            style={{ width: 16, height: 16 }}
          />
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
            Bounty Challenge
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Stay Top 3 This Week!
        </Text>
      </View>
      <Image
        source={require("@/assets/images/icons/bountyCard.png")}
        style={{ width: 66.6, height: 83, resizeMode: "contain" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexDirection: "row",
    borderRadius: 24,
    borderWidth: 1,
    width: "100%",
  },
  badge: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: Design.spacing.xs,
    paddingHorizontal: Design.spacing.sm,
    gap: Design.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Design.spacing.sm,
  },
  badgeText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
    lineHeight: Design.typography.lineHeight.sm,
    textAlign: "center",
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    lineHeight: Design.typography.fontSize.xl * 1.8,
    fontSize: Design.typography.fontSize.lg,
    fontWeight: Design.typography.fontWeight.medium,
  },
});
