// Auth utility functions - tokens now stored in httpOnly cookies (secure, not accessible to JS)
// This file now mainly manages user data for offline access

export const getAuthToken = (): string | null => {
  // Token is now stored in httpOnly cookie (not accessible from JavaScript)
  // Return null since auth is handled via httpOnly cookies
  return null;
};

export const getUserData = (): {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  isAdmin: boolean;
  createdAt: string;
  isBanned: boolean;
} | null => {
  try {
    // Check localStorage first (persistent), then sessionStorage (temporary)
    let userData = localStorage.getItem("user");
    if (!userData) {
      userData = sessionStorage.getItem("user");
    }

    if (!userData) {
      return null;
    }

    const parsed = JSON.parse(userData);
    return parsed;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const setAuthData = (
  _token: string, // Token parameter kept for backwards compatibility, but not used (it's in httpOnly cookie)
  userData: {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
    isAdmin: boolean;
    createdAt: string;
    isBanned: boolean;
  },
  keepSignedIn: boolean = false,
): void => {
  try {
    // Token is now in httpOnly cookie on the server, we only store user info
    // The cookie is automatically sent with each request and server validates it
    if (keepSignedIn) {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("keepSignedIn", "true");
      sessionStorage.removeItem("user");
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
      localStorage.removeItem("user");
      localStorage.removeItem("keepSignedIn");
    }
  } catch (error) {
    console.error("Error setting auth data:", error);
  }
};

export const clearAuthData = (): void => {
  // Clear user data from both storages
  // Token in httpOnly cookie is cleared server-side on logout
  localStorage.removeItem("user");
  localStorage.removeItem("keepSignedIn");
  sessionStorage.removeItem("user");
};

// Function to ensure auth state is preserved across page loads
export const preserveAuthState = (): void => {
  try {
    // If user selected "keep me signed in", ensure user data is in localStorage
    const keepSignedIn = localStorage.getItem("keepSignedIn");
    if (keepSignedIn === "true") {
      const sessionUser = sessionStorage.getItem("user");

      // Move session user data to localStorage for persistence
      if (sessionUser && !localStorage.getItem("user")) {
        localStorage.setItem("user", sessionUser);
        sessionStorage.removeItem("user");
      }
    }

    // Additional check: if we have localStorage user but no keepSignedIn flag, set it
    const localUser = localStorage.getItem("user");
    if (localUser && !localStorage.getItem("keepSignedIn")) {
      localStorage.setItem("keepSignedIn", "true");
    }
  } catch (error) {
    console.error("Error preserving auth state:", error);
  }
};

export const isAuthenticated = (): boolean => {
  // Check if user data exists (token is in httpOnly cookie, checked by server)
  const userData = getUserData();
  return !!userData;
};

// Test authentication status with server
export const testAuthentication = async (): Promise<{
  success: boolean;
  message: string;
  isAdmin?: boolean;
}> => {
  try {
    const response = await fetch("/api/auth/status", {
      credentials: "include", // Include httpOnly cookie
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: "Authentication successful",
      isAdmin: data.user?.isAdmin || false,
    };
  } catch (error) {
    return { success: false, message: `Network error: ${error}` };
  }
};
