import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import useFlashCardStore from "@/core/flashCardState";
import useUserStore from "@/core/userState";
import type { Flashcard } from "@/types/flashcards.types";

const CARD_WIDTH = 268;
const CARD_GAP = 12;

type FaceProps = {
  card: Flashcard;
  theme: "light" | "dark";
};

function ChatFlashcardFace({ card, theme }: FaceProps) {
  const isDark = theme === "dark";
  const gradient = isDark
    ? (["#1E2A24", "#131A18", "#0D1210"] as const)
    : (["#F4FAF7", "#E8F5EE", "#DFF0E8"] as const);

  return (
    <View style={styles.cardWrap}>
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isDark && styles.cardRing]}
      >
        <Text style={[styles.frontText, isDark && styles.textPrimaryDark]}>
          {card.front}
        </Text>
        <View style={[styles.rule, isDark && styles.ruleDark]} />
        <Text style={[styles.backText, isDark && styles.textSecondaryDark]}>
          {card.back}
        </Text>
      </LinearGradient>
    </View>
  );
}

type Props = { deckId: string };

export default function ChatFlashcardDeck({ deckId }: Props) {
  const theme = useUserStore((s) => s.theme);
  const user = useUserStore((s) => s.user);
  const payload = useFlashCardStore((s) => s.flashCardById[deckId]);
  const fetchFlashcardDeckById = useFlashCardStore(
    (s) => s.fetchFlashcardDeckById,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const cached = useFlashCardStore.getState().flashCardById[deckId];
    if (cached) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await fetchFlashcardDeckById(deckId, user.id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId, user?.id, fetchFlashcardDeckById]);

  if (!user?.id) {
    return null;
  }

  if (loading && !payload) {
    return (
      <View
        style={[styles.loader, theme === "dark" && styles.loaderDark]}
      >
        <ActivityIndicator
          size="small"
          color={theme === "dark" ? "#00FF80" : "#2D3C52"}
        />
      </View>
    );
  }

  const cards = payload?.flashcards;
  if (!payload || !cards?.length) {
    return null;
  }

  const sorted = [...cards].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <View style={styles.block}>
      <Text
        style={[styles.blockTitle, theme === "dark" && styles.textPrimaryDark]}
        numberOfLines={1}
      >
        {payload.deck.title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
      >
        {sorted.map((card) => (
          <ChatFlashcardFace key={card.id} card={card} theme={theme} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginVertical: 8,
  },
  blockTitle: {
    fontFamily: "Satoshi-Bold",
    fontSize: 15,
    color: "#2D3C52",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  scroll: {
    paddingVertical: 4,
    paddingRight: 16,
    flexDirection: "row",
  },
  cardWrap: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    minHeight: 168,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,128,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardRing: {
    borderColor: "rgba(0,255,128,0.2)",
  },
  frontText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Satoshi-Bold",
    color: "#1A2433",
  },
  backText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Urbanist",
    color: "#3D4F66",
  },
  rule: {
    height: 1,
    backgroundColor: "rgba(45,60,82,0.12)",
    marginVertical: 12,
  },
  ruleDark: {
    backgroundColor: "rgba(224,224,224,0.12)",
  },
  textPrimaryDark: {
    color: "#E8F5EE",
  },
  textSecondaryDark: {
    color: "#B8D4C8",
  },
  loader: {
    minHeight: 72,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    backgroundColor: "#F6FAF8",
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  loaderDark: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2E3033",
  },
});
