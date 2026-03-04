import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  ArrowLeft,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react";
import { isAuthenticated } from "@/lib/auth-utils";
import { Input } from "@/components/ui/input";

interface Game {
  id: number;
  category: string;
  name: string;
}

const GAME_CATEGORIES = [
  "Action",
  "Adventure",
  "Car",
  "Casual",
  "Clicker",
  "Fighting",
  "IO Games",
  "Kids",
  "Multiplayer",
  "Parkour",
  "Platform",
  "Puzzle",
  "Racing",
  "Running",
  "School",
  "Shooting",
  "Skill",
  "Sport",
  "Two Player",
];

export default function Games() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
  }, []);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/games");
      const data = await response.json();
      if (data.success && data.games) {
        setGames(data.games);
        setFilteredGames(data.games);
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterGames(query, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterGames(searchQuery, category);
  };

  const filterGames = (search: string, category: string) => {
    let filtered = games;

    if (category !== "all") {
      filtered = filtered.filter((g) => g.category === category);
    }

    if (search.trim()) {
      filtered = filtered.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    setFilteredGames(filtered);
  };

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Header */}
      <div className="border-b border-gaming-border bg-gaming-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex items-center text-neon-blue hover:text-neon-purple transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-6 w-6 text-neon-blue" />
                <h1 className="text-2xl font-bold neon-text-blue">Games</h1>
                <span className="text-sm text-muted-foreground ml-2">
                  ({filteredGames.length})
                </span>
              </div>
            </div>
            {isLoggedIn && (
              <Button
                onClick={() => navigate("/profile")}
                variant="outline"
                className="border-gaming-border hover:bg-gaming-dark hidden sm:flex"
              >
                Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-gaming-dark/50 border-gaming-border text-white placeholder:text-muted-foreground"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Categories:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => handleCategoryChange("all")}
              className={`text-xs h-9 ${
                selectedCategory === "all"
                  ? "bg-neon-blue text-gaming-dark hover:bg-neon-blue/90"
                  : "border-gaming-border hover:bg-gaming-dark/50"
              }`}
            >
              All Games
            </Button>
            {GAME_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => handleCategoryChange(category)}
                className={`text-xs h-9 ${
                  selectedCategory === category
                    ? "bg-neon-purple text-gaming-dark hover:bg-neon-purple/90"
                    : "border-gaming-border hover:bg-gaming-dark/50"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-muted-foreground">Loading games...</div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No games found</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}

        {/* Info Footer */}
        {filteredGames.length > 0 && (
          <div className="mt-12 p-6 bg-gaming-card/50 border border-gaming-border rounded-lg text-center text-sm text-muted-foreground">
            <p>
              Showing {filteredGames.length} of {games.length} games from{" "}
              <a
                href="https://math321.lol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-blue hover:text-neon-purple underline"
              >
                math321.lol
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  return (
    <Link
      to={`/games/${game.id}`}
      className="group relative overflow-hidden rounded-lg bg-gaming-card/80 border border-gaming-border hover:border-neon-blue hover:shadow-lg hover:shadow-neon-blue/50 transition-all duration-300 block"
    >
      {/* Game Thumbnail */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-gaming-dark to-gaming-card/50 flex items-center justify-center overflow-hidden">
        <img
          src={`https://math321.lol/_lessonr/${game.id}.webp`}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

        {/* Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ExternalLink className="h-6 w-6 text-neon-blue drop-shadow-lg" />
        </div>
      </div>

      {/* Game Info */}
      <div className="p-2">
        <p className="text-xs text-muted-foreground truncate">
          {game.category}
        </p>
        <p className="text-sm font-medium text-white truncate group-hover:text-neon-blue transition-colors">
          {game.name}
        </p>
      </div>
    </Link>
  );
}
