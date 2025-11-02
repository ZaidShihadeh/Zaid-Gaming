// Auth utility functions to handle both localStorage and sessionStorage

export const getAuthToken = (): string | null => {
  try {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");

    // Additional validation - ensure token is not empty string
    if (!token || token.trim() === "") {
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
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
  token: string,
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
    if (keepSignedIn) {
      // Store in localStorage for persistence
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("keepSignedIn", "true");
      // Clear any session data
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user");
    } else {
      // Store in sessionStorage for temporary session
      sessionStorage.setItem("auth_token", token);
      sessionStorage.setItem("user", JSON.stringify(userData));
      // Clear any localStorage data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("keepSignedIn");
    }
  } catch (error) {
    console.error("Error setting auth data:", error);
  }
};

export const clearAuthData = (): void => {
  // Clear from both storages
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  localStorage.removeItem("keepSignedIn");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("user");
};

// Function to ensure auth state is preserved across page loads
export const preserveAuthState = (): void => {
  try {
    // If user selected "keep me signed in", ensure data is in localStorage
    const keepSignedIn = localStorage.getItem("keepSignedIn");
    if (keepSignedIn === "true") {
      const sessionToken = sessionStorage.getItem("auth_token");
      const sessionUser = sessionStorage.getItem("user");

      // Move session data to localStorage for persistence
      if (sessionToken && !localStorage.getItem("auth_token")) {
        localStorage.setItem("auth_token", sessionToken);
        sessionStorage.removeItem("auth_token");
      }

      if (sessionUser && !localStorage.getItem("user")) {
        localStorage.setItem("user", sessionUser);
        sessionStorage.removeItem("user");
      }
    }

    // Additional check: if we have localStorage auth but no keepSignedIn flag, set it
    const localToken = localStorage.getItem("auth_token");
    const localUser = localStorage.getItem("user");
    if (localToken && localUser && !localStorage.getItem("keepSignedIn")) {
      localStorage.setItem("keepSignedIn", "true");
    }
  } catch (error) {
    console.error("Error preserving auth state:", error);
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const userData = getUserData();
  return !!(token && userData);
};

// Test authentication status with server
export const testAuthentication = async (): Promise<{
  success: boolean;
  message: string;
  isAdmin?: boolean;
}> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: "No auth token found" };
    }

    const response = await fetch("/api/auth/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
