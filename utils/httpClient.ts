import axios from 'axios';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const httpClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, 
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

httpClient.interceptors.request.use(
  async (config) => {
    try {
      const isReviewer = await AsyncStorage.getItem('isReviewer');
      
      if (isReviewer === 'true') {
        const reviewerApiKey = process.env.EXPO_PUBLIC_REVIEWER_API_KEY;
        if (reviewerApiKey) {
          config.headers['x-reviewer-key'] = reviewerApiKey;
          console.log('Using reviewer API key for authentication');
        } else {
          console.error('EXPO_PUBLIC_REVIEWER_API_KEY not found in environment');
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error Response:", {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
        status: error.response.status,
        headers: error.config?.headers,
      });
    } else if (error.request) {
      console.error("API Error: No response received", error.request);
    } else {
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default httpClient;
