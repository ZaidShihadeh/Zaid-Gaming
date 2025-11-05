import { supabase } from "@/supabase";

const SETTINGS_TABLE = "app_settings";
const UNDER_CONSTRUCTION_KEY = "under_construction_enabled";

export const getUnderConstructionStatus = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select("value")
      .eq("key", UNDER_CONSTRUCTION_KEY)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching under construction status:", error);
      return true; // Default to under construction if there's an error
    }

    if (!data) {
      // Initialize the setting if it doesn't exist
      await initializeUnderConstructionSetting();
      return true;
    }

    return data.value === true || data.value === "true";
  } catch (error) {
    console.error("Error getting under construction status:", error);
    return true; // Default to under construction if there's an error
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
      console.error("Error setting under construction status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error setting under construction status:", error);
    return false;
  }
};

const initializeUnderConstructionSetting = async (): Promise<void> => {
  try {
    await supabase.from(SETTINGS_TABLE).insert({
      key: UNDER_CONSTRUCTION_KEY,
      value: true,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error initializing under construction setting:", error);
  }
};
