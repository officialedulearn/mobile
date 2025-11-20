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
    console.log('🌐 Making API request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Request payload:', config.data);
    
    try {
      const unauthenticatedEndpoints = ['/auth/signup'];
      const isUnauthenticatedEndpoint = unauthenticatedEndpoints.some(endpoint => 
        config.url?.includes(endpoint)
      );

      if (isUnauthenticatedEndpoint) {
        console.log('⚠️ Skipping authentication for:', config.url);
        return config;
      }

      const isReviewer = await AsyncStorage.getItem('isReviewer');
      
      if (isReviewer === 'true') {
        const reviewerApiKey = process.env.EXPO_PUBLIC_REVIEWER_API_KEY;
        if (reviewerApiKey) {
          config.headers['x-reviewer-key'] = reviewerApiKey;
          console.log('🔑 Using reviewer API key for authentication');
        } else {
          console.error('❌ EXPO_PUBLIC_REVIEWER_API_KEY not found in environment');
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
          console.log('🔑 Added auth token to request');
        } else {
          console.log('⚠️ No session token available');
        }
      }
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("❌ API Error Response:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error("❌ API Error: No response received (server might be down)");
      console.error("Request details:", {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      });
    } else {
      console.error("❌ API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default httpClient;
