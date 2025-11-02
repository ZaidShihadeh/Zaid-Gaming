import { useEffect, useState } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Inbox,
  Clock,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken, getUserData } from "@/lib/auth-utils";

interface ContactMessage {
  id: string;
  userId: string;
  subject: string;
  category: string;
  message: string;
  status: "pending" | "in-progress" | "resolved";
  createdAt: string;
  response?: string;
  respondedAt?: string;
}

interface ContactListResponse {
  success: boolean;
  contacts: ContactMessage[];
}

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = getUserData();
    const token = getAuthToken();

    if (!userData || !token) {
      navigate("/signin");
      return;
    }

    if (!userData.isAdmin) {
      navigate("/profile");
      return;
    }

    fetchContacts();
  }, [navigate]);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contact", {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data: ContactListResponse = await res.json();
      if (data.success) setContacts(data.contacts);
      else
        toast({
          title: "Error",
          description: "Failed to fetch contacts.",
          variant: "destructive",
        });
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch contacts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateContact = async (
    contactId: string,
    status: "pending" | "in-progress" | "resolved",
    response?: string,
  ) => {
    setActionLoading(contactId);
    try {
      const res = await fetch("/api/contact/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ contactId, status, response }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Updated",
          description: "Contact updated successfully.",
        });
        setAdminResponse("");
        setSelectedId(null);
        fetchContacts();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update contact.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update contact.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: ContactMessage["status"]) => {
    if (status === "pending")
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          Pending
        </Badge>
      );
    if (status === "in-progress")
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          In Progress
        </Badge>
      );
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        Resolved
      </Badge>
    );
  };

  const statusIcon = (status: ContactMessage["status"]) => {
    if (status === "pending")
      return <Clock className="h-4 w-4 text-yellow-400" />;
    if (status === "in-progress")
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
    return <CheckCircle className="h-4 w-4 text-green-400" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-neon-blue">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <div
        className={
          'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23404040" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-20'
        }
      ></div>

      <header className="relative z-10 border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/users" className="flex items-center space-x-4">
              <img
                src="https://cdn.builder.io/api/v1/assets/716fc715e6e8476097c77bcb6279b9ec/zaidgaming-7996ac?format=webp&width=800"
                alt="Zaid Gaming Logo"
                className="h-12 w-12 rounded-lg neon-glow"
              />
              <div>
                <h1 className="text-xl font-black neon-text-blue font-rounded">
                  Zaid Gaming
                </h1>
                <p className="text-sm text-muted-foreground">Contact Inbox</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/reports">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neon-purple hover:bg-neon-purple/10"
                >
                  Manage Reports
                </Button>
              </Link>
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neon-blue hover:bg-neon-blue/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Card className="bg-gaming-card/80 border-gaming-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-neon-blue">
              <Inbox className="mr-2 h-6 w-6" />
              Contacts Management
            </CardTitle>
            <CardDescription>
              Review and respond to user contact messages
            </CardDescription>
          </CardHeader>
        </Card>

        {contacts.length === 0 ? (
          <Card className="bg-gaming-card/80 border-gaming-border">
            <CardContent className="text-center py-8">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                No contact messages have been submitted yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contacts.map((c) => (
              <Card
                key={c.id}
                className="bg-gaming-card/80 border-gaming-border"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {statusIcon(c.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-lg">{c.subject}</CardTitle>
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-gaming-border capitalize"
                          >
                            {c.category}
                          </Badge>
                        </div>
                        <CardDescription>
                          <span>{new Date(c.createdAt).toLocaleString()}</span>
                        </CardDescription>
                      </div>
                    </div>
                    {statusBadge(c.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{c.message}</p>
                  {c.response && (
                    <div className="bg-gaming-dark/50 rounded-lg p-4 border border-gaming-border mb-4">
                      <p className="text-sm font-medium text-neon-blue mb-2">
                        Admin Response:
                      </p>
                      <p className="text-sm">{c.response}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={actionLoading === c.id}
                      onClick={() => updateContact(c.id, "in-progress")}
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={actionLoading === c.id}
                      onClick={() => updateContact(c.id, "resolved")}
                    >
                      Mark Resolved
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor={`resp-${c.id}`}>
                      Send Response (optional)
                    </Label>
                    <Textarea
                      id={`resp-${c.id}`}
                      value={selectedId === c.id ? adminResponse : ""}
                      onChange={(e) => {
                        setSelectedId(c.id);
                        setAdminResponse(e.target.value);
                      }}
                      className="bg-gaming-dark/50 border-gaming-border mt-2"
                      placeholder="Thanks for reaching out..."
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={() =>
                          updateContact(c.id, c.status, adminResponse)
                        }
                        disabled={
                          actionLoading === c.id || !adminResponse.trim()
                        }
                        className="bg-neon-blue hover:bg-neon-blue/80"
                      >
                        Send Response
                      </Button>
                    </div>
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
