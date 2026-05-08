import httpClient from "@/utils/httpClient";
import { AxiosError, AxiosResponse } from "axios";

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  originalError?: AxiosError;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  isSuccess: boolean;
}

export class BaseService {
  protected handleError(error: any): ApiError {
    if (error instanceof AxiosError) {
      return {
        status: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Unknown error",
        code: error.code,
        originalError: error,
      };
    }

    return {
      status: 500,
      message: error?.message || "An unexpected error occurred",
      originalError: error,
    };
  }

  protected async executeRequest<T>(
    request: Promise<AxiosResponse<T>>,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await request;
      return {
        data: response.data,
        isSuccess: true,
      };
    } catch (error) {
      return {
        error: this.handleError(error),
        isSuccess: false,
      };
    }
  }

  protected getClient() {
    return httpClient;
  }
}
