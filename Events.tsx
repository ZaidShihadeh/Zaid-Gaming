import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAuthToken, isAuthenticated, getUserData } from "@/lib/auth-utils";
import type { EventItem } from "@shared/events";
import { Users, Calendar, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvpState, setRsvpState] = useState<
    Record<string, { rsvp: boolean; count: number }>
  >({});
  const authed = isAuthenticated();
  const user = getUserData();
  const isAdmin = !!user?.isAdmin;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchEvents = async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    if (data.success) setEvents(data.events);
  };

  const fetchRsvp = async (id: string) => {
    if (!authed) return;
    const res = await fetch(`/api/events/${id}/rsvp`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await res.json();
    if (data.success) {
      setRsvpState((s) => ({
        ...s,
        [id]: { rsvp: data.rsvp, count: data.count },
      }));
    }
  };

  const createEvent = async () => {
    if (!authed || !isAdmin) return;
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          title,
          description,
          startsAt,
          endsAt: endsAt || undefined,
          location,
          streamUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTitle("");
        setDescription("");
        setStartsAt("");
        setEndsAt("");
        setLocation("");
        setStreamUrl("");
        fetchEvents();
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleRsvp = async (id: string) => {
    if (!authed) return;
    const res = await fetch(`/api/events/${id}/rsvp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await res.json();
    if (data.success) {
      setRsvpState((s) => ({
        ...s,
        [id]: { rsvp: data.rsvp, count: data.count },
      }));
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (authed) {
      events.forEach((e) => fetchRsvp(e.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, events.length]);

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
          Events
        </h1>
        {authed && isAdmin && (
          <Card className="bg-gaming-card/80 border-gaming-border mb-6">
            <CardHeader>
              <CardTitle className="text-neon-purple">Create Event</CardTitle>
              <CardDescription>
                Add a new event for your community.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Starts at
                </label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Ends at (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
              <Input
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Input
                placeholder="Stream URL (optional)"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
              <div className="md:col-span-2">
                <Button
                  onClick={createEvent}
                  disabled={!title || !startsAt || creating}
                  className="bg-neon-blue hover:bg-neon-blue/80"
                >
                  {creating ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((e) => {
            const r = rsvpState[e.id];
            const start = new Date(e.startsAt).toLocaleString();
            const end = e.endsAt
              ? new Date(e.endsAt).toLocaleString()
              : undefined;
            return (
              <Card
                key={e.id}
                className="bg-gaming-card/80 border-gaming-border"
              >
                <CardHeader>
                  <CardTitle className="text-neon-purple">{e.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {start}
                        {end ? ` – ${end}` : ""}
                      </span>
                    </div>
                    {e.location && (
                      <div className="text-muted-foreground">{e.location}</div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {e.description && (
                    <p className="text-sm text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Users className="h-4 w-4" />
                      <span>{r?.count ?? 0} going</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.streamUrl && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-neon-blue border-neon-blue/50"
                        >
                          <a
                            href={e.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open stream link"
                          >
                            <LinkIcon className="h-4 w-4 mr-1" /> Watch
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={!authed}
                        onClick={() => toggleRsvp(e.id)}
                        className={
                          r?.rsvp
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-neon-blue hover:bg-neon-blue/80"
                        }
                        aria-pressed={r?.rsvp || false}
                      >
                        {r?.rsvp ? "RSVP’d" : "RSVP"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {events.length === 0 && (
            <div className="text-muted-foreground">No events yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
