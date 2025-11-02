import "./global.css";
import React, { Suspense, lazy } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { preserveAuthState } from "@/lib/auth-utils";
import UnderConstructionGate from "@/components/UnderConstructionGate";
// Route-based code splitting
const Index = lazy(() => import("./Index"));
const NotFound = lazy(() => import("./NotFound"));
const BugReport = lazy(() => import("./BugReport"));
const RuleViolation = lazy(() => import("./RuleViolation"));
const Discord = lazy(() => import("./Discord"));
const SignIn = lazy(() => import("./SignIn"));
const SignUp = lazy(() => import("./SignUp"));
const Profile = lazy(() => import("./Profile"));
const Users = lazy(() => import("./Users"));
const ReportTracking = lazy(() => import("./ReportTracking"));
const Notifications = lazy(() => import("./Notifications"));
const MediaAdmin = lazy(() => import("./MediaAdmin"));
const Clips = lazy(() => import("./Clips"));
const Admin = lazy(() => import("./Admin"));
const Reports = lazy(() => import("./Reports"));
const AuthCallback = lazy(() => import("./AuthCallback"));
const TermsAndConditions = lazy(() => import("./TermsAndConditions"));
const Contact = lazy(() => import("./Contact"));
const ContactsAdmin = lazy(() => import("./ContactsAdmin"));

const queryClient = new QueryClient();

// Preserve auth state on app initialization
preserveAuthState();

const App = () => {
  // Preserve auth state whenever the app component mounts
  React.useEffect(() => {
    preserveAuthState();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UnderConstructionGate>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="min-h-screen bg-gaming-dark flex items-center justify-center text-neon-blue">
                  Loading...
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/discord" element={<Discord />} />
                <Route path="/bug-report" element={<BugReport />} />
                <Route path="/rule-violation" element={<RuleViolation />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/users" element={<Users />} />
                <Route path="/report-tracking" element={<ReportTracking />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/media-admin" element={<MediaAdmin />} />
                <Route path="/clips" element={<Clips />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/contacts" element={<ContactsAdmin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </UnderConstructionGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Fix React double mounting issue
const container = document.getElementById("root");
if (container) {
  // Only create root if it doesn't exist
  if (!(container as any)._reactRootContainer) {
    (container as any)._reactRootContainer = createRoot(container);
  }
  (container as any)._reactRootContainer.render(<App />);
}

// Handle HMR properly in development
if (import.meta.hot) {
  import.meta.hot.accept();
}
