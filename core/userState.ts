import { User } from "@/interface/User";
import { ActivityService } from "@/services/activity.service";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import { create } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  user: User | null;
  walletBalance: {sol: number, tokenAccount: number} | null;
  walletBalanceLoading: boolean;
  theme: 'light' | 'dark';
  setUserAsync: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  updateUserPoints: ({userId, title, type, xpEarned}: {userId: string, title: string, type: "quiz" | "chat" | "streak", xpEarned: number}) => void;
  updateLevel: (
    level: "novice" | "beginner" | "intermediate" | "advanced" | "expert"
  ) => void;
  fetchWalletBalance: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  loadTheme: () => Promise<void>;
}

const userService = new UserService();
const activityService = new ActivityService();

const calculateAndUpdateStreak = async (user: User, lastSignInAt: string | undefined): Promise<number> => {
  if (!lastSignInAt) {
    const newStreak = 1;
    await userService.updateUserStreak(user.id, newStreak);
    return newStreak;
  }
  
  try {
    const lastActive = new Date(lastSignInAt);
    const now = new Date();
    
    const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    let newStreak: number;
    
    if (hoursDiff > 24) {
      newStreak = 1;
    } else {
      newStreak = user.streak || 1;
    }
    
    await userService.updateUserStreak(user.id, newStreak);
    
  
    if (newStreak >= 3) {
      await activityService.createActivity({
        userId: user.id, 
        type: "streak", 
        title: `${newStreak}-day XP Streak Bonus`, 
        xpEarned: 5
      });
    }
    
    return newStreak;
  } catch (error) {
    console.error("Error calculating streak:", error);
    const fallbackStreak = user.streak || 1;
    await userService.updateUserStreak(user.id, fallbackStreak);
    return fallbackStreak;
  }
};

const useUserStore = create<UserState>((set, get) => ({
  user: null,
  walletBalance: {sol: 0, tokenAccount: 0},
  walletBalanceLoading: false,
  theme: 'light',
  setUserAsync: async () => {
    if (typeof window === "undefined") return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser || !authUser.email) {
        console.log("No authenticated user found");
        return;
      }
      
      const userFromDB = await userService.getUser(authUser.email);
      
      if (!userFromDB) {
        console.log("User not found in database");
        return;
      }

      const updatedStreak = await calculateAndUpdateStreak(
        userFromDB,
        authUser.last_sign_in_at
      );
      
      set({
        user: {
          id: authUser.id,
          name: userFromDB.name || "User",
          email: authUser.email,
          address: userFromDB.address || null,
          credits: userFromDB.credits || 0,
          xp: userFromDB.xp || 0,
          streak: updatedStreak,
          referralCode: userFromDB.referralCode || "",
          level: userFromDB.level || "beginner",
          referralCount: userFromDB.referralCount || 0,
          username: userFromDB.username || "User",
          referredBy: userFromDB.referredBy || null,
          quizCompleted:  userFromDB.quizCompleted,
          isPremium: userFromDB.isPremium || false,
        },
      });
      
      await get().fetchWalletBalance();
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  },
  
  updateUserPoints: ({type, title, xpEarned}: {type: "quiz" | "streak" | "chat"; title: string; xpEarned: number}) => {
    const currentUser = get().user;
    if (!currentUser || !currentUser.email) return;
    
    set((state) => ({
      user: state.user
        ? { ...state.user, xp: (state.user.xp || 0) + xpEarned }
        : null,
    }));
    
    activityService.createActivity({userId: currentUser?.id as unknown as string, title, type, xpEarned}).catch(error => 
      console.error("Failed to update XP in database:", error)
    );
  },
  
  updateLevel: (
    level: "novice" | "beginner" | "intermediate" | "advanced" | "expert"
  ) => {
    const currentUser = get().user;
    if (!currentUser || !currentUser.email) return;
    
    set((state) => ({
      user: state.user ? { ...state.user, level } : null,
    }));
    
    userService.updateUserLevel(currentUser.email, level).catch(error => 
      console.error("Failed to update level in database:", error)
    );
  },
  
  setUser: (user: User) => {
    set({ user });
  },
  
  fetchWalletBalance: async () => {
    const currentUser = get().user;
    if (!currentUser || !currentUser.id) return;
    
    try {
      set({ walletBalanceLoading: true });
      const { balance } = await userService.getUserWalletBalance(currentUser.address as unknown as string);
      set({ walletBalance: {sol: balance.sol, tokenAccount: balance.tokenAccount} });
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    } finally {
      set({ walletBalanceLoading: false });
    }
  },
  
  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, walletBalance: null });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },

  setTheme: async (theme: 'light' | 'dark') => {
    try {
      await AsyncStorage.setItem('theme', theme);
      set({ theme });
    } catch (error) {
      console.error("Failed to set theme:", error);
    }
  },

  loadTheme: async () => {
    try {
      const theme = await AsyncStorage.getItem('theme');
      if (theme) {
        set({ theme: theme as 'light' | 'dark' });
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  },
}));

export default useUserStore;
