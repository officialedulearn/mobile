import { FlashcardsService } from "@/services/flashcards.service";
import type {
    FlashcardDeck,
    FlashcardDeckWithFlashcards,
} from "@/types/flashcards.types";
import { create } from "zustand";

const flashcardsService = new FlashcardsService();

interface FlashCardState {
  flashcardDecks: FlashcardDeck[];
  decksUserId: string | null;
  isLoading: boolean;
  error: string | null;
  flashCardById: Record<string, FlashcardDeckWithFlashcards>;

  fetchFlashcardDecks: (
    userId: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  fetchFlashcardDeckById: (
    deckId: string,
    userId: string,
    options?: { force?: boolean },
  ) => Promise<FlashcardDeckWithFlashcards | undefined>;
  resetState: () => void;
}

const useFlashCardStore = create<FlashCardState>((set, get) => ({
  flashcardDecks: [],
  decksUserId: null,
  isLoading: false,
  error: null,
  flashCardById: {},

  fetchFlashcardDecks: async (
    userId: string,
    options?: { force?: boolean },
  ) => {
    if (!options?.force && get().decksUserId === userId) {
      return;
    }
    try {
      set({ isLoading: true, error: null });
      const flashcardDecks = await flashcardsService.getFlashcardDecks(userId);
      set({ flashcardDecks, decksUserId: userId, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch flashcard decks:", error);
      set({ isLoading: false, error: "Failed to load flashcard decks" });
    }
  },

  fetchFlashcardDeckById: async (deckId, userId, options) => {
    if (!options?.force) {
      const cached = get().flashCardById[deckId];
      if (cached) return cached;
    }
    try {
      set({ isLoading: true, error: null });
      let deck = get().flashcardDecks.find((d) => d.id === deckId);
      if (!deck) {
        await get().fetchFlashcardDecks(userId, { force: true });
        deck = get().flashcardDecks.find((d) => d.id === deckId);
      }
      const flashcards =
        (await flashcardsService.getFlashcards(deckId, userId)) ?? [];
      if (!deck) {
        set({ isLoading: false, error: "Deck not found" });
        return undefined;
      }
      const payload: FlashcardDeckWithFlashcards = { deck, flashcards };
      set((state) => ({
        flashCardById: { ...state.flashCardById, [deckId]: payload },
        isLoading: false,
      }));
      return payload;
    } catch (error) {
      console.error("Failed to fetch flashcard deck by ID:", error);
      set({ isLoading: false, error: "Failed to load flashcards" });
      return undefined;
    }
  },

  resetState: () => {
    set({
      flashcardDecks: [],
      decksUserId: null,
      isLoading: false,
      error: null,
      flashCardById: {},
    });
  },
}));

export default useFlashCardStore;
