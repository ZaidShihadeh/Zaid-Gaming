import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Camera,
  Save,
  LogOut,
  Shield,
  Settings,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { User as UserType, UpdateProfileRequest } from "@shared/auth";
import DevicePhotoUploader from "@/components/DevicePhotoUploader";
import { getAuthToken, getUserData, clearAuthData } from "@/lib/auth-utils";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const [user, setUser] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [bio, setBio] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [originalEmailCode, setOriginalEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUserData();
    const token = getAuthToken();

    if (!userData || !token) {
      navigate("/signin");
      return;
    }

    setUser(userData);
    setName(userData.name);
    setProfilePicture(userData.profilePicture || "");
    setBio((userData as any).bio || "");
    setBannerUrl((userData as any).bannerUrl || "");
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: UpdateProfileRequest = {
        name: name !== user?.name ? name : undefined,
        profilePicture:
          profilePicture !== user?.profilePicture ? profilePicture : undefined,
        bio: bio !== (user as any)?.bio ? bio : undefined,
        bannerUrl:
          bannerUrl !== (user as any)?.bannerUrl ? bannerUrl : undefined,
      };

      console.log("Updating profile with:", updateData);

      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(updateData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        const updatedUser = {
          ...user!,
          name: name,
          profilePicture: profilePicture,
          bio,
          bannerUrl,
        };
        setUser(updatedUser);

        // Update user data in whichever storage is currently used
        if (localStorage.getItem("user") !== null) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        if (sessionStorage.getItem("user") !== null) {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }
        toast({
          title: "Success!",
          description: "Profile updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEmailChange = async () => {
    if (!newEmail) {
      toast({
        title: "Error",
        description: "Please enter a new email address.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingEmail(true);

    try {
      const response = await fetch("/api/auth/start-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ newEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailChangeStep(1);
        toast({
          title: "Verification codes sent!",
          description: "Check both your current and new email addresses.",
        });
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
        description: "Failed to start email change. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleCompleteEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingEmail(true);

    try {
      const response = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          newEmail,
          originalEmailCode,
          newEmailCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user!, email: newEmail };
        setUser(updatedUser);
        if (localStorage.getItem("user") !== null) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        if (sessionStorage.getItem("user") !== null) {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }
        setEmailChangeStep(0);
        setNewEmail("");
        setOriginalEmailCode("");
        setNewEmailCode("");
        toast({
          title: "Success!",
          description: "Email changed successfully.",
        });
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
        description: "Failed to change email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    clearAuthData();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-neon-blue">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Background Pattern */}
      <div
        className={
          'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23404040" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-20'
        }
      ></div>

      {/* Header */}
      <header className="relative z-10 border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center text-neon-blue hover:text-neon-purple transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/report-tracking">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neon-blue hover:bg-neon-blue/10"
                >
                  Track Reports
                </Button>
              </Link>
              {user.isAdmin && (
                <>
                  <Link to="/reports">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neon-pink hover:bg-neon-pink/10"
                    >
                      Manage Reports
                    </Button>
                  </Link>
                  <Link to="/users">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neon-purple hover:bg-neon-purple/10"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                  </Link>
                </>
              )}
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-red-400/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="bg-gaming-card/80 border-gaming-border">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profilePicture} alt={user.name} />
                  <AvatarFallback className="bg-neon-blue/20 text-neon-blue text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl font-bold neon-text-blue">
                {user.name}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
              {user.isAdmin && (
                <div className="flex justify-center mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                    <Shield className="mr-1 h-3 w-3" />
                    Administrator
                  </span>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Update Profile */}
          <Card className="bg-gaming-card/80 border-gaming-border">
            <CardHeader>
              <CardTitle className="flex items-center text-neon-blue">
                <Settings className="mr-2 h-5 w-5" />
                Update Profile
              </CardTitle>
              <CardDescription>
                Change your profile information, banner, bio and picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-gaming-dark/50 border-gaming-border"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">Banner Image URL</Label>
                  <Input
                    id="bannerUrl"
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="bg-gaming-dark/50 border-gaming-border"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full min-h-24 rounded-md bg-gaming-dark/50 border border-gaming-border p-2"
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <div className="flex items-center space-x-4">
                    {profilePicture && (
                      <img
                        src={profilePicture}
                        alt="Current profile picture"
                        className="w-16 h-16 rounded-lg object-cover border border-gaming-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <DevicePhotoUploader
                      currentPhoto={profilePicture}
                      onPhotoSelect={(photoDataUrl) =>
                        setProfilePicture(photoDataUrl)
                      }
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-neon-blue hover:bg-neon-blue/80"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Updating..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Email */}
          <Card className="bg-gaming-card/80 border-gaming-border">
            <CardHeader>
              <CardTitle className="flex items-center text-neon-purple">
                <Mail className="mr-2 h-5 w-5" />
                Change Email Address
              </CardTitle>
              <CardDescription>
                Update your email address with verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailChangeStep === 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">New Email Address</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-gaming-dark/50 border-gaming-border"
                      placeholder="Enter new email address"
                    />
                  </div>
                  <Button
                    onClick={handleStartEmailChange}
                    className="w-full bg-neon-purple hover:bg-neon-purple/80"
                    disabled={isChangingEmail || !newEmail}
                  >
                    {isChangingEmail
                      ? "Sending codes..."
                      : "Start Email Change"}
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleCompleteEmailChange}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="originalCode">
                      Code from current email ({user.email})
                    </Label>
                    <Input
                      id="originalCode"
                      type="text"
                      value={originalEmailCode}
                      onChange={(e) =>
                        setOriginalEmailCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      className="bg-gaming-dark/50 border-gaming-border"
                      placeholder="6-digit code"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCode">
                      Code from new email ({newEmail})
                    </Label>
                    <Input
                      id="newCode"
                      type="text"
                      value={newEmailCode}
                      onChange={(e) =>
                        setNewEmailCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      className="bg-gaming-dark/50 border-gaming-border"
                      placeholder="6-digit code"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEmailChangeStep(0)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-neon-purple hover:bg-neon-purple/80"
                      disabled={
                        isChangingEmail ||
                        originalEmailCode.length !== 6 ||
                        newEmailCode.length !== 6
                      }
                    >
                      {isChangingEmail ? "Changing..." : "Change Email"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
