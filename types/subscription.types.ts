import type { IsoDateString } from './common.types';

export type StreakShieldPurchaseResponse = {
  success: boolean;
  expiresAt: IsoDateString | Date;
};

export type QuizRefreshPurchaseResponse = {
  success: boolean;
  newLimit: number;
};
