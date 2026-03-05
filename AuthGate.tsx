import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth-utils";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Public routes that don't require authentication
  const publicRoutes = ["/signin", "/signup", "/terms", "/auth/callback"];

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(location.pathname);
    const isLoggedIn = isAuthenticated();

    // If not logged in and trying to access a protected route, redirect to signin
    if (!isLoggedIn && !isPublicRoute) {
      navigate("/signin", { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}
