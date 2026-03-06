import bcryptjs from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://diiyxngbpccnxmmyyrdb.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXl4bmdicGNjbnhtbXl5cmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM4MTEyNywiZXhwIjoyMDc3OTU3MTI3fQ.IJW5-0428aMGMbhqKsCNHdeCLHTCvfS3-7i9z1sebGU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminAccount() {
  try {
    console.log("Creating admin account...");
    
    const email = "zshihadeh671@gmail.com";
    const password = "Zaid2014";
    const name = "Zaid Shihadeh";
    
    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);
    console.log("Password hashed");
    
    // Create the user
    const { data, error } = await supabase
      .from("users")
      .insert([{
        id: `user_${Math.random().toString(36).slice(2, 10)}`,
        email: email,
        name: name,
        password_hash: hashedPassword,
        is_admin: true,
        status: "admin",
        is_banned: false,
        created_at: new Date().toISOString(),
      }])
      .select();
    
    if (error) {
      console.error("Error creating admin account:", error);
      process.exit(1);
    }
    
    console.log("✅ Admin account created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Status: Admin");
    console.log("\nYou can now login at /signin");
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createAdminAccount();
