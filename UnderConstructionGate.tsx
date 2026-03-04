import React, { useState, useEffect } from "react";
import UnderConstruction from "@/components/UnderConstruction";
import { getUnderConstructionStatus } from "@/lib/under-construction-utils";

const SESSION_STORAGE_KEY = "admin_access_granted";

export default function UnderConstructionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isUnderConstruction, setIsUnderConstruction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if admin access was already granted in this session
        const adminAccess =
          sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
        setHasAdminAccess(adminAccess);

        // Check database status
        const underConstruction = await getUnderConstructionStatus();
        setIsUnderConstruction(underConstruction);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorType = error instanceof Error ? error.name : typeof error;
        console.error(
          `Error checking gate status: ${errorMessage} (${errorType})`
        );
        // If there's an error, assume not under construction for safety
        setIsUnderConstruction(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();

    // Poll for status changes every 5 seconds
    const interval = setInterval(checkAccess, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAccessGranted = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    setHasAdminAccess(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-neon-blue">Loading...</div>
      </div>
    );
  }

  // Block entire website if site is under construction and user doesn't have admin access
  if (isUnderConstruction && !hasAdminAccess) {
    return <UnderConstruction onAccessGranted={handleAccessGranted} />;
  }

  return <>{children}</>;
}
