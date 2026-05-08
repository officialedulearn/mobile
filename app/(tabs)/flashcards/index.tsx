import { ScreenContainer } from "@/components/common/ScreenContainer";
import useFlashCardStore from "@/core/flashCardState";
import useUserStore from "@/core/userState";
import { useTheme } from "@/hooks/useTheme";
import type { FlashcardDeck } from "@/types/flashcards.types";
import {
  Design,
  iconCaretRight,
  iconClock,
  iconNotebook,
} from "@/utils/design";
import { LegendList } from "@legendapp/list";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

const formatDate = (value: FlashcardDeck["createdAt"]) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function FlashcardsScreen() {
  const userId = useUserStore((s) => s.user?.id);
  const { colors, isDark, statusBarStyle, theme } = useTheme();
  const { flashcardDecks, isLoading, error, fetchFlashcardDecks } =
    useFlashCardStore();
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      await fetchFlashcardDecks(userId);
      if (!cancelled) setHasLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, fetchFlashcardDecks]);

  const sortedDecks = useMemo(
    () =>
      [...flashcardDecks].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [flashcardDecks],
  );

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await fetchFlashcardDecks(userId, { force: true });
    } finally {
      setRefreshing(false);
      setHasLoaded(true);
    }
  }, [userId, fetchFlashcardDecks]);

  const openDeck = useCallback((deckId: string) => {
    router.push({
      pathname: "/flashcards/[id]",
      params: { id: deckId },
    } as never);
  }, []);

  const renderDeck = useCallback(
    ({ item, index }: { item: FlashcardDeck; index: number }) => (
      <Pressable
        onPress={() => openDeck(item.id)}
        style={({ pressed }) => [
          styles.deckRow,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderMuted,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
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

        <View style={styles.deckContent}>
          <View style={styles.deckTitleRow}>
            <Text
              style={[styles.deckTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.title || "Untitled deck"}
            </Text>
            <Text style={[styles.deckNumber, { color: colors.textTertiary }]}>
              {(index + 1).toString().padStart(2, "0")}
            </Text>
          </View>
          <Text
            style={[styles.deckTopic, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.topic || "AI generated study cards"}
          </Text>
          <View style={styles.metaRow}>
            <Image source={iconClock(theme)} style={styles.metaIcon} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Created {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <Image source={iconCaretRight(theme)} style={styles.chevron} />
      </Pressable>
    ),
    [colors, isDark, openDeck, theme],
  );

  const listHeader = useCallback(
    () => (
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={isDark ? ["#1E2A24", "#131A18"] : ["#F4FAF7", "#E8F5EE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.hero,
            {
              borderColor: isDark ? "rgba(0,255,128,0.18)" : "#DFF0E8",
            },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text
              style={[
                styles.eyebrow,
                { color: isDark ? "#B8D4C8" : "#61728C" },
              ]}
            >
              Study Library
            </Text>
            <Text style={[styles.header, { color: colors.textPrimary }]}>
              Flashcards
            </Text>
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
              Review every deck created from your AI learning sessions.
            </Text>
          </View>
          <View style={[styles.heroBadge, isDark && styles.heroBadgeDark]}>
            <Text
              style={[styles.heroBadgeValue, { color: colors.textPrimary }]}
            >
              {sortedDecks.length}
            </Text>
            <Text
              style={[styles.heroBadgeLabel, { color: colors.textSecondary }]}
            >
              decks
            </Text>
          </View>
        </LinearGradient>

        {error ? (
          <Text
            style={[styles.errorText, { color: Design.colors.semantic.error }]}
          >
            {error}
          </Text>
        ) : null}
      </View>
    ),
    [colors, error, isDark, sortedDecks.length],
  );

  const listEmpty = useCallback(() => {
    if (!userId) {
      return (
        <View style={styles.centerBlock}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Sign in to study
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Your flashcard decks will appear here once you are signed in.
          </Text>
        </View>
      );
    }

    if (isLoading && !hasLoaded) {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator color={colors.refreshTint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading flashcards...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerBlock}>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          No decks yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Generate flashcards from an AI chat and they will collect here.
        </Text>
      </View>
    );
  }, [colors, hasLoaded, isLoading, userId]);

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <ScreenContainer scrollable={false}>
        <LegendList
          data={sortedDecks}
          estimatedItemSize={120}
          keyExtractor={(item) => item.id}
          renderItem={renderDeck}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.refreshTint}
            />
          }
        />
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: Design.spacing.xl,
  },
  headerWrap: {
    paddingHorizontal: Design.spacing.mdLg,
    paddingBottom: Design.spacing.md,
  },
  hero: {
    minHeight: 164,
    borderRadius: 18,
    borderWidth: 1,
    padding: Design.spacing.mdLg,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Design.spacing.md,
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
    lineHeight: Design.typography.lineHeight.xs,
    marginBottom: Design.spacing.xs,
  },
  header: {
    fontSize: Design.typography.fontSize["2xl"],
    lineHeight: Design.typography.lineHeight["2xl"],
    fontFamily: Design.typography.fontFamily.satoshi.bold,
    fontWeight: Design.typography.fontWeight.bold,
  },
  subtext: {
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    marginTop: Design.spacing.sm,
  },
  heroBadge: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  heroBadgeDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroBadgeValue: {
    fontFamily: Design.typography.fontFamily.satoshi.bold,
    fontSize: Design.typography.fontSize.xl,
    lineHeight: Design.typography.lineHeight.xl,
  },
  heroBadgeLabel: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.xs,
  },
  deckRow: {
    marginHorizontal: Design.spacing.mdLg,
    marginBottom: Design.spacing.sm,
    padding: Design.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Design.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 1,
  },
  deckIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deckIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  deckContent: {
    flex: 1,
    gap: Design.spacing.xs,
  },
  deckTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Design.spacing.sm,
  },
  deckTitle: {
    flex: 1,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    lineHeight: Design.typography.lineHeight.base,
    fontWeight: Design.typography.fontWeight.semibold,
  },
  deckNumber: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.xs,
  },
  deckTopic: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Design.spacing.xs,
  },
  metaIcon: {
    width: 15,
    height: 15,
    resizeMode: "contain",
  },
  metaText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.xs,
  },
  chevron: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  centerBlock: {
    minHeight: 280,
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
  errorText: {
    marginTop: Design.spacing.md,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
  },
});
