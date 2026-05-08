import type {
  ReferralLeaderboardResponse,
  ReferralOverviewResponse,
} from "@/interface/referral";
import { BaseService } from "./base.service";

export class ReferralService extends BaseService {
  async getReferralLeaderboard(): Promise<ReferralLeaderboardResponse> {
    const response = await this.executeRequest<ReferralLeaderboardResponse>(
      this.getClient().get("/referral/leaderboard"),
    );

    if (response.error) throw response.error;

    return response.data!;
  }

  async getMyReferralOverview(): Promise<ReferralOverviewResponse> {
    const response = await this.executeRequest<ReferralOverviewResponse>(
      this.getClient().get("/referral/me"),
    );

    if (response.error) throw response.error;

    return response.data!;
  }
}
