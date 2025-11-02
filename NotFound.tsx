import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Gamepad2 } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
      {/* Background Pattern */}
      <div
        className={
          'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23404040" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-20'
        }
      ></div>

      <div className="relative z-10 text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gamepad2 className="h-10 w-10 text-neon-blue" />
        </div>

        <h1 className="text-8xl font-bold neon-text-blue mb-4">404</h1>
        <h2 className="text-2xl font-bold neon-text-purple mb-4">Game Over!</h2>
        <p className="text-muted-foreground mb-8">
          Looks like you've wandered into an unexplored area. This page doesn't
          exist in our gaming universe.
        </p>

        <Link to="/">
          <Button
            size="lg"
            className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/50 hover:border-neon-blue transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/25"
          >
            <Home className="mr-2 h-5 w-5" />
            Return to Base
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
