import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAuthToken, isAuthenticated } from "@/lib/auth-utils";
import type { NotificationItem } from "@shared/notifications";

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const authed = isAuthenticated();

  useEffect(() => {
    if (!authed) return;
    const load = async () => {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success) setItems(data.notifications);
    };
    load();
  }, [authed]);

  return (
    <div className="min-h-screen bg-gaming-dark">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black neon-text-blue mb-6 font-rounded">Notifications</h1>
        <div className="space-y-4">
          {items.map((n) => (
            <Card key={n.id} className="bg-gaming-card/80 border-gaming-border">
              <CardHeader>
                <CardTitle className="text-neon-purple">{n.title}</CardTitle>
                <CardDescription>{new Date(n.createdAt).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{n.message}</p>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-muted-foreground">No notifications.</div>
          )}
        </div>
      </div>
    </div>
  );
}
