import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lightbulb,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getUserData } from "@/lib/auth-utils";
import { GameSuggestion, UserGameSuggestionsResponse } from "@shared/game-suggestions";

export default function GameTracking() {
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      navigate("/signin");
      return;
    }

    fetchSuggestions();
  }, [navigate]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/game-suggestions/my", {
        credentials: "include",
      });

      const data: UserGameSuggestionsResponse = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch your suggestions.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your suggestions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "approved":
        return <CheckCircle className="h-5 w-5" />;
      case "rejected":
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Header */}
      <header className="border-b border-gaming-border bg-gaming-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/games"
              className="inline-flex items-center text-neon-blue hover:text-neon-purple transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Link>
            <h1 className="text-2xl font-bold neon-text-blue">
              Game Suggestions Tracking
            </h1>
            <Link to="/game-suggestions">
              <Button className="bg-neon-blue hover:bg-neon-blue/80">
                <Lightbulb className="mr-2 h-4 w-4" />
                New Suggestion
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <Card className="bg-gaming-card/50 border-gaming-border">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Lightbulb className="mx-auto h-16 w-16 text-neon-blue/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Suggestions Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't submitted any game suggestions yet.
                </p>
                <Link to="/game-suggestions">
                  <Button className="bg-neon-blue hover:bg-neon-blue/80">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Suggest a Game
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.id}
                className="bg-gaming-card/50 border-gaming-border hover:border-neon-blue transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">
                          {suggestion.gameTitle}
                        </CardTitle>
                        <Badge variant="outline">{suggestion.genre}</Badge>
                      </div>
                      <CardDescription>{suggestion.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(suggestion.status)}
                      <Badge className={getStatusColor(suggestion.status)}>
                        {getStatusText(suggestion.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {suggestion.whyImportant && (
                    <div>
                      <h4 className="font-semibold text-sm text-neon-blue mb-1">
                        Why It's Important
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.whyImportant}
                      </p>
                    </div>
                  )}

                  {suggestion.adminMessage && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h4 className="font-semibold text-sm text-blue-400 mb-2">
                        Admin Response
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.adminMessage}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gaming-border text-xs text-muted-foreground">
                    <span>
                      Submitted:{" "}
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </span>
                    {suggestion.updatedAt && (
                      <span>
                        Updated:{" "}
                        {new Date(suggestion.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
