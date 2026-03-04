import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, Gamepad2, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Game {
  id: number;
  category: string;
  name: string;
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // We have the gameId from the URL, so we can use it directly
    if (gameId) {
      const id = parseInt(gameId);
      // Create a basic game object with the ID (we have the category from games list)
      // For now, just use generic naming
      const categoryMap: Record<number, string> = {
        1: "Platform", 2: "Action", 3: "Adventure", 4: "Puzzle", 5: "Racing"
      };
      
      // Try to determine category, default to "Game"
      let categoryIndex = (id % 19) + 1;
      const categories = [
        "Action", "Adventure", "Car", "Casual", "Clicker",
        "Fighting", "IO Games", "Kids", "Multiplayer", "Parkour",
        "Platform", "Puzzle", "Racing", "Running", "School",
        "Shooting", "Skill", "Sport", "Two Player"
      ];
      
      const gameCategory = categories[categoryIndex % categories.length];
      
      setGame({
        id,
        category: gameCategory,
        name: `${gameCategory} ${id}`,
      });
      setIsLoading(false);
    }
  }, [gameId]);

  const handleOpenInNewTab = () => {
    if (!game) return;
    window.open(`https://math321.lol/_lessons/${game.id}`, "_blank", "width=1200,height=800");
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/games");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Gamepad2 className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">Game not found</p>
          <Button
            onClick={() => navigate("/games")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Back to Games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Loading overlay */}
      {!iframeLoaded && (
        <div className="absolute inset-0 z-40 bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading game...</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={`https://math321.lol/_lessons/${game.id}`}
        title={game.name}
        className="w-full h-full border-0"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        onLoad={() => setIframeLoaded(true)}
        onError={() => {
          setIframeLoaded(true);
          console.error("Failed to load game iframe");
        }}
      />

      {/* Always-visible control bar at top */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        {/* Back Button */}
        <button
          onClick={() => navigate("/games")}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 rounded transition-colors"
          title="Back to games (ESC)"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Game Title */}
        <div className="hidden sm:block text-white text-center text-sm">
          <p className="font-bold">{game.name}</p>
          <p className="text-xs text-gray-400">{game.category}</p>
        </div>

        {/* Open in New Tab Button */}
        <button
          onClick={handleOpenInNewTab}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 rounded transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="text-sm font-medium">New Tab</span>
        </button>
      </div>

      {/* Bottom hint */}
      <div
        className="absolute bottom-4 left-4 text-white text-xs text-gray-400"
        style={{ animation: "fadeOut 5s ease-in-out forwards" }}
      >
        <style>{`
          @keyframes fadeOut {
            0% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
        <p>Press ESC to go back</p>
      </div>
    </div>
  );
}
