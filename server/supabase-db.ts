import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Check if users table exists by attempting to query it
    const { error } = await supabase.from("users").select("count()", { count: "exact" });
    
    if (error && error.code === "PGRST116") {
      console.log("[DB] Tables not found, creating schema...");
      // Tables need to be created via SQL in Supabase console
      console.log("[DB] Please run the schema.sql file in your Supabase SQL editor");
      return false;
    } else if (error) {
      console.error("[DB] Error checking tables:", error);
      return false;
    }

    console.log("[DB] Database schema verified successfully");
    return true;
  } catch (error) {
    console.error("[DB] Database initialization error:", error);
    return false;
  }
}

// Helper functions for common operations
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  
  if (error && error.code !== "PGRST116") {
    console.error("[DB] Error fetching user:", error);
  }
  
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error && error.code !== "PGRST116") {
    console.error("[DB] Error fetching user:", error);
  }
  
  return data;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching users:", error);
    return [];
  }
  
  return data || [];
}

export async function createUser(userData: any) {
  const { data, error } = await supabase
    .from("users")
    .insert([userData])
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error creating user:", error);
    return null;
  }
  
  return data;
}

export async function updateUser(id: string, updates: any) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error updating user:", error);
    return null;
  }
  
  return data;
}

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("[DB] Error deleting user:", error);
    return false;
  }
  
  return true;
}

// Media operations
export async function getApprovedMedia() {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching media:", error);
    return [];
  }
  
  return data || [];
}

export async function getPendingMedia() {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching pending media:", error);
    return [];
  }
  
  return data || [];
}

export async function createMedia(mediaData: any) {
  const { data, error } = await supabase
    .from("media")
    .insert([mediaData])
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error creating media:", error);
    return null;
  }
  
  return data;
}

export async function updateMediaStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("media")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error updating media:", error);
    return null;
  }
  
  return data;
}

// Comments operations
export async function getComments(mediaId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("media_id", mediaId)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("[DB] Error fetching comments:", error);
    return [];
  }
  
  return data || [];
}

export async function createComment(commentData: any) {
  const { data, error } = await supabase
    .from("comments")
    .insert([commentData])
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error creating comment:", error);
    return null;
  }
  
  return data;
}

// Events operations
export async function getAllEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });
  
  if (error) {
    console.error("[DB] Error fetching events:", error);
    return [];
  }
  
  return data || [];
}

export async function createEvent(eventData: any) {
  const { data, error } = await supabase
    .from("events")
    .insert([eventData])
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error creating event:", error);
    return null;
  }
  
  return data;
}

export async function getEventRsvp(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();
  
  if (error && error.code !== "PGRST116") {
    console.error("[DB] Error fetching RSVP:", error);
  }
  
  return data !== null;
}

export async function getEventRsvpCount(eventId: string) {
  const { count, error } = await supabase
    .from("event_rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);
  
  if (error) {
    console.error("[DB] Error counting RSVPs:", error);
    return 0;
  }
  
  return count || 0;
}

export async function toggleEventRsvp(eventId: string, userId: string) {
  const hasRsvp = await getEventRsvp(eventId, userId);
  
  if (hasRsvp) {
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    
    if (error) {
      console.error("[DB] Error removing RSVP:", error);
      return null;
    }
    
    return false;
  } else {
    const { error } = await supabase
      .from("event_rsvps")
      .insert([{ event_id: eventId, user_id: userId }]);
    
    if (error) {
      console.error("[DB] Error adding RSVP:", error);
      return null;
    }
    
    return true;
  }
}

// Notifications operations
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching notifications:", error);
    return [];
  }
  
  if (data && data.length === 0) {
    // Create default welcome notification
    const { data: notif } = await supabase
      .from("notifications")
      .insert([{
        id: `n_${Math.random().toString(36).slice(2, 10)}`,
        user_id: userId,
        type: "announcement",
        title: "Welcome!",
        message: "Thanks for joining the community.",
      }])
      .select()
      .single();
    
    return notif ? [notif] : [];
  }
  
  return data || [];
}

// Reports operations
export async function getAllReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching reports:", error);
    return [];
  }
  
  return data || [];
}

export async function getUserReports(userId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching user reports:", error);
    return [];
  }
  
  return data || [];
}

export async function createReport(reportData: any) {
  const { data, error } = await supabase
    .from("reports")
    .insert([reportData])
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error creating report:", error);
    return null;
  }
  
  return data;
}

export async function updateReport(id: string, updates: any) {
  const { data, error } = await supabase
    .from("reports")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error updating report:", error);
    return null;
  }
  
  return data;
}

// Contacts operations
export async function getAllContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching contacts:", error);
    return [];
  }
  
  return data || [];
}

export async function getUserContacts(userId: string) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching user contacts:", error);
    return [];
  }
  
  return data || [];
}

export async function createContact(contactData: any) {
  const { data, error } = await supabase
    .from("contacts")
    .insert([contactData])
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error creating contact:", error);
    return null;
  }
  
  return data;
}

export async function updateContact(id: string, updates: any) {
  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error updating contact:", error);
    return null;
  }
  
  return data;
}

// Game suggestions operations
export async function getAllGameSuggestions() {
  const { data, error } = await supabase
    .from("game_suggestions")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching game suggestions:", error);
    return [];
  }
  
  return data || [];
}

export async function getUserGameSuggestions(userId: string) {
  const { data, error } = await supabase
    .from("game_suggestions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[DB] Error fetching user game suggestions:", error);
    return [];
  }
  
  return data || [];
}

export async function createGameSuggestion(suggestionData: any) {
  const { data, error } = await supabase
    .from("game_suggestions")
    .insert([suggestionData])
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error creating game suggestion:", error);
    return null;
  }
  
  return data;
}

export async function updateGameSuggestion(id: string, updates: any) {
  const { data, error } = await supabase
    .from("game_suggestions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("[DB] Error updating game suggestion:", error);
    return null;
  }
  
  return data;
}
