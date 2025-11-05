import React, { useState, useEffect } from "react";
import UnderConstruction from "@/components/UnderConstruction";

export default function UnderConstructionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleAccessGranted = () => {
    setHasAccess(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center text-neon-blue">
        Loading...
      </div>
    );
  }

  if (!hasAccess) {
    return <UnderConstruction onAccessGranted={handleAccessGranted} />;
  }

  return <>{children}</>;
}
