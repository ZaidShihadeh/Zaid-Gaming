import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tnidjvpxeuaophrmkjeg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuaWRqdnB4ZXVhb3Bocm1ramVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NTY2MzUsImV4cCI6MjA2NzUzMjYzNX0.i8lqVJvQWqXE7Fdck1XciLhEDzobeo8aa0zhEVyOLyk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Discord OAuth configuration
export const signInWithDiscord = async () => {
  // Always use the current environment for testing
  const redirectUrl = window.location.origin + "/auth/callback";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: redirectUrl,
      scopes: "identify email", // ensure we request email for backend sync
    },
  });

  if (error) {
    console.error("Discord OAuth error:", error);
    throw error;
  }

  return data;
};

// Email verification
export const sendVerificationCode = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.error("Send verification error:", error);
    throw error;
  }

  return data;
};

// Verify OTP code
export const verifyOtpCode = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    console.error("Verify OTP error:", error);
    throw error;
  }

  return data;
};

// Sign up with email and send verification
export const signUpWithEmail = async (email: string, password: string) => {
  // Always use the current environment
  const redirectUrl = window.location.origin + "/auth/callback";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error("Sign up error:", error);
    throw error;
  }

  return data;
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);
    throw error;
  }

  return data;
};

// Update password with verification
export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Update password error:", error);
    throw error;
  }

  return data;
};

// Update email with verification
export const updateEmail = async (newEmail: string) => {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    console.error("Update email error:", error);
    throw error;
  }

  return data;
};
