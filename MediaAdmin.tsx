import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthToken, isAuthenticated, getUserData } from "@/lib/auth-utils";
import type { MediaItem } from "@shared/media";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function MediaAdmin() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const authed = isAuthenticated();
  const user = getUserData();
  const isAdmin = !!user?.isAdmin;

  const load = async () => {
    const res = await fetch("/api/media/pending", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await res.json();
    if (data.success) setItems(data.items);
  };

  const act = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/media/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    load();
  };

  useEffect(() => {
    if (authed && isAdmin) load();
  }, [authed, isAdmin]);

  if (!authed || !isAdmin) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-muted-foreground">Admins only.</div>
      </div>
    );
  }

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
          Review Submissions
        </h1>
        <div className="space-y-4">
          {items.map((m) => (
            <Card key={m.id} className="bg-gaming-card/80 border-gaming-border">
              <CardHeader>
                <CardTitle className="text-neon-purple">{m.title}</CardTitle>
                <CardDescription>
                  Submitted by {m.creditName} ·{" "}
                  {new Date(m.createdAt).toLocaleString()}
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => act(m.id, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => act(m.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-muted-foreground">No pending submissions.</div>
          )}
        </div>
      </div>
    </div>
  );
}
