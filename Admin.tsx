import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { isAuthenticated, getUserData } from "@/lib/auth-utils";

export default function Admin() {
  const authed = isAuthenticated();
  const user = getUserData();
  const isAdmin = !!user?.isAdmin;

  return (
    <div className="min-h-screen bg-gaming-dark">
      <header className="relative z-10 border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="flex items-center text-neon-blue hover:text-neon-purple transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl bg-gaming-card/80 border border-gaming-border rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-10 w-10 text-neon-purple" />
          </div>
          <h1 className="text-3xl font-black neon-text-blue mb-2 font-rounded">
            Admin Area
          </h1>

          {!authed && (
            <>
              <p className="text-muted-foreground mb-6">
                Sign in with an administrator account to continue.
              </p>
              <Button asChild className="bg-neon-blue hover:bg-neon-blue/80">
                <Link to="/signin">
                  <Lock className="h-4 w-4 mr-2" /> Sign in
                </Link>
              </Button>
            </>
          )}

          {authed && !isAdmin && (
            <>
              <p className="text-muted-foreground mb-6">
                This area is restricted to administrators.
              </p>
              <Button asChild variant="outline" className="text-neon-blue">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Go Home
                </Link>
              </Button>
            </>
          )}

          {authed && isAdmin && (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Welcome, admin. Choose a section:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline" className="text-neon-purple">
                  <Link to="/media-admin">Review Submissions</Link>
                </Button>
                <Button asChild variant="outline" className="text-neon-blue">
                  <Link to="/users">Manage Users</Link>
                </Button>
                <Button asChild variant="outline" className="text-neon-pink">
                  <Link to="/reports">Manage Reports</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
