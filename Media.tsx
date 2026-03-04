import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isAuthenticated } from "@/lib/auth-utils";
import { apiGet, apiPost } from "@/lib/api-client";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { MediaItem, CommentItem } from "@shared/media";

export default function Media() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [comments, setComments] = useState<Record<string, CommentItem[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const authed = isAuthenticated();

  const load = async () => {
    try {
      const data = await apiGet("/api/media");
      if (data.success) setItems(data.items);
    } catch (error) {
      toast.error("Failed to load media");
      console.error(error);
    }
  };

  const post = async () => {
    if (!authed) return;
    try {
      const data = await apiPost("/api/media", { title, url });
      if (data.success) {
        setTitle("");
        setUrl("");
        toast.success("Media submitted for moderation");
        load();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post media");
      console.error(error);
    }
  };

  const loadComments = async (id: string) => {
    try {
      const data = await apiGet(`/api/media/${id}/comments`);
      if (data.success) setComments((c) => ({ ...c, [id]: data.comments }));
    } catch (error) {
      toast.error("Failed to load comments");
      console.error(error);
    }
  };

  const addComment = async (id: string, message: string) => {
    if (!authed) return;
    try {
      const data = await apiPost(`/api/media/${id}/comments`, { message });
      if (data.success) {
        loadComments(id);
        toast.success("Comment added");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gaming-dark">
      <header className="relative z-10 border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center text-neon-blue hover:text-neon-purple transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          {authed && (
            <Button
              variant="outline"
              size="sm"
              className="text-neon-blue"
              onClick={() => setShowCreate((s) => !s)}
            >
              {showCreate ? "Close" : "Create"}
            </Button>
          )}
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black neon-text-blue mb-6 font-rounded">
          Media Hub
        </h1>
        {authed && showCreate && (
          <Card className="bg-gaming-card/80 border-gaming-border mb-6">
            <CardHeader>
              <CardTitle className="text-neon-purple">Share a clip</CardTitle>
              <CardDescription>
                Post a title and a public URL (YouTube, image, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                onClick={post}
                disabled={!title || !url}
                className="bg-neon-blue hover:bg-neon-blue/80"
              >
                Post
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="space-y-6">
          {items.map((m) => (
            <Card key={m.id} className="bg-gaming-card/80 border-gaming-border">
              <CardHeader>
                <CardTitle className="text-neon-purple">{m.title}</CardTitle>
                <CardDescription>
                  {new Date(m.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-blue underline"
                >
                  Open
                </a>
                <div>
                  <h3 className="font-semibold mb-2">Comments</h3>
                  <div className="space-y-2">
                    {(comments[m.id] || []).map((c) => (
                      <div key={c.id} className="text-sm text-muted-foreground">
                        {c.message}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadComments(m.id)}
                      className="text-neon-blue"
                    >
                      Load comments
                    </Button>
                  </div>
                  {authed && (
                    <CommentForm onSubmit={(msg) => addComment(m.id, msg)} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-muted-foreground">No media yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentForm({ onSubmit }: { onSubmit: (msg: string) => void }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="mt-3 space-y-2">
      <Textarea
        placeholder="Write a comment"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <Button
        onClick={() => {
          if (msg.trim()) {
            onSubmit(msg.trim());
            setMsg("");
          }
        }}
        size="sm"
        className="bg-neon-blue hover:bg-neon-blue/80"
      >
        Comment
      </Button>
    </div>
  );
}
