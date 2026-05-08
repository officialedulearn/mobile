import BackButton from "@/components/common/backButton";
import useFlashCardStore from "@/core/flashCardState";
import useUserStore from "@/core/userState";
import { useTheme } from "@/hooks/useTheme";
import type { Flashcard } from "@/types/flashcards.types";
import { Design, iconNotebook } from "@/utils/design";
import { LegendList } from "@legendapp/list";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STUDY_CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 340);
const STUDY_CARD_GAP = Design.spacing.md;
const STUDY_CARD_HEIGHT = Math.max(
  250,
  Math.min(Math.round(SCREEN_HEIGHT * 0.36), 380),
);

const sortCards = (cards: Flashcard[]) =>
  [...cards].sort((a, b) => a.sortOrder - b.sortOrder);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const StudyCard = memo(function StudyCard({
  card,
  index,
  total,
  colors,
  isDark,
}: {
  card: Flashcard;
  index: number;
  total: number;
  colors: { textPrimary: string; textSecondary: string };
  isDark: boolean;
}) {
  const flip = useSharedValue(0); // 0 = front, 1 = back
  const pressed = useSharedValue(0);

  const onPress = useCallback(() => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // no-op
    }
    flip.value = withTiming(flip.value ? 0 : 1, {
      duration: 460,
      easing: Easing.out(Easing.cubic),
    });
  }, [flip]);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 18, stiffness: 220 });
  }, [pressed]);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 18, stiffness: 220 });
  }, [pressed]);

  const cardAnimStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.985],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  }, []);

  const frontFaceStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flip.value,
      [0, 1],
      [0, 180],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      flip.value,
      [0, 0.45, 0.5],
      [1, 1, 0],
      Extrapolation.CLAMP,
    );
    const bump = interpolate(
      flip.value,
      [0, 0.5, 1],
      [1, 0.98, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotateY}deg` },
        { scale: bump },
      ],
    };
  }, []);

  const backFaceStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flip.value,
      [0, 1],
      [-180, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      flip.value,
      [0.5, 0.55, 1],
      [0, 1, 1],
      Extrapolation.CLAMP,
    );
    const bump = interpolate(
      flip.value,
      [0, 0.5, 1],
      [1, 0.98, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotateY}deg` },
        { scale: bump },
      ],
    };
  }, []);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.studyCardWrap,
        index < total - 1 ? { marginRight: STUDY_CARD_GAP } : null,
      ]}
    >
      <Animated.View
        style={[
          styles.studyCardShadow,
          isDark ? styles.studyCardShadowDark : styles.studyCardShadowLight,
        ]}
      />
      <Animated.View
        style={[
          styles.studyCard,
          { borderColor: isDark ? "rgba(0,255,128,0.18)" : "#DFF0E8" },
          cardAnimStyle,
        ]}
      >
        <LinearGradient
          colors={isDark ? ["#141B18", "#0F1413"] : ["#F7FBF9", "#ECF7F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.studyCardTop}>
          <Text
            style={[styles.studyCardCount, { color: colors.textSecondary }]}
          >
            {index + 1} / {total}
          </Text>
          <Text style={[styles.flipHint, { color: colors.textSecondary }]}>
            Tap to flip
          </Text>
        </View>

        <View style={styles.studyFaceWrap}>
          <Animated.View style={[styles.studyFace, frontFaceStyle]}>
            <Text style={[styles.studyLabel, { color: colors.textSecondary }]}>
              Prompt
            </Text>
            <Text style={[styles.studyText, { color: colors.textPrimary }]}>
              {card.front}
            </Text>
          </Animated.View>

          <Animated.View
            style={[styles.studyFace, styles.studyFaceBack, backFaceStyle]}
          >
            <Text style={[styles.studyLabel, { color: colors.textSecondary }]}>
              Answer
            </Text>
            <Text style={[styles.studyText, { color: colors.textPrimary }]}>
              {card.back}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
});

const StudyCarousel = memo(function StudyCarousel({
  cards,
  colors,
  isDark,
}: {
  cards: Flashcard[];
  colors: {
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    borderMuted: string;
  };
  isDark: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const paginationCards = useMemo(
    () => cards.slice(0, Math.min(cards.length, 10)),
    [cards],
  );
  const studyCardColors = useMemo(
    () => ({
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
    }),
    [colors.textPrimary, colors.textSecondary],
  );
  const windowedCards = useMemo(
    () =>
      cards.map((card, index) => ({
        card,
        index,
        shouldRender: Math.abs(index - activeIndex) <= 1,
      })),
    [activeIndex, cards],
  );

  useEffect(() => {
    setActiveIndex((current) =>
      Math.max(0, Math.min(current, cards.length - 1)),
    );
  }, [cards.length]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.max(
        0,
        Math.min(
          Math.round(x / (STUDY_CARD_WIDTH + STUDY_CARD_GAP)),
          cards.length - 1,
        ),
      );
      setActiveIndex((current) => (current === next ? current : next));
    },
    [cards.length],
  );

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled={false}
        style={styles.studyList}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.studyScroll}
        snapToInterval={STUDY_CARD_WIDTH + STUDY_CARD_GAP}
        decelerationRate="fast"
        snapToAlignment="start"
        disableIntervalMomentum={false}
        directionalLockEnabled
        removeClippedSubviews
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {windowedCards.map(({ card, index, shouldRender }) =>
          shouldRender ? (
            <StudyCard
              key={card.id}
              card={card}
              index={index}
              total={cards.length}
              colors={studyCardColors}
              isDark={isDark}
            />
          ) : (
            <View
              key={card.id}
              style={[
                styles.studyCardWrap,
                index < cards.length - 1
                  ? { marginRight: STUDY_CARD_GAP }
                  : null,
              ]}
            />
          ),
        )}
      </ScrollView>

      {cards.length > 1 ? (
        <View style={styles.paginationRow}>
          {paginationCards.map((card, index) => (
            <View
              key={card.id}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === activeIndex
                      ? isDark
                        ? "rgba(0,255,128,0.85)"
                        : "rgba(17,124,92,0.85)"
                      : colors.borderMuted,
                },
              ]}
            />
          ))}
          {cards.length > 10 ? (
            <Text
              style={[styles.paginationMore, { color: colors.textTertiary }]}
            >
              +{cards.length - 10}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

export default function FlashcardDeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = useMemo(
    () =>
      typeof id === "string" ? id : Array.isArray(id) ? (id[0] ?? "") : "",
    [id],
  );
  const userId = useUserStore((s) => s.user?.id);
  const { colors, isDark, statusBarStyle, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const payload = useFlashCardStore((s) =>
    deckId ? s.flashCardById[deckId] : undefined,
  );
  const isLoading = useFlashCardStore((s) => s.isLoading);
  const error = useFlashCardStore((s) => s.error);
  const fetchFlashcardDeckById = useFlashCardStore(
    (s) => s.fetchFlashcardDeckById,
  );
  const cards = useMemo(
    () => sortCards(payload?.flashcards ?? []),
    [payload?.flashcards],
  );
  const deckTitle = payload?.deck.title ?? "Flashcards";
  const deckTopic = payload?.deck.topic ?? "Review this deck";
  const [ready, setReady] = useState(Boolean(payload));

  useEffect(() => {
    if (payload) {
      setReady(true);
    }
  }, [payload]);

  useEffect(() => {
    if (!deckId || !userId) return;
    if (payload) {
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    (async () => {
      await fetchFlashcardDeckById(deckId, userId);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId, fetchFlashcardDeckById, payload, userId]);

  const retry = useCallback(() => {
    if (!deckId || !userId) return;
    setReady(false);
    void fetchFlashcardDeckById(deckId, userId, { force: true }).finally(() =>
      setReady(true),
    );
  }, [deckId, userId, fetchFlashcardDeckById]);

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
          <Text style={[styles.termFront, { color: colors.textPrimary }]}>
            {item.front}
          </Text>
          <View
            style={[styles.rule, { backgroundColor: colors.borderMuted }]}
          />
          <Text style={[styles.termBack, { color: colors.textSecondary }]}>
            {item.back}
          </Text>
        </View>
      </View>
    ),
    [colors],
  );

  const listHeader = useCallback(
    () => (
      <View style={styles.contentPadding}>
        <View
          style={[
            styles.topNav,
            { paddingTop: insets.top + Design.spacing.sm },
          ]}
        >
          <BackButton />
          <Text
            style={[styles.navTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {deckTitle}
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
              <Text
                style={[styles.deckTitle, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {deckTitle}
              </Text>
              <Text
                style={[styles.deckTopic, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {deckTopic}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {cards.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                cards
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                Study
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                mode
              </Text>
            </View>
          </View>
        </View>

        {cards.length > 0 ? (
          <>
            <StudyCarousel cards={cards} colors={colors} isDark={isDark} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              All cards
            </Text>
          </>
        ) : null}
      </View>
    ),
    [cards, colors, deckTitle, deckTopic, insets.top, isDark, theme],
  );

  const renderBody = () => {
    if (!userId) {
      return (
        <View style={[styles.container, { backgroundColor: colors.canvas }]}>
          <StatusBar style={statusBarStyle} />
          <View
            style={[
              styles.topNavStandalone,
              { paddingTop: insets.top + Design.spacing.sm },
            ]}
          >
            <BackButton />
          </View>
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Sign in to study
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
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
          <View
            style={[
              styles.topNavStandalone,
              { paddingTop: insets.top + Design.spacing.sm },
            ]}
          >
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
          <View
            style={[
              styles.topNavStandalone,
              { paddingTop: insets.top + Design.spacing.sm },
            ]}
          >
            <BackButton />
          </View>
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {error}
            </Text>
            <Pressable
              style={[
                styles.retryButton,
                { backgroundColor: colors.ctaPrimaryBg },
              ]}
              onPress={retry}
            >
              <Text style={[styles.retryText, { color: colors.ctaPrimaryFg }]}>
                Retry
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (!payload || !cards.length) {
      return (
        <View style={[styles.container, { backgroundColor: colors.canvas }]}>
          <StatusBar style={statusBarStyle} />
          <View
            style={[
              styles.topNavStandalone,
              { paddingTop: insets.top + Design.spacing.sm },
            ]}
          >
            <BackButton />
          </View>
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No cards in this deck
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Try another deck from your flashcard library.
            </Text>
            <Pressable
              style={[
                styles.retryButton,
                { backgroundColor: colors.ctaPrimaryBg },
              ]}
              onPress={() => router.back()}
            >
              <Text style={[styles.retryText, { color: colors.ctaPrimaryFg }]}>
                Back to decks
              </Text>
            </Pressable>
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
    paddingHorizontal: Design.spacing.mdLg,
    paddingBottom: Design.spacing.md,
  },
  studyList: {
    height: STUDY_CARD_HEIGHT,
  },
  studyCardWrap: {
    width: STUDY_CARD_WIDTH,
    height: STUDY_CARD_HEIGHT,
  },
  studyCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: Design.spacing.mdLg,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  studyCardShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  studyCardShadowLight: {
    shadowColor: "#0A1A14",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  studyCardShadowDark: {
    shadowColor: "#00FF80",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
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
  studyFaceWrap: {
    flex: 1,
    justifyContent: "flex-end",
    position: "relative",
  },
  studyFace: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    backfaceVisibility: "hidden",
  },
  studyFaceBack: {
    // layered face; transform is driven by reanimated
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: Design.spacing.mdLg,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  paginationMore: {
    marginLeft: 4,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
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
