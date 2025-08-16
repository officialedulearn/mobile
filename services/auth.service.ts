import { User } from "@/interface/User";
import httpClient from "@/utils/httpClient";

const API_KEY = process.env.EXPO_PUBLIC_API_KEY

export class UserService {
    async getUser(email: string): Promise<User> {
        try {
            const response = await httpClient.get(`/auth/email/${email}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user:", error);
            throw error;
        }
    }

    async getUserById(id: string): Promise<User> {
        try {
            const response = await httpClient.get(`/auth/id/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user by ID:", error);
            throw error;
        }
    }

    async createUser(userData: Partial<User>): Promise<User> {
        try {
            const response = await httpClient.post('/auth/signup', userData);
            return response.data;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    }

    async editUser(userData: { name: string; email: string }): Promise<User> {
        try {
            const response = await httpClient.put('/auth/edit', userData, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error editing user:", error);
            throw error;
        }
    }

    async updateUserAddress(email: string, address: string): Promise<User> {
        try {
            const response = await httpClient.put(`/auth/address?email=${email}&address=${address}`);
            return response.data;
        } catch (error) {
            console.error("Error updating user address:", error);
            throw error;
        }
    }

    async useReferralCode(code: string): Promise<{ referrer: string }> {
        try {
            const response = await httpClient.post(`/auth/referral?code=${code}`);
            return response.data;
        } catch (error) {
            console.error("Error using referral code:", error);
            throw error;
        }
    }

    async deductCredits(userId: string): Promise<{ credits: number }> {
        try {
            const response = await httpClient.put(`/auth/deduct-credits/${userId}`, {}, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error deducting credits:", error);
            throw error;
        }
    }

    async incrementCredits(userId: string, amount: number): Promise<{ credits: number }> {
        try {
            const response = await httpClient.put(`/auth/credits/${userId}`, { 
                credits: amount 
            }, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error incrementing credits:", error);
            throw error;
        }
    }
    
    async getLeaderboard(): Promise<{ users: User[] }> {
        try {
            const response = await httpClient.get('/auth/leaderboard');
            return response.data;
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            throw error;
        }
    }

    async searchUsers(username: string, limit: number = 10): Promise<User[]> {
        try {
            const response = await httpClient.get(`/auth/search?username=${encodeURIComponent(username)}&limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error("Error searching users:", error);
            throw error;
        }
    }

    async updateUserXP(userId: string, xp: number): Promise<User> {
        try {
            const response = await httpClient.put(`/auth/xp/${userId}`, { xp }, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error updating user XP:", error);
            throw error;
        }
    }

    async updateUserLevel(userId: string, level: string): Promise<User> {
        try {
            const response = await httpClient.put(`/auth/level/${userId}`, {
                level
            }, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error updating user level:", error);
            throw error;
        }
    }

    async updateUserStreak(userId: string, streak: number): Promise<User> {
        try {
            const response = await httpClient.put(`/auth/streak/${userId}`, {
                streak
            }, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error updating user streak:", error);
            throw error;
        }
    }

    async getUserWalletBalance(pubKey: string): Promise<{ balance: {sol: number, tokenAccount: number} }> {
        try {
            const response = await httpClient.get(`/wallet/balance/${pubKey}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user wallet balance:", error);
            throw error;
        }
    }

    async upgradeToPremium(userId: string): Promise<{ message: string, result: any }> {
        try {
            const response = await httpClient.post(`/wallet/upgrade/${userId}`);
            return response.data;
        } catch (error) {
            console.error("Error upgrading to premium:", error);
            throw error;
        }
    }
}