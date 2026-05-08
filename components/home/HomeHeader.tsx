import { useTheme } from "@/hooks/useTheme";
import { Design, iconNotification, iconSearch } from "@/utils/design";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HomeHeaderProps {
  userName: string;
  profileImageUrl?: string;
}

export function HomeHeader({ userName, profileImageUrl }: HomeHeaderProps) {
  const { colors, spacing, theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: spacing.md, gap: spacing.md },
      ]}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
      >
        <Image
          source={
            profileImageUrl
              ? { uri: profileImageUrl }
              : require("@/assets/images/memoji.png")
          }
          style={{ width: 40, height: 40, borderRadius: 20 }}
          resizeMode="cover"
        />
        <View style={{ flexDirection: "column" }}>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>
            Hi {userName}👋
          </Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            Learn & earn more XP today
          </Text>
        </View>
      </View>

      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
      >
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderMuted,
            },
          ]}
          onPress={() => router.push("/notifications")}
          activeOpacity={0.7}
        >
          <Image
            source={iconNotification(theme)}
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderMuted,
            },
          ]}
          onPress={() => router.push("/search")}
          activeOpacity={0.7}
        >
          <Image source={iconSearch(theme)} style={{ width: 20, height: 20 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingBottom: Design.spacing.sm,
  },
  greeting: {
    fontFamily: Design.typography.fontFamily.urbanist.regular,
    fontSize: Design.typography.fontSize.lg,
    lineHeight: Design.typography.lineHeight.lg,
    fontWeight: Design.typography.fontWeight.bold,
  },
  subtext: {
    fontFamily: Design.typography.fontFamily.urbanist.regular,
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
    fontWeight: Design.typography.fontWeight.regular,
    marginTop: Design.spacing.xs,
  },
  iconButton: {
    borderRadius: 100,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
});
