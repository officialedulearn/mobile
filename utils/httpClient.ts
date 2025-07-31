import axios from 'axios';

const httpClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, 
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error Response:", {
        data: error.response.data,
        status: error.response.status,
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
