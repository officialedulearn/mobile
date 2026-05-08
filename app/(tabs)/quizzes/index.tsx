import { ScreenContainer } from "@/components/common/ScreenContainer";
import usePublicQuizStore from "@/core/quizStore";
import useUserStore from "@/core/userState";
import { useScreenStyles } from "@/hooks/useScreenStyles";
import { useTheme } from "@/hooks/useTheme";
import type { PublicQuizListItem } from "@/types/quizzes.types";
import { Design } from "@/utils/design";
import { createPublicQuizDeepLink } from "@/utils/quizLinks";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { LegendList } from "@legendapp/list";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type QuizTab = "mine" | "public";

const Quizzes = () => {
  const userId = useUserStore((s) => s.user?.id);
  const { isDark } = useTheme();
  const screenStyles = useScreenStyles();
  const [activeTab, setActiveTab] = useState<QuizTab>("mine");
  const [listsReady, setListsReady] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<PublicQuizListItem | null>(
    null,
  );
  const quizActionSheetRef = useRef<BottomSheetModal>(null);
  const {
    publicQuizzes,
    myQuizzes,
    quizError,
    fetchPublicQuizzes,
    fetchMyQuizzes,
  } = usePublicQuizStore();

  const visiblePublicQuizzes = publicQuizzes.filter(
    (quiz) => quiz.createdBy !== userId,
  );
  const displayedQuizzes =
    activeTab === "mine" ? myQuizzes : visiblePublicQuizzes;
  const actionSheetSnapPoints = useMemo(() => ["56%"], []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setListsReady(false);
    (async () => {
      try {
        await Promise.all([
          fetchPublicQuizzes({ limit: 50, sort: "recent" }),
          fetchMyQuizzes({ limit: 30 }),
        ]);
      } finally {
        if (!cancelled) setListsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, fetchPublicQuizzes, fetchMyQuizzes]);

  const openQuiz = useCallback((quizId: string) => {
    router.push({ pathname: "/(tabs)/quizzes/[id]", params: { id: quizId } });
  }, []);

  const openQuizLeaderboard = useCallback((quizId: string) => {
    router.push({
      pathname: "/(tabs)/quizzes/leaderboard/[id]",
      params: { id: quizId },
    });
  }, []);

  const closeQuizActions = useCallback(() => {
    quizActionSheetRef.current?.dismiss();
  }, []);

  const handleOpenQuizActions = useCallback((quiz: PublicQuizListItem) => {
    setSelectedQuiz(quiz);
    quizActionSheetRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const shareQuiz = useCallback(async (quiz: PublicQuizListItem) => {
    const url = createPublicQuizDeepLink(quiz.id);
    await Share.share({
      title: quiz.title,
      message: `Try this EduLearn quiz: ${url}`,
      url,
    });
  }, []);

  const handleStartQuiz = useCallback(() => {
    if (!selectedQuiz) return;
    const quizId = selectedQuiz.id;
    closeQuizActions();
    requestAnimationFrame(() => openQuiz(quizId));
  }, [closeQuizActions, openQuiz, selectedQuiz]);

  const handleViewLeaderboard = useCallback(() => {
    if (!selectedQuiz) return;
    const quizId = selectedQuiz.id;
    closeQuizActions();
    requestAnimationFrame(() => openQuizLeaderboard(quizId));
  }, [closeQuizActions, openQuizLeaderboard, selectedQuiz]);

  const handleShareQuiz = useCallback(async () => {
    if (!selectedQuiz) return;
    const quiz = selectedQuiz;
    closeQuizActions();
    await shareQuiz(quiz);
  }, [closeQuizActions, selectedQuiz, shareQuiz]);

  const listHeader = useCallback(
    () => (
      <View style={styles.headerWrap}>
        <Text style={[styles.header, { color: screenStyles.text.primary }]}>
          Quizzes
        </Text>
        <Text style={[styles.subtext, { color: screenStyles.text.secondary }]}>
          Practice what you&apos;ve learned. Earn XP. Get smarter.
        </Text>

        <View
          style={[
            styles.tabBar,
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
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "mine" && {
                backgroundColor: isDark
                  ? Design.colors.mint.DEFAULT
                  : Design.colors.primary.accentDarkest,
              },
            ]}
            onPress={() => setActiveTab("mine")}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color:
                    activeTab === "mine"
                      ? isDark
                        ? Design.colors.text.primary
                        : Design.colors.mint.DEFAULT
                      : screenStyles.text.secondary,
                },
              ]}
            >
              My quizzes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "public" && {
                backgroundColor: isDark
                  ? Design.colors.mint.DEFAULT
                  : Design.colors.primary.accentDarkest,
              },
            ]}
            onPress={() => setActiveTab("public")}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color:
                    activeTab === "public"
                      ? isDark
                        ? Design.colors.text.primary
                        : Design.colors.mint.DEFAULT
                      : screenStyles.text.secondary,
                },
              ]}
            >
              Public quizzes
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.sectionHeader, { color: screenStyles.text.primary }]}
        >
          {activeTab === "mine" ? "Your published quizzes" : "Public quizzes"}
        </Text>
        <Text style={[styles.tabHint, { color: screenStyles.text.secondary }]}>
          {activeTab === "mine"
            ? "Everything you have published shows up here."
            : "Browse quizzes from other learners. Your own quizzes are hidden from this list."}
        </Text>

        {quizError ? (
          <Text
            style={[styles.errorText, { color: Design.colors.semantic.error }]}
          >
            {quizError}
          </Text>
        ) : null}
      </View>
    ),
    [
      activeTab,
      isDark,
      quizError,
      screenStyles.text.primary,
      screenStyles.text.secondary,
    ],
  );

  const renderQuizRow = useCallback(
    ({ item }: { item: PublicQuizListItem }) => {
      const border = isDark
        ? Design.colors.dark.border
        : Design.colors.border.hub;
      const surface = isDark
        ? Design.colors.dark.surface
        : Design.colors.background.white;
      const primary = isDark
        ? Design.colors.text.darkPrimary
        : Design.colors.text.primary;
      const secondary = isDark
        ? Design.colors.text.darkSecondary
        : Design.colors.text.slateSecondary;
      const creatorLabel =
        activeTab === "mine"
          ? "Published by you"
          : item.creatorUsername
            ? `by ${item.creatorUsername}`
            : "Public quiz";

      return (
        <TouchableOpacity
          style={[
            styles.publicRow,
            { backgroundColor: surface, borderColor: border },
          ]}
          onPress={() => handleOpenQuizActions(item)}
          activeOpacity={0.85}
        >
          <View style={styles.rowContent}>
            <Text
              style={[styles.publicTitle, { color: primary }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.publicSub, { color: secondary }]}
              numberOfLines={1}
            >
              {creatorLabel}
            </Text>
            <View style={styles.publicStats}>
              <Text style={[styles.publicStatText, { color: secondary }]}>
                {item.attemptCount} attempts
              </Text>
              {activeTab === "mine" ? (
                <Text style={[styles.publicStatText, { color: secondary }]}>
                  {item.viewCount} views
                </Text>
              ) : null}
              <Text style={[styles.publicStatText, { color: secondary }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.publicChevronWrap}>
            <Text style={[styles.publicChevron, { color: primary }]}>
              {">"}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [activeTab, handleOpenQuizActions, isDark],
  );

  return (
    <>
      {isDark ? <StatusBar style="light" /> : <StatusBar style="dark" />}
      <ScreenContainer scrollable={false}>
        <View style={styles.flex}>
          <LegendList
            data={displayedQuizzes}
            estimatedItemSize={92}
            keyExtractor={(item) => item.id}
            renderItem={renderQuizRow}
            ListHeaderComponent={listHeader}
            nestedScrollEnabled={Platform.OS === "android"}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                {!listsReady ? (
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
                      styles.emptyCenter,
                      { color: screenStyles.text.secondary },
                    ]}
                  >
                    {activeTab === "mine"
                      ? "You have not published any quizzes yet."
                      : "No public quizzes yet."}
                  </Text>
                )}
              </View>
            }
          />
        </View>
      </ScreenContainer>
      <BottomSheetModal
        ref={quizActionSheetRef}
        index={0}
        snapPoints={actionSheetSnapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        backgroundStyle={[
          styles.sheetBackground,
          {
            backgroundColor: isDark
              ? Design.colors.dark.surface
              : Design.colors.background.white,
          },
        ]}
        handleIndicatorStyle={[
          styles.sheetIndicator,
          {
            backgroundColor: isDark
              ? Design.colors.text.darkSecondary
              : Design.colors.text.slateSecondary,
          },
        ]}
        onDismiss={() => setSelectedQuiz(null)}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text
            style={[
              styles.sheetEyebrow,
              { color: screenStyles.text.secondary },
            ]}
          >
            Quiz actions
          </Text>
          <Text
            style={[styles.sheetTitle, { color: screenStyles.text.primary }]}
          >
            {selectedQuiz?.title ?? "Selected quiz"}
          </Text>
          <Text
            style={[
              styles.sheetDescription,
              { color: screenStyles.text.secondary },
            ]}
          >
            {selectedQuiz?.description?.trim() ||
              "Choose what you want to do with this quiz."}
          </Text>
          <View style={styles.sheetStats}>
            <View
              style={[
                styles.sheetStatChip,
                {
                  backgroundColor: isDark
                    ? Design.colors.dark.canvas
                    : Design.colors.background.canvas,
                  borderColor: isDark
                    ? Design.colors.dark.border
                    : Design.colors.border.hub,
                },
              ]}
            >
              <Text
                style={[
                  styles.sheetStatText,
                  { color: screenStyles.text.primary },
                ]}
              >
                {selectedQuiz?.attemptCount ?? 0} attempts
              </Text>
            </View>
            <View
              style={[
                styles.sheetStatChip,
                {
                  backgroundColor: isDark
                    ? Design.colors.dark.canvas
                    : Design.colors.background.canvas,
                  borderColor: isDark
                    ? Design.colors.dark.border
                    : Design.colors.border.hub,
                },
              ]}
            >
              <Text
                style={[
                  styles.sheetStatText,
                  { color: screenStyles.text.primary },
                ]}
              >
                {selectedQuiz?.viewCount ?? 0} views
              </Text>
            </View>
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={[
                styles.sheetActionButton,
                {
                  backgroundColor: isDark
                    ? Design.colors.dark.canvas
                    : Design.colors.background.canvas,
                  borderColor: isDark
                    ? Design.colors.dark.border
                    : Design.colors.border.hub,
                },
              ]}
              onPress={handleViewLeaderboard}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.sheetActionTitle,
                  { color: screenStyles.text.primary },
                ]}
              >
                View leaderboard
              </Text>
              <Text
                style={[
                  styles.sheetActionSubtitle,
                  { color: screenStyles.text.secondary },
                ]}
              >
                See the top performers and your ranking for this quiz.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sheetActionButton,
                {
                  backgroundColor: isDark
                    ? Design.colors.dark.canvas
                    : Design.colors.background.canvas,
                  borderColor: isDark
                    ? Design.colors.dark.border
                    : Design.colors.border.hub,
                },
              ]}
              onPress={handleShareQuiz}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.sheetActionTitle,
                  { color: screenStyles.text.primary },
                ]}
              >
                Share
              </Text>
              <Text
                style={[
                  styles.sheetActionSubtitle,
                  { color: screenStyles.text.secondary },
                ]}
              >
                Send a deep link so someone else can open this quiz.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sheetActionButton,
                styles.sheetActionButtonPrimary,
                {
                  backgroundColor: isDark
                    ? Design.colors.mint.DEFAULT
                    : Design.colors.primary.accentDarkest,
                },
              ]}
              onPress={handleStartQuiz}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.sheetActionTitle,
                  {
                    color: isDark
                      ? Design.colors.text.primary
                      : Design.colors.mint.DEFAULT,
                  },
                ]}
              >
                Start quiz
              </Text>
              <Text
                style={[
                  styles.sheetActionSubtitle,
                  {
                    color: isDark
                      ? Design.colors.text.primary
                      : "rgba(0, 255, 128, 0.8)",
                  },
                ]}
              >
                Open the timed quiz screen and begin immediately.
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
};

export default Quizzes;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerWrap: {
    paddingHorizontal: Design.spacing.mdLg,
  },
  listContent: {
    paddingBottom: Design.spacing.xl,
  },
  emptyWrap: {
    paddingVertical: Design.spacing.lg,
    alignItems: "center",
  },
  header: {
    fontSize: Design.typography.fontSize.xl,
    fontWeight: Design.typography.fontWeight.semibold,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.xl,
  },
  subtext: {
    fontSize: Design.typography.fontSize.sm,
    marginTop: Design.spacing.sm,
    marginBottom: Design.spacing.lg,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.md,
    fontWeight: Design.typography.fontWeight.regular,
  },
  tabBar: {
    flexDirection: "row",
    gap: Design.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: Design.spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.sm,
  },
  tabButtonText: {
    fontSize: Design.typography.fontSize.sm,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  sectionHeader: {
    fontSize: Design.typography.fontSize.lg,
    fontWeight: Design.typography.fontWeight.semibold,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.lg,
    marginBottom: Design.spacing.xs,
  },
  tabHint: {
    fontSize: Design.typography.fontSize.sm,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.md,
    marginBottom: Design.spacing.md,
  },
  publicRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Design.spacing.mdLg,
    marginBottom: Design.spacing.sm,
    paddingVertical: Design.spacing.md,
    paddingHorizontal: Design.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowContent: {
    flex: 1,
  },
  publicTitle: {
    fontSize: Design.typography.fontSize.base,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  publicSub: {
    fontSize: Design.typography.fontSize.xs,
    marginTop: 2,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
  },
  publicStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Design.spacing.sm,
    marginTop: Design.spacing.xs,
  },
  publicStatText: {
    fontSize: Design.typography.fontSize.xs,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
  },
  publicChevronWrap: {
    paddingLeft: Design.spacing.sm,
  },
  publicChevron: {
    fontSize: 22,
    fontWeight: Design.typography.fontWeight.medium,
  },
  errorText: {
    fontSize: Design.typography.fontSize.sm,
    marginBottom: Design.spacing.sm,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
  },
  emptyCenter: {
    textAlign: "center",
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    paddingHorizontal: Design.spacing.md,
  },
  sheetBackground: {
    borderRadius: 28,
  },
  sheetIndicator: {
    width: 44,
  },
  sheetContent: {
    paddingHorizontal: Design.spacing.mdLg,
    paddingTop: Design.spacing.sm,
    paddingBottom: Design.spacing.xl,
  },
  sheetEyebrow: {
    fontSize: Design.typography.fontSize.xs,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Design.spacing.xs,
  },
  sheetTitle: {
    fontSize: Design.typography.fontSize.xl,
    lineHeight: Design.typography.lineHeight.xl,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  sheetDescription: {
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.md,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    marginTop: Design.spacing.xs,
  },
  sheetStats: {
    flexDirection: "row",
    gap: Design.spacing.sm,
    marginTop: Design.spacing.md,
    marginBottom: Design.spacing.lg,
  },
  sheetStatChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.sm,
  },
  sheetStatText: {
    fontSize: Design.typography.fontSize.xs,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
  },
  sheetActions: {
    gap: Design.spacing.sm,
  },
  sheetActionButton: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.md,
  },
  sheetActionButtonPrimary: {
    borderWidth: 0,
  },
  sheetActionTitle: {
    fontSize: Design.typography.fontSize.base,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  sheetActionSubtitle: {
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.md,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    marginTop: 4,
  },
});
