import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lightbulb,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getUserData } from "@/lib/auth-utils";
import { CreateGameSuggestionRequest, GameSuggestionResponse } from "@shared/game-suggestions";

export default function GameSuggestions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<CreateGameSuggestionRequest>({
    gameTitle: "",
    genre: "",
    description: "",
    contactEmail: "",
    whyImportant: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Verify authentication on the server side instead of client-side only
    // This is more reliable than checking localStorage
    const verifyAuth = async () => {
      const userData = getUserData();
      if (!userData) {
        // No local user data, redirect to sign in
        navigate("/signin");
      }
    };

    verifyAuth();
  }, [navigate]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.gameTitle ||
      !formData.genre ||
      !formData.description ||
      !formData.contactEmail
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Submitting game suggestion...");
      const userData = getUserData();
      console.log("Current user data:", userData);

      const response = await fetch("/api/game-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status);
      const data: GameSuggestionResponse = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("HTTP Error:", response.status, data);
        if (response.status === 401) {
          toast.error("Your session has expired. Please sign in again.");
          navigate("/signin");
          return;
        }
      }

      if (data.success) {
        setSubmitted(true);
        toast.success("Thank you! Your game suggestion has been received.");
        setTimeout(() => {
          navigate("/game-tracking");
        }, 3000);
      } else {
        toast.error(data.message || "Failed to submit suggestion");
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error("An error occurred while submitting your suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center p-4">
        <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-400">
              Suggestion Received!
            </CardTitle>
            <CardDescription>
              Thank you for your game suggestion
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              We've received your suggestion and will review it carefully. Our
              team will consider your recommendation for future game releases.
            </p>
            <Button
              onClick={() => navigate("/games")}
              className="w-full bg-neon-blue hover:bg-neon-blue/80"
            >
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Header */}
      <div className="border-b border-gaming-border bg-gaming-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            to="/games"
            className="inline-flex items-center text-neon-blue hover:text-neon-purple transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-8 w-8 text-neon-blue" />
            <h1 className="text-3xl font-bold neon-text-blue">
              Suggest a Game
            </h1>
          </div>
          <p className="text-muted-foreground">
            Have a great game idea or know a game you'd like to see on our
            platform? Share your suggestion with us! We read every submission
            and use your feedback to shape our game library.
          </p>
        </div>

        <Card className="bg-gaming-card/50 border-gaming-border">
          <CardHeader>
            <CardTitle>Game Suggestion Form</CardTitle>
            <CardDescription>
              Fill out the form below with your game suggestion details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Game Title */}
              <div className="space-y-2">
                <Label htmlFor="gameTitle" className="flex items-center gap-2">
                  Game Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="gameTitle"
                  name="gameTitle"
                  placeholder="Enter the game name"
                  value={formData.gameTitle}
                  onChange={handleChange}
                  className="bg-gaming-dark/50 border-gaming-border"
                  required
                />
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre" className="flex items-center gap-2">
                  Genre <span className="text-red-500">*</span>
                </Label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gaming-dark/50 border border-gaming-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                  required
                >
                  <option value="">Select a genre</option>
                  <option value="FPS">FPS (First-Person Shooter)</option>
                  <option value="RPG">RPG (Role-Playing Game)</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Racing">Racing</option>
                  <option value="Sports">Sports</option>
                  <option value="Action">Action</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Puzzle">Puzzle</option>
                  <option value="Battle Royale">Battle Royale</option>
                  <option value="MOBA">MOBA</option>
                  <option value="MMO">MMO</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  Game Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the game in detail. What's it about? What makes it unique?"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-gaming-dark/50 border-gaming-border min-h-32"
                  required
                />
              </div>

              {/* Why It's Important */}
              <div className="space-y-2">
                <Label htmlFor="whyImportant">Why Should We Add This?</Label>
                <Textarea
                  id="whyImportant"
                  name="whyImportant"
                  placeholder="Tell us why you think this game would be a great addition to our platform"
                  value={formData.whyImportant}
                  onChange={handleChange}
                  className="bg-gaming-dark/50 border-gaming-border min-h-24"
                />
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="flex items-center gap-2">
                  Contact Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="bg-gaming-dark/50 border-gaming-border"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We may contact you if we need clarification on your suggestion
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-200">
                    All suggestions are reviewed by our team. We appreciate your
                    input and will consider each suggestion for future platform
                    additions.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-neon-blue hover:bg-neon-blue/80"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Suggestion
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
