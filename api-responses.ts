/**
 * Standard API Response Types
 *
 * All API endpoints should follow this structure for consistency and predictability.
 */

/**
 * Base response format - all responses should have success and message
 */
export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

/**
 * Error response with validation errors
 */
export interface ErrorResponse extends BaseApiResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Success response - generic for endpoints that return data
 */
export interface SuccessResponse<T = any> extends BaseApiResponse {
  success: true;
  data?: T;
  [key: string]: any; // Allow additional fields for backwards compatibility
}

/**
 * Pagination info for list endpoints
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * List response
 */
export interface ListResponse<T> extends SuccessResponse<T[]> {
  items: T[];
  pagination?: PaginationInfo;
}

/**
 * Auth response (login/signup/status)
 */
export interface AuthApiResponse extends BaseApiResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    [key: string]: any;
  };
  token?: string;
  kickReason?: string;
}

/**
 * Health check response
 */
export interface HealthResponse extends BaseApiResponse {
  success: true;
  status: "ok" | "error";
  time: string;
}

/**
 * Standard format for error handling in catch blocks
 */
export interface ApiErrorInfo {
  statusCode: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
