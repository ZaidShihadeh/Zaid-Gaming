import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { setAuthData } from "@/lib/auth-utils";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const waitForSession = async (timeoutMs = 10000) => {
      try {
        const initial = await supabase.auth.getSession();
        if (initial.data.session) return initial.data.session;

        return await new Promise<NonNullable<
          typeof initial.data.session
        > | null>((resolve) => {
          const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
              if (session) {
                listener.subscription.unsubscribe();
                resolve(session);
              }
            },
          );
          setTimeout(async () => {
            listener.subscription.unsubscribe();
            const latest = await supabase.auth.getSession();
            resolve(latest.data.session ?? null);
          }, timeoutMs);
        });
      } catch {
        return null;
      }
    };

    const handleAuthCallback = async () => {
      try {
        // Check for provider-side error in URL
        const hash = window.location.hash || "";
        const search = window.location.search || "";
        const params = new URLSearchParams(
          hash.startsWith("#") ? hash.slice(1) : search,
        );
        const error = params.get("error");
        const error_description = params.get("error_description");
        if (error || error_description) {
          const desc = decodeURIComponent(
            error_description || error || "Authentication failed",
          );
          console.error("OAuth error:", error, desc);
          toast({
            title: "Authentication Error",
            description: desc,
            variant: "destructive",
          });
          navigate("/signin");
          return;
        }

        const session = await waitForSession(12000);
        if (session) {
          const user = session.user;

          // Compute display name
          let displayName = "User";
          if (user.user_metadata?.full_name)
            displayName = user.user_metadata.full_name;
          else if (user.user_metadata?.name)
            displayName = user.user_metadata.name;
          else if (user.user_metadata?.user_name)
            displayName = user.user_metadata.user_name;
          else if (user.email) displayName = user.email.split("@")[0];

          // Profile picture
          let profilePicture = user.user_metadata?.avatar_url;
          if (!profilePicture && user.user_metadata?.picture)
            profilePicture = user.user_metadata.picture;

          // Sync with backend
          const syncResponse = await fetch("/api/auth/discord-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: user.id,
              email: user.email || null,
              name: displayName,
              profilePicture,
              discordId:
                user.user_metadata?.sub ||
                user.user_metadata?.provider_id ||
                null,
              username: user.user_metadata?.user_name || null,
            }),
          });

          const syncData = await syncResponse.json();

          if (!syncData.success) {
            console.error("Discord sync failed:", syncData.message);
            toast({
              title: "Authentication Error",
              description: "Failed to sync user data. Please try again.",
              variant: "destructive",
            });
            navigate("/signin");
            return;
          }

          const userData = syncData.user;

          const keepSignedIn =
            sessionStorage.getItem("keepSignedIn") === "true" ||
            localStorage.getItem("keepSignedIn") === "true";
          setAuthData(syncData.token, userData, keepSignedIn);

          const welcomeMessage =
            user.user_metadata?.provider === "discord"
              ? `Welcome, ${displayName}! You've signed in with Discord.`
              : "You have been signed in successfully.";

          toast({ title: "Success!", description: welcomeMessage });
          navigate("/profile");
        } else {
          toast({
            title: "Authentication Error",
            description: "No active session found. Please try again.",
            variant: "destructive",
          });
          navigate("/signin");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to complete authentication. Please try again.",
          variant: "destructive",
        });
        navigate("/signin");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
        <p className="text-neon-blue">Completing authentication...</p>
      </div>
    </div>
  );
}
