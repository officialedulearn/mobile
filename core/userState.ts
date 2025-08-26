import { User } from "@/interface/User";
import { ActivityService } from "@/services/activity.service";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import { create } from "zustand";

interface UserState {
  user: User | null;
  walletBalance: {sol: number, tokenAccount: number} | null
  setUserAsync: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  updateUserPoints: ({userId, title, type, xpEarned}: {userId: string, title: string, type: "quiz" | "chat" | "streak", xpEarned: number}) => void;
  updateLevel: (
    level: "novice" | "beginner" | "intermediate" | "advanced" | "expert"
  ) => void;
  fetchWalletBalance: () => Promise<void>;
}

const userService = new UserService();
const activityService = new ActivityService();

const calculateAndUpdateStreak = async (user: User, lastSignInAt: string | undefined): Promise<number> => {
  if (!lastSignInAt) {
    // First time login - set streak to 1
    const newStreak = 1;
    await userService.updateUserStreak(user.id, newStreak);
    return newStreak;
  }
  
  try {
    const lastActive = new Date(lastSignInAt);
    const now = new Date();
    
    // Calculate hours difference (same logic as streak component)
    const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    let newStreak: number;
    
    if (hoursDiff > 24) {
      // More than 24 hours - reset streak to 1
      newStreak = 1;
    } else {
      // Within 24 hours - maintain current streak
      newStreak = user.streak || 1;
    }
    
    // Update streak in database
    await userService.updateUserStreak(user.id, newStreak);
    
    // Award streak bonus XP if streak is significant (same logic as streak component)
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
    // On error, maintain current streak or set to 1
    const fallbackStreak = user.streak || 1;
    await userService.updateUserStreak(user.id, fallbackStreak);
    return fallbackStreak;
  }
};

const useUserStore = create<UserState>((set, get) => ({
  user: null,
  walletBalance: {sol: 0, tokenAccount: 0},
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

      // Calculate and update streak based on last sign in
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
      const { balance } = await userService.getUserWalletBalance(currentUser.address as unknown as string);
      set({ walletBalance: {sol: balance.sol, tokenAccount: balance.tokenAccount} });
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
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
}));

export default useUserStore;
