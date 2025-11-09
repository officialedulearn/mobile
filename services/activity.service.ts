import httpClient from "@/utils/httpClient";


export class ActivityService {
  async createActivity(data: {
    userId: string;
    type: 'quiz' | 'chat' | 'streak';
    title: string; 
    xpEarned: number;
  }) {
    try { 
      const response = await httpClient.post('/activity', data);
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async submitQuiz(data: {
    userId: string;
    chatId?: string;
    title: string;
    answers: Array<{
      question: string;
      selectedAnswer: string;
      correctAnswer: string;
    }>;
  }) {
    try {
      const response = await httpClient.post('/activity/submit-quiz', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  async getActivitiesByUser(userId: string) {
    try {
      const response = await httpClient.get(`/activity/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  async getQuizActivitiesByUser(userId: string) {
    try {
      const response = await httpClient.get(`/activity/user/${userId}/quiz`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz activities:', error);
      throw error;
    }
  }

  async getQuizXpTotal(userId: string) {
    try {
      const response = await httpClient.get(`/activity/user/${userId}/xp/quiz`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz XP total:', error);
      throw error;
    }
  }

  async getXpByType(userId: string, type: 'quiz' | 'chat' | 'streak') {
    try {
      const response = await httpClient.get(`/activity/user/${userId}/xp?type=${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} XP:`, error);
      throw error;
    }
  }

  async getUserWithActivities(userId: string) {
    try {
      const response = await httpClient.get(`/activity/user/${userId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user with activities:', error);
      throw error;
    }
  }

  async getAllActivities() {
    try {
      const response = await httpClient.get('/activity');
      return response.data;
    } catch (error) {
      console.error('Error fetching all activities:', error);
      throw error;
    }
  }
}