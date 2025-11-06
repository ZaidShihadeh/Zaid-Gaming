import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, LogIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SignInRequest, AuthResponse } from "@shared/auth";
import { setAuthData } from "@/lib/auth-utils";
import { signInWithDiscord } from "@/lib/supabase";
import { DiscordIcon } from "@/components/DiscordIcon";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [kickReason, setKickReason] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDiscordSignIn = async () => {
    try {
      await signInWithDiscord();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Discord. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const signInData: SignInRequest = { email, password };
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signInData),
      });

      const data: AuthResponse = await response.json();

      if (data.success) {
        if (data.token) {
          setAuthData(data.token, data.user, keepSignedIn);

          toast({
            title: "Success!",
            description: "You have been signed in successfully.",
          });
          navigate("/profile");
        }
      } else {
        if (data.kickReason) {
          setKickReason(data.kickReason);
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
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
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-neon-blue hover:text-neon-purple transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img
                src="https://cdn.builder.io/api/v1/assets/716fc715e6e8476097c77bcb6279b9ec/zaidgaming-7996ac?format=webp&width=800"
                alt="Zaid Gaming Logo"
                className="h-16 w-16 rounded-lg neon-glow mx-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold neon-text-blue">
              Sign In
            </CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Kicked User Message */}
            {kickReason && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 font-medium">
                    You have been kicked
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Your account was removed from the platform. You can create a
                  new account if you wish.
                </p>
                <details className="cursor-pointer">
                  <summary className="text-red-400 hover:text-red-300 text-sm font-medium">
                    Show Reason
                  </summary>
                  <div className="mt-2 p-3 bg-gaming-dark/50 rounded border border-gaming-border">
                    <p className="text-sm">{kickReason}</p>
                  </div>
                </details>
                <div className="mt-4 flex">
                  <Button
                    variant="outline"
                    onClick={() => setKickReason(null)}
                    className="border-gaming-border w-full"
                  >
                    Try Different Username
                  </Button>
                </div>
              </div>
            )}

            {/* Discord OAuth */}
            <Button
              onClick={handleDiscordSignIn}
              variant="outline"
              className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border-indigo-500/50"
            >
              <DiscordIcon className="mr-2 h-4 w-4" />
              Continue with Discord
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gaming-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gaming-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gaming-dark/50 border-gaming-border"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-gaming-dark/50 border-gaming-border"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keep-signed-in"
                  checked={keepSignedIn}
                  onCheckedChange={(checked) =>
                    setKeepSignedIn(checked === true)
                  }
                />
                <Label
                  htmlFor="keep-signed-in"
                  className="text-sm font-normal cursor-pointer"
                >
                  Keep me signed in
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-neon-blue hover:bg-neon-blue/80"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Link
                to="/signup"
                className="text-neon-blue hover:text-neon-purple transition-colors"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
