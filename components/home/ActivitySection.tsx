import { useTheme } from "@/hooks/useTheme";
import { Design, iconCaretRight } from "@/utils/design";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Activity {
  id: string;
  title: string;
  xpEarned: number;
}

interface ActivitySectionProps {
  activities: Activity[];
  isLoading: boolean;
}

export function ActivitySection({
  activities,
  isLoading,
}: ActivitySectionProps) {
  const { colors, spacing, theme } = useTheme();

  return (
    <View style={[styles.container, { marginTop: spacing.lg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Recent Highlights
        </Text>
        <TouchableOpacity
          style={[styles.seeMoreButton, { borderColor: colors.borderMuted }]}
          onPress={() => router.push("/quizzes")}
        >
          <Text style={[styles.seeMoreText, { color: colors.slate }]}>
            See all
          </Text>
          <Image
            source={iconCaretRight(theme)}
            style={{ width: 24, height: 24 }}
          />
        </TouchableOpacity>
      </View>

      {activities.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="trophy" size={24} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No highlights yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Complete activities to see your achievements!
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.itemsContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderMuted,
            },
          ]}
        >
          {activities.slice(0, 3).map((activity, index) => (
            <View key={activity.id}>
              <View style={styles.item}>
                <Text
                  style={[styles.activityTitle, { color: colors.textPrimary }]}
                >
                  {activity.title}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.xs,
                  }}
                >
                  <Image
                    source={require("@/assets/images/icons/medal-05.png")}
                    style={{ width: 20, height: 20, marginBottom: 4 }}
                  />
                  <Text
                    style={[styles.xpText, { color: colors.textSecondary }]}
                  >
                    +{activity.xpEarned} XP
                  </Text>
                </View>
              </View>
              {index < activities.slice(0, 3).length - 1 && (
                <View
                  style={{ height: 0.5, backgroundColor: colors.borderMuted }}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "column",
    gap: Design.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    lineHeight: Design.typography.lineHeight.md,
  },
  seeMoreButton: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: Design.spacing.sm,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.xs,
    alignItems: "center",
  },
  seeMoreText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.md,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
  },
  itemsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: Design.spacing.sm,
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "column",
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.md,
    width: "100%",
  },
  activityTitle: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.medium,
    lineHeight: Design.typography.lineHeight.md,
  },
  xpText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
    lineHeight: Design.typography.lineHeight.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Design.spacing.lg,
  },
  emptyTitle: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    marginBottom: Design.spacing.xs,
  },
  emptySubtitle: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    textAlign: "center",
    marginBottom: Design.spacing.md,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Design.spacing.lg,
  },
  loadingText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
  },
});
