import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { supabase } from "./supabase";

const httpClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

httpClient.interceptors.request.use(
  async (config) => {
    try {
      const unauthenticatedEndpoints = ["/auth/signup"];
      const isUnauthenticatedEndpoint = unauthenticatedEndpoints.some(
        (endpoint) => config.url?.includes(endpoint),
      );

      if (isUnauthenticatedEndpoint) {
        return config;
      }

      const isReviewer = await AsyncStorage.getItem("isReviewer");

      if (isReviewer === "true") {
        const reviewerApiKey = process.env.EXPO_PUBLIC_REVIEWER_API_KEY;
        if (reviewerApiKey) {
          config.headers["x-reviewer-key"] = reviewerApiKey;
        } else {
          console.error(
            "❌ EXPO_PUBLIC_REVIEWER_API_KEY not found in environment",
          );
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        } else {
        }
      }
    } catch (error) {
      console.error("❌ Error in request interceptor:", error);
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default httpClient;
