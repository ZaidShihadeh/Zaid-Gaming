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
import { ArrowLeft, Mail, Lock, UserPlus, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SignUpRequest, AuthResponse } from "@shared/auth";
import { signInWithDiscord } from "@/lib/supabase";
import { DiscordIcon } from "@/components/DiscordIcon";
import { setAuthData } from "@/lib/auth-utils";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const navigate = useNavigate();

  const handleDiscordSignUpClick = async () => {
    if (!agreeToTerms) {
      toast({
        title: "Agreement Required",
        description:
          "Please agree to the Community Rules and Guidelines to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store the keepSignedIn preference so AuthCallback can use it
      if (keepSignedIn) {
        localStorage.setItem("keepSignedIn", "true");
      } else {
        localStorage.removeItem("keepSignedIn");
      }

      await signInWithDiscord();
      // Supabase will handle the redirect to Discord OAuth
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up with Discord. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeToTerms) {
      toast({
        title: "Agreement Required",
        description:
          "Please agree to the Community Rules and Guidelines to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const signUpData: SignUpRequest = { email, password, name };
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signUpData),
      });

      const data: AuthResponse = await response.json();

      if (data.success) {
        if (data.token) {
          // Use the setAuthData function to properly manage authentication
          setAuthData(data.token, data.user, keepSignedIn);

          toast({
            title: "Success!",
            description: "Account created successfully!",
          });
          navigate("/profile");
        }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
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
              Join Zaid Gaming
            </CardTitle>
            <CardDescription>
              Create your account to join the community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Discord OAuth */}
            <Button
              onClick={handleDiscordSignUpClick}
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
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-gaming-dark/50 border-gaming-border"
                    required
                  />
                </div>
              </div>
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
                  id="keepSignedIn"
                  checked={keepSignedIn}
                  onCheckedChange={(checked) =>
                    setKeepSignedIn(checked as boolean)
                  }
                />
                <Label htmlFor="keepSignedIn" className="text-sm">
                  Keep me signed in
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) =>
                    setAgreeToTerms(checked as boolean)
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor="agreeToTerms"
                  className="text-sm leading-relaxed"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-neon-blue hover:text-neon-purple transition-colors underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Community Rules and Guidelines
                  </Link>
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-neon-blue hover:bg-neon-blue/80"
                disabled={isLoading || !agreeToTerms}
              >
                {isLoading ? (
                  "Creating account..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                to="/signin"
                className="text-neon-blue hover:text-neon-purple transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
