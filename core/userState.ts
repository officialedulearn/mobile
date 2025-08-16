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

const calculateStreak = async (email: string, lastLoggedIn: string | undefined): Promise<number> => {

  if (!lastLoggedIn) return 1;
  
  try {
    const lastDate = new Date(lastLoggedIn);
    const today = new Date();
    
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 && 
        today.getDate() === lastDate.getDate() && 
        today.getMonth() === lastDate.getMonth() && 
        today.getFullYear() === lastDate.getFullYear()) {
      const userData = await userService.getUser(email);
      return userData.streak || 1;
    }
    
    if (diffDays === 1 || 
        (diffDays === 0 && today.getDate() > lastDate.getDate())) {
      const userData = await userService.getUser(email);
      return (userData.streak || 0) + 1;
    }
    if (diffDays > 1) {
      return 1;
    }
    
    const userData = await userService.getUser(email);

    if(userData.streak && userData.streak > 3) {
      await activityService.createActivity({userId: userData.id, type: "streak", title: `${userData.streak}-day XP Streak Bonus`, xpEarned: 5})
    }

    return userData.streak || 1;
  } catch (error) {
    console.error("Error calculating streak:", error);
    return 1; 
  }
};

const useUserStore = create<UserState>((set, get) => ({
  user: null,
  walletBalance: {sol: 0, tokenAccount: 0},
  setUserAsync: async () => {
    if (typeof window === "undefined") return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        console.log("No authenticated user found");
        return;
      }
      
      const userFromDB = await userService.getUser(user.email);
      
      if (!userFromDB) {
        console.log("User not found in database");
        return;
      }

      const updatedStreak = await calculateStreak(
        user.email,
        user.last_sign_in_at
      );
      
      await userService.updateUserStreak(user.email, updatedStreak);
      
      set({
        user: {
          id: user.id,
          name: userFromDB.name || "User",
          email: user.email,
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
