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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lightbulb,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  GameSuggestion,
  GameSuggestionsListResponse,
  UpdateGameSuggestionRequest,
} from "@shared/game-suggestions";
import { getUserData } from "@/lib/auth-utils";

export default function GameSuggestionsAdmin() {
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<GameSuggestion | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUserData();
    if (!userData || !userData.isAdmin) {
      navigate("/profile");
      return;
    }

    fetchSuggestions();
  }, [navigate]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/game-suggestions", {
        credentials: "include",
      });

      const data: GameSuggestionsListResponse = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch game suggestions.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch game suggestions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionAction = async (
    suggestionId: string,
    status: "approved" | "rejected",
    message: string
  ) => {
    setActionLoading(suggestionId);

    try {
      const updateData: UpdateGameSuggestionRequest = {
        id: suggestionId,
        status,
        adminMessage: message || undefined,
      };

      const response = await fetch("/api/game-suggestions/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(
          suggestions.map((s) => (s.id === suggestionId ? data.suggestion : s))
        );
        toast({
          title: "Success",
          description: `Suggestion ${status === "approved" ? "approved" : "rejected"}.`,
        });
        setSelectedSuggestion(null);
        setAdminMessage("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update suggestion.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update suggestion.",
      });
    } finally {
      setActionLoading(null);
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

  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");
  const reviewedSuggestions = suggestions.filter((s) => s.status !== "pending");

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Header */}
      <header className="border-b border-gaming-border bg-gaming-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/admin"
              className="inline-flex items-center text-neon-blue hover:text-neon-purple transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold neon-text-blue">
              Game Suggestions Management
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading suggestions...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gaming-card/50 border-gaming-border">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      {pendingSuggestions.length}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Pending Review
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gaming-card/50 border-gaming-border">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {suggestions.filter((s) => s.status === "approved")
                        .length}
                    </div>
                    <p className="text-muted-foreground text-sm">Approved</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gaming-card/50 border-gaming-border">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400 mb-2">
                      {suggestions.filter((s) => s.status === "rejected").length}
                    </div>
                    <p className="text-muted-foreground text-sm">Rejected</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Suggestions */}
            {pendingSuggestions.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">
                  Pending Review ({pendingSuggestions.length})
                </h2>
                <div className="space-y-4">
                  {pendingSuggestions.map((suggestion) => (
                    <Card
                      key={suggestion.id}
                      className="bg-gaming-card/50 border-gaming-border hover:border-yellow-400 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">
                                {suggestion.gameTitle}
                              </CardTitle>
                              <Badge variant="outline">
                                {suggestion.genre}
                              </Badge>
                            </div>
                            <CardDescription>
                              {suggestion.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-neon-blue mb-1">
                            Why It's Important
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.whyImportant ||
                              "No reason provided"}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Suggested by: {suggestion.userName}
                          </span>
                          <span>{suggestion.userEmail}</span>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setSelectedSuggestion(suggestion);
                                  setAdminMessage("");
                                }}
                                className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/50"
                                variant="outline"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gaming-card border-gaming-border">
                              <DialogHeader>
                                <DialogTitle>Approve Suggestion</DialogTitle>
                                <DialogDescription>
                                  {suggestion.gameTitle}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Message (Optional)</Label>
                                  <Textarea
                                    placeholder="Leave a message for the user..."
                                    value={adminMessage}
                                    onChange={(e) =>
                                      setAdminMessage(e.target.value)
                                    }
                                    className="bg-gaming-dark/50 border-gaming-border mt-2"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() =>
                                    handleSuggestionAction(
                                      suggestion.id,
                                      "approved",
                                      adminMessage
                                    )
                                  }
                                  disabled={
                                    actionLoading === suggestion.id
                                  }
                                  className="bg-green-600 hover:bg-green-600/80"
                                >
                                  Approve
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setSelectedSuggestion(suggestion);
                                  setAdminMessage("");
                                }}
                                className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50"
                                variant="outline"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gaming-card border-gaming-border">
                              <DialogHeader>
                                <DialogTitle>Reject Suggestion</DialogTitle>
                                <DialogDescription>
                                  {suggestion.gameTitle}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Reason (Optional)</Label>
                                  <Textarea
                                    placeholder="Explain why you're rejecting this suggestion..."
                                    value={adminMessage}
                                    onChange={(e) =>
                                      setAdminMessage(e.target.value)
                                    }
                                    className="bg-gaming-dark/50 border-gaming-border mt-2"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() =>
                                    handleSuggestionAction(
                                      suggestion.id,
                                      "rejected",
                                      adminMessage
                                    )
                                  }
                                  disabled={
                                    actionLoading === suggestion.id
                                  }
                                  className="bg-red-600 hover:bg-red-600/80"
                                >
                                  Reject
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Reviewed Suggestions */}
            {reviewedSuggestions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-neon-blue mb-4">
                  Reviewed Suggestions
                </h2>
                <div className="space-y-3">
                  {reviewedSuggestions.map((suggestion) => (
                    <Card
                      key={suggestion.id}
                      className="bg-gaming-card/50 border-gaming-border"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                {suggestion.gameTitle}
                              </h3>
                              <Badge
                                className={
                                  getStatusColor(suggestion.status)
                                }
                              >
                                {suggestion.status === "approved"
                                  ? "Approved"
                                  : "Rejected"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {suggestion.description}
                            </p>
                            {suggestion.adminMessage && (
                              <div className="mt-2 p-2 bg-blue-500/10 rounded text-sm text-muted-foreground">
                                <MessageSquare className="inline mr-1 h-3 w-3" />
                                {suggestion.adminMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length === 0 && (
              <Card className="bg-gaming-card/50 border-gaming-border">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <Lightbulb className="mx-auto h-16 w-16 text-neon-blue/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No Suggestions Yet
                    </h3>
                    <p className="text-muted-foreground">
                      No game suggestions have been submitted yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
