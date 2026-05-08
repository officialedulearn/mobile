import BackButton from "@/components/common/backButton";
import { ScreenContainer } from "@/components/common/ScreenContainer";
import usePublicQuizStore from "@/core/quizStore";
import useUserStore from "@/core/userState";
import { useScreenStyles } from "@/hooks/useScreenStyles";
import { useTheme } from "@/hooks/useTheme";
import type { LeaderBoardEntry } from "@/types/quizzes.types";
import { Design } from "@/utils/design";
import { LegendList } from "@legendapp/list";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

function getDisplayName(entry: LeaderBoardEntry) {
  return (
    entry.user.username?.trim() ||
    entry.user.name?.trim() ||
    "Anonymous learner"
  );
}

function getJoinedLabel(joinedAt: LeaderBoardEntry["joinedAt"]) {
  if (!joinedAt) return "Joined recently";
  const date = joinedAt instanceof Date ? joinedAt : new Date(joinedAt);
  if (Number.isNaN(date.getTime())) return "Joined recently";
  return `Joined ${date.toLocaleDateString()}`;
}

export default function QuizLeaderboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const quizId = useMemo(
    () =>
      typeof id === "string" ? id : Array.isArray(id) ? (id[0] ?? "") : "",
    [id],
  );

  const userId = useUserStore((s) => s.user?.id);
  const { isDark } = useTheme();
  const screenStyles = useScreenStyles();
  const {
    quiz,
    quizLoading,
    quizError,
    leaderboardById,
    leaderboardLoading,
    leaderboardError,
    fetchQuiz,
    fetchLeaderboard,
  } = usePublicQuizStore();

  const detail = quizId ? quiz[quizId] : undefined;
  const entries = quizId ? (leaderboardById[quizId] ?? []) : [];
  const loading = quizId
    ? Boolean(quizLoading[quizId] || leaderboardLoading[quizId])
    : false;
  const error = quizId
    ? (leaderboardError[quizId] ?? (!detail ? quizError : null))
    : "Quiz not found";
  const topEntry = entries[0];

  useEffect(() => {
    if (!quizId) return;
    void fetchQuiz(quizId).catch(() => undefined);
    void fetchLeaderboard(quizId).catch(() => undefined);
  }, [fetchLeaderboard, fetchQuiz, quizId]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerWrap}>
        <View style={styles.topNav}>
          <BackButton />
          <View style={styles.topCopy}>
            <Text style={[styles.header, { color: screenStyles.text.primary }]}>
              Quiz leaderboard
            </Text>
            <Text
              style={[styles.subtext, { color: screenStyles.text.secondary }]}
            >
              {detail?.title ?? "Loading quiz details..."}
            </Text>
          </View>
        </View>

        {detail?.description ? (
          <Text
            style={[styles.description, { color: screenStyles.text.secondary }]}
          >
            {detail.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View
            style={[
              styles.metaChip,
              {
                backgroundColor: isDark
                  ? Design.colors.dark.surface
                  : Design.colors.background.white,
                borderColor: isDark
                  ? Design.colors.dark.border
                  : Design.colors.border.hub,
              },
            ]}
          >
            <Text
              style={[styles.metaText, { color: screenStyles.text.primary }]}
            >
              {detail?.questions.length ?? 0} questions
            </Text>
          </View>
          <View
            style={[
              styles.metaChip,
              {
                backgroundColor: isDark
                  ? Design.colors.dark.surface
                  : Design.colors.background.white,
                borderColor: isDark
                  ? Design.colors.dark.border
                  : Design.colors.border.hub,
              },
            ]}
          >
            <Text
              style={[styles.metaText, { color: screenStyles.text.primary }]}
            >
              {entries.length} ranked
            </Text>
          </View>
        </View>

        {topEntry ? (
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark
                  ? Design.colors.dark.surface
                  : Design.colors.background.white,
                borderColor: isDark
                  ? Design.colors.dark.border
                  : Design.colors.border.hub,
              },
            ]}
          >
            <Text
              style={[
                styles.heroEyebrow,
                { color: screenStyles.text.secondary },
              ]}
            >
              Current leader
            </Text>
            <Text
              style={[styles.heroName, { color: screenStyles.text.primary }]}
            >
              {getDisplayName(topEntry)}
            </Text>
            <Text
              style={[styles.heroScore, { color: Design.colors.mint.DEFAULT }]}
            >
              {topEntry.score ?? 0} points
            </Text>
          </View>
        ) : null}

        <Text
          style={[styles.sectionHeader, { color: screenStyles.text.primary }]}
        >
          Standings
        </Text>
      </View>
    ),
    [
      detail?.description,
      detail?.questions.length,
      detail?.title,
      entries.length,
      isDark,
      screenStyles.text.primary,
      screenStyles.text.secondary,
      topEntry,
    ],
  );

  const renderRow = useCallback(
    ({ item, index }: { item: LeaderBoardEntry }) => {
      const isCurrentUser = item.userId === userId;
      const avatarSource = item.user.profilePictureURL
        ? { uri: item.user.profilePictureURL }
        : require("@/assets/images/memoji.png");

      return (
        <View
          style={[
            styles.row,
            {
              backgroundColor: isCurrentUser
                ? isDark
                  ? "rgba(0, 255, 128, 0.14)"
                  : "rgba(0, 255, 128, 0.08)"
                : isDark
                  ? Design.colors.dark.surface
                  : Design.colors.background.white,
              borderColor: isCurrentUser
                ? Design.colors.mint.DEFAULT
                : isDark
                  ? Design.colors.dark.border
                  : Design.colors.border.hub,
            },
          ]}
        >
          <View
            style={[
              styles.rankBadge,
              {
                backgroundColor: isDark
                  ? Design.colors.dark.canvas
                  : Design.colors.background.canvas,
              },
            ]}
          >
            <Text
              style={[styles.rankText, { color: screenStyles.text.primary }]}
            >
              #{index + 1}
            </Text>
          </View>

          <Image
            source={avatarSource}
            style={styles.avatar}
            contentFit="cover"
          />

          <View style={styles.rowCopy}>
            <Text
              style={[styles.rowName, { color: screenStyles.text.primary }]}
              numberOfLines={1}
            >
              {getDisplayName(item)}
              {isCurrentUser ? " (You)" : ""}
            </Text>
            <Text
              style={[styles.rowMeta, { color: screenStyles.text.secondary }]}
              numberOfLines={1}
            >
              {getJoinedLabel(item.joinedAt)}
            </Text>
          </View>

          <View
            style={[
              styles.scorePill,
              {
                backgroundColor: isDark
                  ? Design.colors.dark.canvas
                  : Design.colors.background.canvas,
              },
            ]}
          >
            <Text
              style={[styles.scoreText, { color: screenStyles.text.primary }]}
            >
              {item.score ?? 0}
            </Text>
          </View>
        </View>
      );
    },
    [isDark, screenStyles.text.primary, screenStyles.text.secondary, userId],
  );

  return (
    <>
      {isDark ? <StatusBar style="light" /> : <StatusBar style="dark" />}
      <ScreenContainer scrollable={false}>
        <View style={styles.flex}>
          <LegendList
            data={entries}
            estimatedItemSize={88}
            keyExtractor={(item) => item.userId}
            renderItem={renderRow}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.stateWrap}>
                {loading ? (
                  <ActivityIndicator
                    color={
                      isDark
                        ? Design.colors.mint.DEFAULT
                        : Design.colors.primary.accentDarkest
                    }
                  />
                ) : (
                  <Text
                    style={[
                      styles.stateText,
                      { color: screenStyles.text.secondary },
                    ]}
                  >
                    {error ||
                      "No attempts yet. Start the quiz to claim the first spot."}
                  </Text>
                )}
              </View>
            }
          />
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Design.spacing.xl,
  },
  headerWrap: {
    paddingHorizontal: Design.spacing.mdLg,
    paddingBottom: Design.spacing.md,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: Design.spacing.md,
  },
  topCopy: {
    flex: 1,
  },
  header: {
    fontSize: Design.typography.fontSize.xl,
    lineHeight: Design.typography.lineHeight.xl,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  subtext: {
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.md,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    marginTop: 2,
  },
  description: {
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.md,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    marginTop: Design.spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    gap: Design.spacing.sm,
    marginTop: Design.spacing.md,
  },
  metaChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.sm,
  },
  metaText: {
    fontSize: Design.typography.fontSize.xs,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
  },
  heroCard: {
    marginTop: Design.spacing.md,
    borderWidth: 1,
    borderRadius: 24,
    padding: Design.spacing.mdLg,
  },
  heroEyebrow: {
    fontSize: Design.typography.fontSize.xs,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroName: {
    marginTop: Design.spacing.xs,
    fontSize: Design.typography.fontSize.lg,
    lineHeight: Design.typography.lineHeight.lg,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  heroScore: {
    marginTop: Design.spacing.sm,
    fontSize: Design.typography.fontSize["2xl"],
    lineHeight: Design.typography.lineHeight["2xl"],
    fontFamily: Design.typography.fontFamily.satoshi.bold,
    fontWeight: Design.typography.fontWeight.bold,
  },
  sectionHeader: {
    marginTop: Design.spacing.lg,
    fontSize: Design.typography.fontSize.lg,
    lineHeight: Design.typography.lineHeight.lg,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Design.spacing.mdLg,
    marginBottom: Design.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    padding: Design.spacing.md,
    gap: Design.spacing.sm,
  },
  rankBadge: {
    minWidth: 52,
    borderRadius: 999,
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.sm,
    alignItems: "center",
  },
  rankText: {
    fontSize: Design.typography.fontSize.sm,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Design.colors.background.surfaceMuted,
  },
  rowCopy: {
    flex: 1,
  },
  rowName: {
    fontSize: Design.typography.fontSize.base,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: Design.typography.fontSize.xs,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
  },
  scorePill: {
    minWidth: 56,
    borderRadius: 999,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.sm,
    alignItems: "center",
  },
  scoreText: {
    fontSize: Design.typography.fontSize.base,
    fontFamily: Design.typography.fontFamily.satoshi.bold,
    fontWeight: Design.typography.fontWeight.bold,
  },
  stateWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Design.spacing.xl,
    paddingVertical: Design.spacing.xl,
  },
  stateText: {
    textAlign: "center",
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.md,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
  },
});
