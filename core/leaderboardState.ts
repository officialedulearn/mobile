import { LeaderboardUser, User } from "@/interface/User";
import { UserService } from "@/services/auth.service";
import { create } from "zustand";

interface FetchLeaderboardOptions {
  force?: boolean;
}

interface SyncCachedUserOptions {
  includeAllTimeXp?: boolean;
  includeWeeklyXp?: boolean;
  weeklyXp?: number;
}

interface LeaderboardState {
  allTimeUsers: LeaderboardUser[];
  weeklyUsers: LeaderboardUser[];
  isAllTimeLoading: boolean;
  isWeeklyLoading: boolean;
  allTimeError: string | null;
  weeklyError: string | null;
  allTimeFetchedAt: number | null;
  weeklyFetchedAt: number | null;
  weeklyCacheKey: string | null;

  fetchAllTimeLeaderboard: (options?: FetchLeaderboardOptions) => Promise<void>;
  fetchWeeklyLeaderboard: (options?: FetchLeaderboardOptions) => Promise<void>;
  refreshAllTimeLeaderboard: () => Promise<void>;
  refreshWeeklyLeaderboard: () => Promise<void>;
  syncCachedUser: (
    user: Partial<User> & Pick<User, "id">,
    options?: SyncCachedUserOptions,
  ) => void;
  resetState: () => void;
}

const userService = new UserService();

const sortByXpDesc = (users: LeaderboardUser[]) =>
  [...users].sort((left, right) => (right.xp ?? 0) - (left.xp ?? 0));

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentWeeklyCacheKey = () => {
  const now = new Date();
  const startOfWeek = new Date(now);

  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());

  return toLocalDateKey(startOfWeek);
};

const updateCachedUserList = ({
  users,
  user,
  includeXp = false,
  xpOverride,
}: {
  users: LeaderboardUser[];
  user: Partial<User> & Pick<User, "id">;
  includeXp?: boolean;
  xpOverride?: number;
}) => {
  let wasUpdated = false;

  const nextUsers = users.map((entry) => {
    if (entry.id !== user.id) {
      return entry;
    }

    wasUpdated = true;

    return {
      ...entry,
      ...(user.name !== undefined ? { name: user.name } : {}),
      ...(user.level !== undefined ? { level: user.level } : {}),
      ...(user.profilePictureURL !== undefined
        ? { profilePictureURL: user.profilePictureURL }
        : {}),
      ...(includeXp ? { xp: xpOverride ?? user.xp ?? entry.xp } : {}),
    };
  });

  if (!wasUpdated) {
    return users;
  }

  return includeXp ? sortByXpDesc(nextUsers) : nextUsers;
};

const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  allTimeUsers: [],
  weeklyUsers: [],
  isAllTimeLoading: false,
  isWeeklyLoading: false,
  allTimeError: null,
  weeklyError: null,
  allTimeFetchedAt: null,
  weeklyFetchedAt: null,
  weeklyCacheKey: null,

  fetchAllTimeLeaderboard: async ({ force = false } = {}) => {
    const { allTimeUsers, isAllTimeLoading } = get();

    if (!force && allTimeUsers.length > 0) {
      return;
    }

    if (isAllTimeLoading) {
      return;
    }

    try {
      set({ isAllTimeLoading: true, allTimeError: null });
      const response = await userService.getLeaderboard();
      set({
        allTimeUsers: sortByXpDesc(response.users ?? []),
        isAllTimeLoading: false,
        allTimeError: null,
        allTimeFetchedAt: Date.now(),
      });
    } catch (error) {
      set({
        isAllTimeLoading: false,
        allTimeError:
          error instanceof Error
            ? error.message
            : "Failed to load leaderboard data",
      });
    }
  },

  fetchWeeklyLeaderboard: async ({ force = false } = {}) => {
    const currentWeekKey = getCurrentWeeklyCacheKey();
    const { weeklyUsers, weeklyCacheKey, isWeeklyLoading } = get();
    const hasCurrentWeekCache =
      weeklyUsers.length > 0 && weeklyCacheKey === currentWeekKey;

    if (!force && hasCurrentWeekCache) {
      return;
    }

    if (isWeeklyLoading) {
      return;
    }

    try {
      set({ isWeeklyLoading: true, weeklyError: null });
      const leaderboard = await userService.getWeeklyLeaderboard();
      set({
        weeklyUsers: sortByXpDesc(leaderboard),
        isWeeklyLoading: false,
        weeklyError: null,
        weeklyFetchedAt: Date.now(),
        weeklyCacheKey: currentWeekKey,
      });
    } catch (error) {
      set({
        isWeeklyLoading: false,
        weeklyError:
          error instanceof Error
            ? error.message
            : "Failed to load weekly leaderboard",
      });
    }
  },

  refreshAllTimeLeaderboard: async () => {
    await get().fetchAllTimeLeaderboard({ force: true });
  },

  refreshWeeklyLeaderboard: async () => {
    await get().fetchWeeklyLeaderboard({ force: true });
  },

  syncCachedUser: (
    user,
    { includeAllTimeXp = false, includeWeeklyXp = false, weeklyXp } = {},
  ) => {
    set((state) => ({
      allTimeUsers: updateCachedUserList({
        users: state.allTimeUsers,
        user,
        includeXp: includeAllTimeXp,
      }),
      weeklyUsers: updateCachedUserList({
        users: state.weeklyUsers,
        user,
        includeXp: includeWeeklyXp,
        xpOverride: weeklyXp,
      }),
    }));
  },

  resetState: () => {
    set({
      allTimeUsers: [],
      weeklyUsers: [],
      isAllTimeLoading: false,
      isWeeklyLoading: false,
      allTimeError: null,
      weeklyError: null,
      allTimeFetchedAt: null,
      weeklyFetchedAt: null,
      weeklyCacheKey: null,
    });
  },
}));

export default useLeaderboardStore;
