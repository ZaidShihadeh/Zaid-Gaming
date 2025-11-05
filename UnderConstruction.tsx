import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gamepad2, Lock, User, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CORRECT_USERNAME = "ZaidShihadeh";
const CORRECT_PASSWORD = "ZaidShihadehGaming2514";

interface UnderConstructionProps {
  onAccessGranted: () => void;
}

export default function UnderConstruction({
  onAccessGranted,
}: UnderConstructionProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Simulate a slight delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
        toast({
          title: "Welcome!",
          description: "Access granted. Welcome to Zaid Gaming.",
        });
        onAccessGranted();
      } else {
        setError("Invalid username or password");
        setUsername("");
        setPassword("");
        toast({
          title: "Access Denied",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gaming-dark flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div
        className={
          'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23404040" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-20'
        }
      ></div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <img
                  src="https://cdn.builder.io/api/v1/assets/716fc715e6e8476097c77bcb6279b9ec/zaidgaming-7996ac?format=webp&width=800"
                  alt="Zaid Gaming Logo"
                  className="h-16 w-16 rounded-lg neon-glow"
                />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black neon-text-blue font-rounded">
                Under Construction
              </CardTitle>
              <CardDescription className="text-base">
                We're building something amazing. This site is restricted to
                administrators. Please enter your credentials.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Warning Message */}
            <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-neon-purple flex-shrink-0 mt-0.5" />
              <div className="text-sm text-neon-purple">
                Admin access only. Unauthorized access is prohibited.
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-neon-blue">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-gaming-dark/50 border-gaming-border focus:border-neon-blue focus:ring-neon-blue/20"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neon-blue">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-gaming-dark/50 border-gaming-border focus:border-neon-blue focus:ring-neon-blue/20"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-neon-blue transition-colors"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-neon-blue hover:bg-neon-blue/80 text-gaming-dark font-semibold transition-all duration-300"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Verifying...
                  </span>
                ) : (
                  <>
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Unlock Access
                  </>
                )}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Zaid Gaming. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
