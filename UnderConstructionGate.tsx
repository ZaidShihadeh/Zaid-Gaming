import React, { useState, useEffect } from "react";
import UnderConstruction from "@/components/UnderConstruction";
import { getUnderConstructionStatus } from "@/lib/under-construction-utils";
import { isAuthenticated } from "@/lib/auth-utils";

export default function UnderConstructionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUnderConstruction, setIsUnderConstruction] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocalAccess, setHasLocalAccess] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const underConstruction = await getUnderConstructionStatus();
      setIsUnderConstruction(underConstruction);
      setUserAuthenticated(isAuthenticated());
      setIsLoading(false);
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
