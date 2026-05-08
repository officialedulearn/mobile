import type { IsoDateString } from "./common.types";
import type { UserLevel } from "./user.types";

export type WeeklyLeaderboardRow = {
  id: string;
  userId: string;
  weekStart: IsoDateString | Date;
  weekEnd: IsoDateString | Date;
  xpEarned: number;
  rank: number | null;
  prizeAwarded: boolean | null;
  createdAt: IsoDateString | Date;
};

/** api leaderboard.service getWeeklyLeaderboard mapped row */
export type WeeklyLeaderboardApiEntry = {
  userId: string;
  xpEarned: number;
  rank: number;
  name: string | null;
  level: UserLevel | string | null;
  profilePictureURL: string | null;
  streak: number | null;
  xp: number;
};

export type MonthlyLeaderboardPreviewParams = {
  year: number;
  month: number;
  mock?: boolean;
  theme?: "light" | "dark";
};
