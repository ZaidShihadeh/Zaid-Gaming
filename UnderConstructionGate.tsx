import React, { useState, useEffect } from "react";
import UnderConstruction from "@/components/UnderConstruction";

const STORAGE_KEY = "site_access_granted";

export default function UnderConstructionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const storedAccess = localStorage.getItem(STORAGE_KEY);
    if (storedAccess === "true") {
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }
  }, []);

  const handleAccessGranted = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHasAccess(true);
  };

  if (hasAccess === null) {
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
