import { getAuthToken, getUserData } from "@/lib/auth-utils";

const CACHE_KEY = "under_construction_status_cache";

let lastErrorLogTime = 0;
const ERROR_LOG_DEBOUNCE_MS = 10000; // Only log errors once per 10 seconds

const shouldLogError = (): boolean => {
  const now = Date.now();
  if (now - lastErrorLogTime > ERROR_LOG_DEBOUNCE_MS) {
    lastErrorLogTime = now;
    return true;
  }
  return false;
};

export const getUnderConstructionStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/site-status", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`API error: HTTP ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error("Failed to parse response JSON");
    }

    if (typeof data.underConstruction !== "boolean") {
      throw new Error("Invalid response: underConstruction field is not a boolean");
    }

    const status = data.underConstruction === true;

    // Cache the result
    localStorage.setItem(CACHE_KEY, String(status));
    return status;
  } catch (error) {
    if (shouldLogError()) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorType = error instanceof Error ? error.name : typeof error;
      console.error(
        `Error fetching under construction status: ${errorMessage} (${errorType})`
      );
    }

    // Fall back to cached value
    const cachedValue = localStorage.getItem(CACHE_KEY);
    return cachedValue === "true" ? true : false;
  }
};

export const setUnderConstructionStatus = async (
  enabled: boolean
): Promise<boolean> => {
  try {
    const userData = getUserData();
    if (!userData) {
      console.error("Not authenticated - cannot update under construction status");
      return false;
    }

    const response = await fetch("/api/admin/site-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ underConstruction: enabled }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const status = data.underConstruction === true;

    // Cache the result
    localStorage.setItem(CACHE_KEY, String(status));
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : typeof error;
    console.error(
      `Error setting under construction status: ${errorMessage} (${errorType})`
    );
    return false;
  }
};
