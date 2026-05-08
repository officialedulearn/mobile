import { LeaderboardUser, User } from "@/interface/User";
import { BaseService } from "./base.service";

export class UserService extends BaseService {
  async getUser(email: string): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().get(`/auth/email/${email}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().get(`/auth/id/${id}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async checkAvailability(
    email?: string,
    username?: string,
  ): Promise<{
    emailAvailable: boolean;
    usernameAvailable: boolean;
    message?: string;
  }> {
    const response = await this.executeRequest(
      this.getClient().post("/auth/check-availability", { email, username }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().post("/auth/signup", userData),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async editUser(userData: {
    name: string;
    email: string;
    username: string;
    learning?: string;
  }): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().put("/auth/edit", userData),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async uploadProfilePicture(
    imageUri: string,
  ): Promise<{ profilePictureURL: string }> {
    const lower = imageUri.toLowerCase();
    let type = "image/jpeg";
    let name = "photo.jpg";
    if (lower.includes(".png")) {
      type = "image/png";
      name = "photo.png";
    } else if (lower.includes(".webp")) {
      type = "image/webp";
      name = "photo.webp";
    }
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type,
      name,
    } as any);
    const response = await this.executeRequest<{ profilePictureURL: string }>(
      this.getClient().post("/auth/profile-picture/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateUserAddress(email: string, address: string): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().put(`/auth/address?email=${email}&address=${address}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async useReferralCode(code: string): Promise<{ referrer: string }> {
    const response = await this.executeRequest(
      this.getClient().post(`/auth/referral?code=${code}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deductCredits(userId: string): Promise<{ credits: number }> {
    const response = await this.executeRequest(
      this.getClient().put(`/auth/deduct-credits/${userId}`, {}),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async incrementCredits(
    userId: string,
    amount: number,
  ): Promise<{ credits: number }> {
    const response = await this.executeRequest(
      this.getClient().put(`/auth/credits/${userId}`, { credits: amount }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getLeaderboard(): Promise<{ users: LeaderboardUser[] }> {
    const response = await this.executeRequest(
      this.getClient().get("/auth/leaderboard"),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getWeeklyLeaderboard(week?: string): Promise<LeaderboardUser[]> {
    const url = week
      ? `/auth/weekly-leaderboard?week=${encodeURIComponent(week)}`
      : "/auth/weekly-leaderboard";
    const response = await this.executeRequest(this.getClient().get(url));
    if (response.error) throw response.error;
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map((r: any) => ({
      id: r.userId,
      name: r.name || "Unknown",
      xp: r.xpEarned ?? r.xp ?? 0,
      level: r.level || "novice",
      profilePictureURL: r.profilePictureURL,
    }));
  }

  async searchUsers(username: string, limit: number = 10): Promise<User[]> {
    const response = await this.executeRequest<User[]>(
      this.getClient().get(
        `/auth/search?username=${encodeURIComponent(username)}&limit=${limit}`,
      ),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateUserXP(userId: string, xp: number): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().put(`/auth/xp/${userId}`, { xp }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateUserLevel(userId: string, level: string): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().put(`/auth/level/${userId}`, { level }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateUserStreak(userId: string, streak: number): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().put(`/auth/streak/${userId}`, { streak }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getUserWalletBalance(
    pubKey: string,
  ): Promise<{ balance: { sol: number; tokenAccount: number } }> {
    const response = await this.executeRequest(
      this.getClient().get(`/wallet/balance/${pubKey}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async upgradeToPremium(
    userId: string,
  ): Promise<{ message: string; result: any }> {
    const response = await this.executeRequest(
      this.getClient().post(`/wallet/upgrade/${userId}`),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateUserLearning(userData: {
    name: string;
    email: string;
    username: string;
    learning: string;
  }): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().put("/auth/edit", userData),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deleteUser(
    userId: string,
    supabaseUserId: string,
  ): Promise<{ message: string; deletionStarted: boolean }> {
    const response = await this.executeRequest(
      this.getClient().delete(
        `/auth/user/${userId}?supabaseUserId=${supabaseUserId}`,
      ),
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateUserExpoPushToken(
    expoPushToken: string,
    userId: string,
  ): Promise<User> {
    const response = await this.executeRequest<User>(
      this.getClient().put("/auth/expo-push-token", { expoPushToken, userId }),
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
