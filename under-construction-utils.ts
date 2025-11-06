import { supabase } from "@/supabase";

const SETTINGS_TABLE = "app_settings";
const UNDER_CONSTRUCTION_KEY = "under_construction_enabled";
const FALLBACK_STORAGE_KEY = "under_construction_status_fallback";

export const getUnderConstructionStatus = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select("value")
      .eq("key", UNDER_CONSTRUCTION_KEY)
      .single();

    if (error) {
      // PGRST116 is "not found" - table or row doesn't exist
      if (error.code === "PGRST116") {
        console.warn("Under construction table not found, using fallback storage");
        const fallbackValue = localStorage.getItem(FALLBACK_STORAGE_KEY);
        if (fallbackValue !== null) {
          return fallbackValue === "true";
        }
        return false; // Default to under construction disabled
      }
      // Log the error details for debugging
      console.error("Error fetching under construction status:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      // Use fallback storage on error
      const fallbackValue = localStorage.getItem(FALLBACK_STORAGE_KEY);
      return fallbackValue === null ? false : fallbackValue === "true";
    }

    if (!data) {
      // No data found, try to initialize
      await initializeUnderConstructionSetting();
      return false;
    }

    const status = data.value === true || data.value === "true";
    // Keep fallback in sync
    localStorage.setItem(FALLBACK_STORAGE_KEY, String(status));
    return status;
  } catch (error) {
    console.error("Unexpected error getting under construction status:", error);
    // Use fallback on any error
    const fallbackValue = localStorage.getItem(FALLBACK_STORAGE_KEY);
    return fallbackValue === null ? false : fallbackValue === "true";
  }
};

export const setUnderConstructionStatus = async (
  enabled: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert({
        key: UNDER_CONSTRUCTION_KEY,
        value: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("key", UNDER_CONSTRUCTION_KEY);

    if (error) {
      console.error("Error setting under construction status:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      // If database fails, use fallback
      console.warn("Database unavailable, using fallback storage");
      localStorage.setItem(FALLBACK_STORAGE_KEY, String(enabled));
      return true;
    }

    // Keep fallback in sync
    localStorage.setItem(FALLBACK_STORAGE_KEY, String(enabled));
    return true;
  } catch (error) {
    console.error("Unexpected error setting under construction status:", error);
    // Use fallback on any error
    console.warn("Using fallback storage due to error");
    localStorage.setItem(FALLBACK_STORAGE_KEY, String(enabled));
    return true;
  }
};

const initializeUnderConstructionSetting = async (): Promise<void> => {
  try {
    await supabase.from(SETTINGS_TABLE).insert({
      key: UNDER_CONSTRUCTION_KEY,
      value: false,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error initializing under construction setting:", error);
  }
};
