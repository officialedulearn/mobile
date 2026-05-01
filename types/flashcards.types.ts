import type { IsoDateString } from "./common.types";

export type FlashcardDeck = {
  id: string;
  userId: string;
  title: string;
  topic: string;
  createdAt: IsoDateString | Date;
  updatedAt: IsoDateString | Date | null;
};

export type Flashcard = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  sortOrder: number;
};

export type FlashcardDeckWithFlashcards = {
  deck: FlashcardDeck;
  flashcards: Flashcard[];
};

export type FlashcardDeckResponse = {
  decks: FlashcardDeck[];
};
