import {
    Flashcard,
    FlashcardDeck,
    FlashcardDeckResponse,
    FlashcardDeckWithFlashcards,
} from "@/types/flashcards.types";
import { BaseService } from "./base.service";

export class FlashcardsService extends BaseService {
  async getFlashcardDecks(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<FlashcardDeck[]> {
    const q = new URLSearchParams({ userId });
    if (options?.limit != null) q.set("limit", String(options.limit));
    if (options?.offset != null) q.set("offset", String(options.offset));

    const response = await this.executeRequest<FlashcardDeckResponse>(
      this.getClient().get(`/ai/flashcards?${q.toString()}`),
    );
    if (response.error) throw response.error;
    return response.data?.decks ?? [];
  }

  async getFlashcards(deckId: string, userId: string): Promise<Flashcard[]> {
    const q = new URLSearchParams({ userId });
    const response = await this.executeRequest<FlashcardDeckWithFlashcards>(
      this.getClient().get(
        `/ai/flashcards/${encodeURIComponent(deckId)}?${q.toString()}`,
      ),
    );
    if (response.error) throw response.error;
    if (!response.data) {
      throw new Error("No flashcard deck data returned");
    }
    const body = response.data as FlashcardDeckWithFlashcards & {
      cards?: Flashcard[];
    };
    const list = body.flashcards ?? body.cards;
    return Array.isArray(list) ? list : [];
  }
}
