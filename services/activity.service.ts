import httpClient from "@/utils/httpClient";

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export class ActivityService {
  async createActivity(data: {
    userId: string;
    type: 'quiz' | 'chat' | 'streak';
    title: string; 
    xpEarned: number;
  }) {
    try { 
      const response = await httpClient.post('/activity', data, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async getActivitiesByUser(userId: string) {
    try {
      const response = await httpClient.get(`/activity/user/${userId}`, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  async getQuizActivitiesByUser(userId: string) {
    try {
      const response = await httpClient.get(`/activity/user/${userId}/quiz`, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz activities:', error);
      throw error;
    }
  }

  async getQuizXpTotal(userId: string) {
    try {
      const response = await httpClient.get(`/activity/user/${userId}/xp/quiz`, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz XP total:', error);
      throw error;
    }
  }

  async getXpByType(userId: string, type: 'quiz' | 'chat' | 'streak') {
    try {
      const response = await httpClient.get(`/activity/user/${userId}/xp?type=${type}`, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} XP:`, error);
      throw error;
    }
  }

  async getUserWithActivities(userId: string) {
    try {
      const response = await httpClient.get(`/activity/user/${userId}/details`, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user with activities:', error);
      throw error;
    }
  }

  async getAllActivities() {
    try {
      const response = await httpClient.get('/activity', {
        headers: {
          'x-api-key': API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all activities:', error);
      throw error;
    }
  }
}