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
export { getUserMetrics };
