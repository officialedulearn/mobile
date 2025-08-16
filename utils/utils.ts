import { ActivityService } from "@/services/activity.service";
import { UserService } from "@/services/auth.service";
import { RewardsService } from "@/services/rewards.service";

const rewardsService = new RewardsService();
const activityService = new ActivityService();
const userService = new UserService();

const getUserMetrics = async (
  userId: string
): Promise<{ quizCompleted: number; nfts: number; xp: number }> => {
  try {
    const quizCompleted = await activityService.getQuizActivitiesByUser(userId);
    const nfts = await rewardsService.getUserCertificateCount(userId);
    const xp = await userService
      .getUserById(userId)
      .then((user) => user.xp || 0);

    return {
      quizCompleted: quizCompleted.length,
      nfts: nfts,
      xp: xp,
    };
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    throw error;
  }
};

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the provided function
 */
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export { getUserMetrics, debounce };
