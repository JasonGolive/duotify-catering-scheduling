/**
 * API client utilities for standardized fetch calls with error handling
 */

export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface FetchOptions extends RequestInit {
  data?: any;
}

/**
 * Make an API request with standardized error handling
 */
export async function apiClient<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { data, ...fetchOptions } = options;

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    // Parse response body
    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      throw new APIError(
        response.status,
        responseData?.error || response.statusText,
        responseData
      );
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or other errors
    throw new APIError(
      0,
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: "GET" }),
  
  post: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: "POST", data }),
  
  put: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: "PUT", data }),
  
  patch: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: "PATCH", data }),
  
  delete: <T = any>(url: string, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: "DELETE" }),
};
