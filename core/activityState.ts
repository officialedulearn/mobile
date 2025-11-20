import { ActivityService } from "@/services/activity.service";
import { create } from "zustand";

interface Activity {
  id: string;
  userId: string;
  type: 'quiz' | 'chat' | 'streak';
  title: string;
  xpEarned: number;
  createdAt: string;
}

interface ActivityState {
  activities: Activity[];
  quizActivities: Activity[];
  quizXpTotal: number;
  isLoading: boolean;
  error: string | null;
  
  fetchActivities: (userId: string) => Promise<void>;
  fetchQuizActivities: (userId: string) => Promise<void>;
  fetchQuizXpTotal: (userId: string) => Promise<void>;
  
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  
  resetState: () => void;
}

const activityService = new ActivityService();

const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  quizActivities: [],
  quizXpTotal: 0,
  isLoading: false,
  error: null,
  
  fetchActivities: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const activities = await activityService.getActivitiesByUser(userId);

      set({ activities: activities.reverse(), isLoading: false });
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch activities' 
      });
    }
  },
  
  fetchQuizActivities: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const quizActivities = await activityService.getQuizActivitiesByUser(userId);
      set({ quizActivities: quizActivities.reverse(), isLoading: false });
    } catch (error) {
      console.error('Failed to fetch quiz activities:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch quiz activities' 
      });
    }
  },
  
  fetchQuizXpTotal: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { total } = await activityService.getQuizXpTotal(userId);
      set({ quizXpTotal: total || 0, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch quiz XP total:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch quiz XP total' 
      });
    }
  },
  
  addActivity: async (activityData) => {
    try {
      set({ isLoading: true, error: null });
      const newActivity = await activityService.createActivity(activityData);
      
      if (activityData.type === 'quiz') {
        set(state => ({
          quizActivities: [newActivity, ...state.quizActivities],
          quizXpTotal: state.quizXpTotal + activityData.xpEarned
        }));
      }
      
      set(state => ({
        activities: [newActivity, ...state.activities],
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Failed to add activity:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to add activity' 
      });
    }
  },
  
  resetState: () => {
    set({
      activities: [],
      quizActivities: [],
      quizXpTotal: 0,
      isLoading: false,
      error: null
    });
  }
}));

export default useActivityStore;