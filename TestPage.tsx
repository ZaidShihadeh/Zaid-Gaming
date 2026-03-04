import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Gamepad2, Search } from "lucide-react";
import { getUserData } from "@/lib/auth-utils";
import { toast } from "@/hooks/use-toast";

interface Game {
  id: number;
  name: string;
  category: string;
}

export default function TestPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const user = getUserData();
    if (!user) {
      navigate("/signin");
      return;
    }

    // Check if user has test status
    if ((user as any).status !== "test") {
      navigate("/");
      return;
    }

    fetchGames();
  }, [navigate]);

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/games", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.games) {
        setGames(data.games);
        setFilteredGames(data.games);

        // Extract unique categories
        const uniqueCategories = [
          "all",
          ...Array.from(new Set(data.games.map((g: Game) => g.category))).sort(),
        ];
        setCategories(uniqueCategories as string[]);
      } else {
        toast({
          title: "Error",
          description: "Failed to load games",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load games",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter games based on search query and selected category
    let filtered = games;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((g) => g.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.category.toLowerCase().includes(query)
      );
    }

    setFilteredGames(filtered);
  }, [searchQuery, selectedCategory, games]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-neon-blue text-lg">Loading all games...</div>
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
          <Link
            to="/"
            className="flex items-center text-neon-blue hover:text-neon-purple transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <Card className="bg-gaming-card/80 border-gaming-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-neon-blue">
              <Gamepad2 className="mr-2 h-6 w-6" />
              All Games
            </CardTitle>
            <CardDescription>
              Browse and play all {games.length} available games in one place
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search and Filter Section */}
        <div className="bg-gaming-card/80 border border-gaming-border rounded-lg p-4 mb-6">
          {/* Search Bar */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neon-blue" />
            <Input
              type="text"
              placeholder="Search games by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gaming-dark/50 border-gaming-border"
            />
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-neon-purple mb-2 uppercase">
              Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  className={
                    selectedCategory === cat
                      ? "bg-neon-blue text-gaming-dark hover:bg-neon-blue/80"
                      : "text-neon-blue border-neon-blue/30 hover:bg-neon-blue/10"
                  }
                >
                  {cat === "all"
                    ? "All Categories"
                    : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredGames.length} of {games.length} games
            {selectedCategory !== "all" && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* Games Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredGames.map((game) => (
              <Button
                key={game.id}
                asChild
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-4 text-center bg-gaming-dark/50 border-gaming-border hover:border-neon-blue/50 hover:bg-gaming-dark/80 transition-all"
              >
                <Link to={`/game/${game.id}`} className="w-full h-full flex flex-col items-center justify-center">
                  <Gamepad2 className="h-6 w-6 text-neon-blue mb-2" />
                  <p className="text-sm font-semibold text-neon-blue line-clamp-2">
                    {game.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {game.category}
                  </p>
                </Link>
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">
              {searchQuery
                ? "No games found matching your search"
                : "No games available"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
