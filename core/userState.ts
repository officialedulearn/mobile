import { User } from "@/interface/User";
import { ActivityService } from "@/services/activity.service";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import { create } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  user: User | null; 
  isLoading: boolean;
  walletBalance: {sol: number, tokenAccount: number} | null;
  walletBalanceLoading: boolean;
  theme: 'light' | 'dark';
  setUserAsync: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  clearAllUserData: () => Promise<void>;
  updateUserPoints: ({userId, title, type, xpEarned}: {userId: string, title: string, type: "quiz" | "chat" | "streak", xpEarned: number}) => void;
  updateLevel: (
    level: "novice" | "beginner" | "intermediate" | "advanced" | "expert"
  ) => void;
  fetchWalletBalance: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  loadTheme: () => Promise<void>;
  updateUserPointsFromQuiz: (xpEarned: number) => void;
}

const userService = new UserService();
const activityService = new ActivityService();

const calculateAndUpdateStreak = async (user: User, lastLoggedIn: string | Date | undefined): Promise<number> => {
  if (!lastLoggedIn) {
    const newStreak = 1;
    await userService.updateUserStreak(user.id, newStreak);
    return newStreak;
  }
  
  try {
    const lastActive = new Date(lastLoggedIn);
    const now = new Date();
    
    const lastActiveDate = lastActive.toISOString().split('T')[0];
    const todayDate = now.toISOString().split('T')[0];
    
    const lastActiveDateObj = new Date(lastActiveDate);
    const todayDateObj = new Date(todayDate);
    const daysDiff = Math.floor((todayDateObj.getTime() - lastActiveDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    const previousStreak = user.streak || 0;
    let newStreak: number;
    
    if (daysDiff === 0) {
      newStreak = user.streak || 1;
    } else if (daysDiff === 1) {
      newStreak = (user.streak || 0) + 1;
    } else {
      newStreak = 1;
    }
    
    await userService.updateUserStreak(user.id, newStreak);
    
    if (newStreak > previousStreak && newStreak >= 3) {
      await activityService.createActivity({
        userId: user.id, 
        type: "streak", 
        title: `${newStreak}-day XP Streak Bonus`, 
        xpEarned: 1
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
  isLoading: false,
  walletBalance: {sol: 0, tokenAccount: 0},
  walletBalanceLoading: false,
  theme: 'light',
  setUserAsync: async () => {
    set({ isLoading: true });
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Supabase auth error:", error);
        return;
      }
      
      if (!authUser || !authUser.email) {
        console.log("No authenticated user found");
        return;
      }
      
      const userFromDB = await userService.getUser(authUser.email);
      
      if (!userFromDB) {
        console.log("User not found in database");
        return;
      }

      console.log("Loading user data for:", authUser.email);
      console.log("Last logged in from DB:", userFromDB.lastLoggedIn);

      const updatedStreak = await calculateAndUpdateStreak(
        userFromDB,
        userFromDB.lastLoggedIn
      );
      console.log("userFromDB.profilePictureURL:", userFromDB.profilePictureURL);
      const userData = {
        id: userFromDB.id,
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
        quizCompleted: userFromDB.quizCompleted,
        isPremium: userFromDB.isPremium || false,
        profilePictureURL: userFromDB.profilePictureURL || null,
      };
      
      set({ user: userData });

      await get().fetchWalletBalance();
      
      console.log("User data loaded successfully:", userData.email);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      throw error; 
    } finally {
      set({ isLoading: false });
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
  
  updateUserPointsFromQuiz: (xpEarned: number) => {
    const currentUser = get().user;
    if (!currentUser || !currentUser.email) return;
    
    set((state) => ({
      user: state.user ? { ...state.user, xp: (state.user.xp || 0) + xpEarned } : null,
    }));
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
      await AsyncStorage.removeItem('isReviewer');
      set({ user: null, walletBalance: null, isLoading: false, walletBalanceLoading: false });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },

  clearAllUserData: async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove([
        'isReviewer',
        'avatar',
        'lastReviewRequest',
        'theme'
      ]);
      
      set({ 
        user: null, 
        walletBalance: null, 
        isLoading: false, 
        walletBalanceLoading: false,
        theme: 'light' 
      });
    } catch (error) {
      console.error("Clear all user data failed:", error);
      throw error;
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
