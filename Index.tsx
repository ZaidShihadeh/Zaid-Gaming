import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Gamepad2,
  Users,
  Trophy,
  Instagram,
  Facebook,
  Youtube,
  Calendar,
  User,
  LogOut,
} from "lucide-react";
import { DiscordIcon } from "@/components/DiscordIcon";
import { useEffect, useState } from "react";
import {
  isAuthenticated,
  getUserData,
  clearAuthData,
  preserveAuthState,
} from "@/lib/auth-utils";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Preserve auth state first
    preserveAuthState();

    // Check authentication status
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const user = getUserData();

      setIsLoggedIn(authenticated);
      setUserData(user);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    clearAuthData();
    setIsLoggedIn(false);
    setUserData(null);
    // Stay on homepage after logout
  };
  return (
    <div className="min-h-screen bg-gaming-dark">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-gaming-card focus:text-foreground focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      {/* Background Pattern */}
      <div
        className={
          'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23404040" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-20'
        }
      ></div>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://cdn.builder.io/api/v1/assets/716fc715e6e8476097c77bcb6279b9ec/zaidgaming-7996ac?format=webp&width=800"
                alt="Zaid Gaming Logo"
                loading="lazy"
                decoding="async"
                className="h-12 w-12 neon-glow rounded-lg"
              />
              <div>
                <h1 className="text-xl font-black neon-text-blue font-rounded">
                  Zaid Gaming
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gaming Content Creator
                </p>
              </div>
            </div>
            <nav className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 md:space-x-6 sm:items-center">
              <Link to="/contact">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto bg-gaming-card/50 hover:bg-gaming-card/70 text-neon-blue border border-gaming-border hover:border-neon-blue/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/25"
                >
                  Support & Reports
                </Button>
              </Link>
              <Link to="/terms">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto bg-gaming-card/50 hover:bg-gaming-card/70 text-neon-purple border border-gaming-border hover:border-neon-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/25"
                >
                  Community Rules and Guidelines
                </Button>
              </Link>
              <Link to="/discord">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/50 hover:border-indigo-400 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25"
                >
                  <DiscordIcon className="mr-2 h-4 w-4" />
                  <span>Discord Community</span>
                </Button>
              </Link>

              {isLoggedIn ? (
                <>
                  <Link to="/profile">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/50 hover:border-green-400 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link to="/notifications">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto bg-gaming-card/50 hover:bg-gaming-card/70 text-neon-purple border border-gaming-border hover:border-neon-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/25"
                    >
                      Notifications
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full sm:w-auto bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 hover:border-red-400 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <Button
                      size="sm"
                      className="w-full sm:w-auto bg-neon-blue hover:bg-neon-blue/80 transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/25"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="main" className="relative z-10 py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <img
              src="https://cdn.builder.io/api/v1/assets/716fc715e6e8476097c77bcb6279b9ec/zaidgaming-7996ac?format=webp&width=800"
              alt="Zaid Gaming"
              width="800"
              height="800"
              loading="lazy"
              decoding="async"
              className="h-32 w-auto mx-auto mb-8 neon-glow rounded-lg"
            />
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight text-balance bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent font-rounded">
              ZAID GAMING
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Welcome to the official home of Zaid Gaming. Join our community,
              watch gaming content, and connect with fellow gamers across all
              platforms.
            </p>

            {/* Social Media Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <a
                  href="https://www.instagram.com/zaidshihadehgaming/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow on Instagram (opens in a new tab)"
                >
                  <Instagram className="mr-2 h-5 w-5" />
                  Follow on Instagram
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white border-0 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
              >
                <a
                  href="https://m.youtube.com/@zaidshihadehgaming"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Subscribe on YouTube (opens in a new tab)"
                >
                  <Youtube className="mr-2 h-5 w-5" />
                  Subscribe on YouTube
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25"
              >
                <a
                  href="https://discord.gg/CQxUGY2CWM"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join Discord (opens in a new tab)"
                >
                  <DiscordIcon className="mr-2 h-5 w-5" />
                  Join Discord
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
              >
                <a
                  href="https://m.facebook.com/zaidshihadehgaming/?"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow on Facebook (opens in a new tab)"
                >
                  <Facebook className="mr-2 h-5 w-5" />
                  Follow on Facebook
                </a>
              </Button>
            </div>

            {/* Call to Action */}
            <div className="flex justify-center">
              <Link to="/discord">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/50 hover:border-neon-blue transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/25"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Discord Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 neon-text-purple">
            What We Offer
          </h3>

          <div className="flex justify-center">
            <Card className="bg-gaming-card/80 border-gaming-border hover:border-neon-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/10 max-w-md">
              <CardHeader>
                <div className="w-12 h-12 bg-neon-purple/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-neon-purple" />
                </div>
                <CardTitle className="text-neon-purple">Community</CardTitle>
                <CardDescription>
                  Join our Discord server and connect with fellow gamers, share
                  tips, and participate in events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/discord">
                  <Button
                    variant="ghost"
                    className="w-full text-neon-purple hover:bg-neon-purple/10"
                  >
                    <DiscordIcon className="mr-2 h-4 w-4" />
                    Join Community
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-4 bg-gaming-card/40">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold neon-text-blue mb-2">Live</div>
              <div className="text-muted-foreground">Streaming</div>
            </div>
            <div>
              <div className="text-3xl font-bold neon-text-purple mb-2">
                Multi
              </div>
              <div className="text-muted-foreground">Platform Gaming</div>
            </div>
            <div>
              <div className="text-3xl font-bold neon-text-pink mb-2">24/7</div>
              <div className="text-muted-foreground">Community Active</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="relative z-10 py-16 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-black neon-text-blue mb-8 font-rounded">
            Follow Zaid Gaming
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stay connected across all platforms for the latest updates, gaming
            content, and community events.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-400 border border-purple-500/50 hover:border-purple-400 transition-all duration-300"
            >
              <a
                href="https://www.instagram.com/zaidshihadehgaming/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Instagram (opens in a new tab)"
              >
                <Instagram className="mr-2 h-5 w-5" />
                Instagram
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 hover:border-red-400 transition-all duration-300"
            >
              <a
                href="https://m.youtube.com/@zaidshihadehgaming"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open YouTube (opens in a new tab)"
              >
                <Youtube className="mr-2 h-5 w-5" />
                YouTube
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/50 hover:border-indigo-400 transition-all duration-300"
            >
              <a
                href="https://discord.gg/CQxUGY2CWM"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Discord (opens in a new tab)"
              >
                <DiscordIcon className="mr-2 h-5 w-5" />
                Discord
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/50 hover:border-blue-400 transition-all duration-300"
            >
              <a
                href="https://m.facebook.com/zaidshihadehgaming/?"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Facebook (opens in a new tab)"
              >
                <Facebook className="mr-2 h-5 w-5" />
                Facebook
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gaming-border bg-gaming-card/80 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Gamepad2 className="h-5 w-5 text-neon-blue" />
            <span className="font-black neon-text-blue font-rounded">
              Zaid Gaming
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 Zaid Gaming. Creating epic gaming experiences across all
            platforms.
          </p>
          <div className="flex justify-center mt-4">
            <Badge
              variant="outline"
              className="text-neon-purple border-neon-purple/50"
            >
              Gaming Content Creator
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
