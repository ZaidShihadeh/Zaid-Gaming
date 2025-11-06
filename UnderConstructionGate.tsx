import React, { useState, useEffect } from "react";
import UnderConstruction from "@/components/UnderConstruction";
import { getUnderConstructionStatus } from "@/lib/under-construction-utils";
import { isAuthenticated } from "@/lib/auth-utils";

export default function UnderConstructionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUnderConstruction, setIsUnderConstruction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocalAccess, setHasLocalAccess] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 5000); // 5 second timeout
        });

        const underConstruction = await Promise.race([
          getUnderConstructionStatus(),
          timeoutPromise,
        ]);

        setIsUnderConstruction(underConstruction);
        setUserAuthenticated(isAuthenticated());
      } catch (error) {
        console.error("Error checking under construction status:", error);
        // On error, assume not under construction
        setIsUnderConstruction(false);
        setUserAuthenticated(isAuthenticated());
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Poll for changes every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAccessGranted = () => {
    setHasLocalAccess(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center text-neon-blue">
        Loading...
      </div>
    );
  }

  if (isUnderConstruction && !hasLocalAccess && !userAuthenticated) {
    return <UnderConstruction onAccessGranted={handleAccessGranted} />;
  }

  return <>{children}</>;
}
