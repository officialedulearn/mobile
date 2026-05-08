import { ActivityService } from "@/services/activity.service";
import type {
  ActivityPagination,
  CreateActivityRequest,
  XpActivity,
} from "@/types/activity.types";
import { create } from "zustand";

interface Activity {
  id: string;
  userId: string;
  type: "quiz" | "chat" | "streak";
  title: string;
  xpEarned: number;
  createdAt: string | Date;
}

interface FetchActivitiesOptions {
  page?: number;
  limit?: number;
  append?: boolean;
}

interface ActivityState {
  activities: Activity[];
  quizActivities: Activity[];
  activityPagination: ActivityPagination | null;
  quizXpTotal: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  fetchActivities: (
    userId: string,
    options?: FetchActivitiesOptions,
  ) => Promise<void>;
  fetchNextActivitiesPage: (userId: string) => Promise<void>;
  fetchQuizActivities: (userId: string) => Promise<void>;
  fetchQuizXpTotal: (userId: string) => Promise<void>;

  addActivity: (activity: CreateActivityRequest) => Promise<void>;

  resetState: () => void;
}

const activityService = new ActivityService();
const DEFAULT_ACTIVITY_LIMIT = 10;

const normalizeActivity = (activity: XpActivity): Activity => ({
  ...activity,
  title: activity.title ?? "",
});

const mergeActivitiesById = (
  existingActivities: Activity[],
  incomingActivities: Activity[],
) => {
  const merged = [...existingActivities];
  const seenIds = new Set(existingActivities.map((activity) => activity.id));

  for (const activity of incomingActivities) {
    if (!seenIds.has(activity.id)) {
      merged.push(activity);
      seenIds.add(activity.id);
    }
  }

  return merged;
};

const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  quizActivities: [],
  activityPagination: null,
  quizXpTotal: 0,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  fetchActivities: async (
    userId: string,
    options: FetchActivitiesOptions = {},
  ) => {
    const page = options.page ?? 1;
    const limit =
      options.limit ??
      get().activityPagination?.limit ??
      DEFAULT_ACTIVITY_LIMIT;
    const append = options.append ?? page > 1;

    try {
      set({
        isLoading: !append,
        isLoadingMore: append,
        error: null,
      });

      const response = await activityService.getActivitiesByUser(userId, {
        page,
        limit,
      });
      const incomingActivities = response.data.map(normalizeActivity);

      set((state) => ({
        activities: append
          ? mergeActivitiesById(state.activities, incomingActivities)
          : incomingActivities,
        activityPagination: response.pagination,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        isLoadingMore: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch activities",
      });
    }
  },

  fetchNextActivitiesPage: async (userId: string) => {
    const { activityPagination, isLoading, isLoadingMore } = get();

    if (!activityPagination?.hasNextPage || isLoading || isLoadingMore) {
      return;
    }

    await get().fetchActivities(userId, {
      page: activityPagination.page + 1,
      limit: activityPagination.limit,
      append: true,
    });
  },

  fetchQuizActivities: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const quizActivities =
        await activityService.getQuizActivitiesByUser(userId);
      set({
        quizActivities: quizActivities.reverse().map(normalizeActivity),
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch quiz activities",
      });
    }
  },

  fetchQuizXpTotal: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await activityService.getQuizXpTotal(userId);
      const totalXp = Number(
        (result as { totalXp?: number | string })?.totalXp ??
          (result as { total?: number | string })?.total ??
          0,
      );
      set({
        quizXpTotal: Number.isFinite(totalXp) ? totalXp : 0,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch quiz XP total",
      });
    }
  },

  addActivity: async (activityData) => {
    try {
      set({ isLoading: true, error: null });
      const newActivity = normalizeActivity(
        await activityService.createActivity(activityData),
      );

      if (activityData.type === "quiz") {
        set((state) => ({
          quizActivities: [newActivity, ...state.quizActivities],
          quizXpTotal: state.quizXpTotal + activityData.xpEarned,
        }));
      }

      set((state) => {
        const nextTotal = state.activityPagination
          ? state.activityPagination.total + 1
          : null;
        const nextTotalPages =
          state.activityPagination && nextTotal !== null
            ? Math.ceil(nextTotal / state.activityPagination.limit)
            : null;

        return {
          activities: [newActivity, ...state.activities],
          activityPagination: state.activityPagination
            ? {
                ...state.activityPagination,
                total: nextTotal as number,
                totalPages: nextTotalPages as number,
                hasNextPage:
                  state.activityPagination.page < (nextTotalPages as number),
              }
            : null,
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to add activity",
      });
    }
  },

  resetState: () => {
    set({
      activities: [],
      quizActivities: [],
      activityPagination: null,
      quizXpTotal: 0,
      isLoading: false,
      isLoadingMore: false,
      error: null,
    });
  },
}));

export default useActivityStore;
