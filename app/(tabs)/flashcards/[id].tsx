import BackButton from "@/components/common/backButton";
import useFlashCardStore from "@/core/flashCardState";
import useUserStore from "@/core/userState";
import { useTheme } from "@/hooks/useTheme";
import type { Flashcard } from "@/types/flashcards.types";
import { Design, iconNotebook } from "@/utils/design";
import { LegendList } from "@legendapp/list";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STUDY_CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 340);

const sortCards = (cards: Flashcard[]) =>
  [...cards].sort((a, b) => a.sortOrder - b.sortOrder);

export default function FlashcardDeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = useMemo(
    () => (typeof id === "string" ? id : Array.isArray(id) ? id[0] ?? "" : ""),
    [id],
  );
  const userId = useUserStore((s) => s.user?.id);
  const { colors, isDark, statusBarStyle, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const payload = useFlashCardStore((s) => (deckId ? s.flashCardById[deckId] : undefined));
  const isLoading = useFlashCardStore((s) => s.isLoading);
  const error = useFlashCardStore((s) => s.error);
  const fetchFlashcardDeckById = useFlashCardStore((s) => s.fetchFlashcardDeckById);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!deckId || !userId) return;
    let cancelled = false;
    setReady(false);
    (async () => {
      await fetchFlashcardDeckById(deckId, userId);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId, userId, fetchFlashcardDeckById]);

  const cards = useMemo(() => sortCards(payload?.flashcards ?? []), [payload?.flashcards]);

  const toggleCard = useCallback((cardId: string) => {
    setFlipped((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  }, []);

  const retry = useCallback(() => {
    if (!deckId || !userId) return;
    setReady(false);
    void fetchFlashcardDeckById(deckId, userId, { force: true }).finally(() => setReady(true));
  }, [deckId, userId, fetchFlashcardDeckById]);

  const renderStudyCard = useCallback(
    (card: Flashcard, index: number) => {
      const isFlipped = Boolean(flipped[card.id]);
      return (
        <TouchableOpacity
          key={card.id}
          activeOpacity={0.9}
          onPress={() => toggleCard(card.id)}
          style={styles.studyCardWrap}
        >
          <LinearGradient
            colors={isDark ? ["#1E2A24", "#131A18", "#0D1210"] : ["#F4FAF7", "#E8F5EE", "#DFF0E8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.studyCard, { borderColor: isDark ? "rgba(0,255,128,0.2)" : "#DFF0E8" }]}
          >
            <View style={styles.studyCardTop}>
              <Text style={[styles.studyCardCount, { color: colors.textSecondary }]}>
                {index + 1} / {cards.length}
              </Text>
              <Text style={[styles.flipHint, { color: colors.textSecondary }]}>
                {isFlipped ? "Back" : "Front"}
              </Text>
            </View>
            <Text style={[styles.studyLabel, { color: colors.textSecondary }]}>
              {isFlipped ? "Answer" : "Prompt"}
            </Text>
            <Text style={[styles.studyText, { color: colors.textPrimary }]}>
              {isFlipped ? card.back : card.front}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [cards.length, colors, flipped, isDark, toggleCard],
  );

  const renderCardRow = useCallback(
    ({ item, index }: { item: Flashcard; index: number }) => (
      <View
        style={[
          styles.termRow,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderMuted,
          },
        ]}
      >
        <Text style={[styles.termNumber, { color: colors.textTertiary }]}>
          {(index + 1).toString().padStart(2, "0")}
        </Text>
        <View style={styles.termBody}>
          <Text style={[styles.termFront, { color: colors.textPrimary }]}>{item.front}</Text>
          <View style={[styles.rule, { backgroundColor: colors.borderMuted }]} />
          <Text style={[styles.termBack, { color: colors.textSecondary }]}>{item.back}</Text>
        </View>
      </View>
    ),
    [colors],
  );

  const listHeader = useCallback(
    () => (
      <View style={styles.contentPadding}>
        <View style={[styles.topNav, { paddingTop: insets.top + Design.spacing.sm }]}>
          <BackButton />
          <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            Flashcard deck
          </Text>
        </View>

        <View
          style={[
            styles.deckHeader,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderMuted,
            },
          ]}
        >
          <View style={styles.deckHeaderTop}>
            <View
              style={[
                styles.deckIconWrap,
                {
                  backgroundColor: isDark ? "rgba(0,255,128,0.12)" : "#F4FAF7",
                  borderColor: isDark ? "rgba(0,255,128,0.18)" : "#DFF0E8",
                },
              ]}
            >
              <Image source={iconNotebook(theme)} style={styles.deckIcon} />
            </View>
            <View style={styles.deckHeaderCopy}>
              <Text style={[styles.deckTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {payload?.deck.title ?? "Flashcards"}
              </Text>
              <Text style={[styles.deckTopic, { color: colors.textSecondary }]} numberOfLines={2}>
                {payload?.deck.topic ?? "Review this deck"}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{cards.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>cards</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>Study</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>mode</Text>
            </View>
          </View>
        </View>

        {cards.length > 0 ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={STUDY_CARD_WIDTH + Design.spacing.md}
              decelerationRate="fast"
              contentContainerStyle={styles.studyScroll}
            >
              {cards.map(renderStudyCard)}
            </ScrollView>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>All cards</Text>
          </>
        ) : null}
      </View>
    ),
    [cards, colors, insets.top, isDark, payload, renderStudyCard, theme],
  );

  const renderBody = () => {
    if (!userId) {
      return (
        <View style={[styles.container, { backgroundColor: colors.canvas }]}>
          <StatusBar style={statusBarStyle} />
          <View style={[styles.topNavStandalone, { paddingTop: insets.top + Design.spacing.sm }]}>
            <BackButton />
          </View>
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sign in to study</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              You need to be signed in to open this flashcard deck.
            </Text>
          </View>
        </View>
      );
    }

    if ((isLoading || !ready) && !payload) {
      return (
        <View style={[styles.container, { backgroundColor: colors.canvas }]}>
          <StatusBar style={statusBarStyle} />
          <View style={[styles.topNavStandalone, { paddingTop: insets.top + Design.spacing.sm }]}>
            <BackButton />
          </View>
          <View style={styles.centerBlock}>
            <ActivityIndicator color={colors.refreshTint} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading deck...
            </Text>
          </View>
        </View>
      );
    }

    if (error && !payload) {
      return (
        <View style={[styles.container, { backgroundColor: colors.canvas }]}>
          <StatusBar style={statusBarStyle} />
          <View style={[styles.topNavStandalone, { paddingTop: insets.top + Design.spacing.sm }]}>
            <BackButton />
          </View>
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.ctaPrimaryBg }]} onPress={retry}>
              <Text style={[styles.retryText, { color: colors.ctaPrimaryFg }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!payload || !cards.length) {
      return (
        <View style={[styles.container, { backgroundColor: colors.canvas }]}>
          <StatusBar style={statusBarStyle} />
          <View style={[styles.topNavStandalone, { paddingTop: insets.top + Design.spacing.sm }]}>
            <BackButton />
          </View>
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No cards in this deck</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Try another deck from your flashcard library.
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.ctaPrimaryBg }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.retryText, { color: colors.ctaPrimaryFg }]}>Back to decks</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <StatusBar style={statusBarStyle} />
        <LegendList
          data={cards}
          estimatedItemSize={156}
          keyExtractor={(item) => item.id}
          renderItem={renderCardRow}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  };

  return renderBody();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Design.spacing.xl,
  },
  contentPadding: {
    paddingHorizontal: Design.spacing.mdLg,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: Design.spacing.md,
    marginBottom: Design.spacing.lg,
  },
  topNavStandalone: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Design.spacing.mdLg,
  },
  navTitle: {
    flex: 1,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.lg,
    lineHeight: Design.typography.lineHeight.lg,
    fontWeight: Design.typography.fontWeight.medium,
  },
  deckHeader: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Design.spacing.md,
    marginBottom: Design.spacing.md,
  },
  deckHeaderTop: {
    flexDirection: "row",
    gap: Design.spacing.md,
  },
  deckIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deckIcon: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },
  deckHeaderCopy: {
    flex: 1,
  },
  deckTitle: {
    fontFamily: Design.typography.fontFamily.satoshi.bold,
    fontSize: Design.typography.fontSize.xl,
    lineHeight: Design.typography.lineHeight.xl,
    fontWeight: Design.typography.fontWeight.bold,
  },
  deckTopic: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
    marginTop: Design.spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: Design.spacing.sm,
    marginTop: Design.spacing.md,
  },
  statPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.md,
  },
  statValue: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    lineHeight: Design.typography.lineHeight.base,
    fontWeight: Design.typography.fontWeight.semibold,
  },
  statLabel: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.xs,
  },
  studyScroll: {
    paddingRight: Design.spacing.mdLg,
    gap: Design.spacing.md,
    paddingBottom: Design.spacing.lg,
  },
  studyCardWrap: {
    width: STUDY_CARD_WIDTH,
  },
  studyCard: {
    minHeight: 220,
    borderRadius: 22,
    borderWidth: 1,
    padding: Design.spacing.mdLg,
    justifyContent: "space-between",
  },
  studyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studyCardCount: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
  },
  flipHint: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.xs,
  },
  studyLabel: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
    textTransform: "uppercase",
  },
  studyText: {
    fontFamily: Design.typography.fontFamily.satoshi.bold,
    fontSize: Design.typography.fontSize.lg,
    lineHeight: Design.typography.lineHeight.lg,
    fontWeight: Design.typography.fontWeight.bold,
  },
  sectionTitle: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.lg,
    lineHeight: Design.typography.lineHeight.lg,
    fontWeight: Design.typography.fontWeight.semibold,
    marginBottom: Design.spacing.sm,
  },
  termRow: {
    marginHorizontal: Design.spacing.mdLg,
    marginBottom: Design.spacing.sm,
    padding: Design.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: Design.spacing.md,
  },
  termNumber: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
    paddingTop: 2,
  },
  termBody: {
    flex: 1,
  },
  termFront: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    lineHeight: Design.typography.lineHeight.base,
    fontWeight: Design.typography.fontWeight.semibold,
  },
  rule: {
    height: 1,
    marginVertical: Design.spacing.sm,
  },
  termBack: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Design.spacing.xl,
    gap: Design.spacing.sm,
  },
  loadingText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
  },
  emptyTitle: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.lg,
    fontWeight: Design.typography.fontWeight.semibold,
    textAlign: "center",
  },
  emptySubtext: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 16,
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.mdLg,
    marginTop: Design.spacing.sm,
  },
  retryText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.semibold,
  },
});
