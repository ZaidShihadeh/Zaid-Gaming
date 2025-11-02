import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@shared/media";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Clips() {
  const [items, setItems] = useState<MediaItem[]>([]);

  const load = async () => {
    const res = await fetch("/api/media?status=approved");
    const data = await res.json();
    if (data.success) setItems(data.items);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gaming-dark">
      <header className="relative z-10 border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="flex items-center text-neon-blue hover:text-neon-purple transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black neon-text-blue mb-6 font-rounded">
          Gamer Clips
        </h1>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((m) => (
            <Card key={m.id} className="bg-gaming-card/80 border-gaming-border">
              <CardHeader>
                <CardTitle className="text-neon-purple">{m.title}</CardTitle>
                <CardDescription>
                  by {m.creditName} · {new Date(m.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-blue underline"
                >
                  Open
                </a>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-muted-foreground">No clips yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
