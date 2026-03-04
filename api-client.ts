// Token is now stored in httpOnly cookie (not accessible from JavaScript)
// API requests automatically include cookies with credentials: "include"

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public data: ApiErrorResponse,
  ) {
    super(data.message || `API error: ${statusCode}`);
    this.name = "ApiError";
  }
}

/**
 * Make an authenticated API request with proper error handling
 */
export async function apiCall<T extends ApiResponse = ApiResponse>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Token is now in httpOnly cookie, automatically sent by browser
  // No need to manually add Authorization header

  // Set content-type for POST/PUT requests
  if (
    (options.method === "POST" || options.method === "PUT") &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: "include", // Include cookies in requests
    });

    // Parse response
    let data: any;
    const contentType = response.headers.get("Content-Type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData: ApiErrorResponse = {
        success: false,
        message:
          typeof data === "object" && data?.message
            ? data.message
            : `HTTP ${response.status}: ${response.statusText}`,
      };

      if (typeof data === "object" && data?.errors) {
        errorData.errors = data.errors;
      }

      throw new ApiError(response.status, errorData);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiError(0, {
        success: false,
        message: "Network error. Please check your connection.",
      });
    }

    throw new ApiError(500, {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Helper for GET requests
 */
export function apiGet<T extends ApiResponse>(
  endpoint: string,
  options?: Omit<RequestInit, "method">,
) {
  return apiCall<T>(endpoint, { ...options, method: "GET" });
}

/**
 * Helper for POST requests
 */
export function apiPost<T extends ApiResponse>(
  endpoint: string,
  body?: any,
  options?: Omit<RequestInit, "method" | "body">,
) {
  return apiCall<T>(endpoint, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PUT requests
 */
export function apiPut<T extends ApiResponse>(
  endpoint: string,
  body?: any,
  options?: Omit<RequestInit, "method" | "body">,
) {
  return apiCall<T>(endpoint, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}
