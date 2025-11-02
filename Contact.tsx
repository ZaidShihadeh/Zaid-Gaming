import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  Mail,
  FileText,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth-utils";

interface ContactMessage {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "pending" | "in-progress" | "resolved";
  createdAt: string;
  response?: string;
  respondedAt?: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
  contactId?: string;
}

interface ContactListResponse {
  success: boolean;
  contacts: ContactMessage[];
}

interface ReportItem {
  id: string;
  type: "bug" | "rule-violation";
  title: string;
  description: string;
  evidence?: string;
  status: "pending" | "accepted" | "dismissed";
  createdAt: string;
  updatedAt?: string;
  adminMessage?: string;
}

interface UserReportsResponse {
  success: boolean;
  reports: ReportItem[];
}

export default function Contact() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingContacts, setExistingContacts] = useState<ContactMessage[]>(
    [],
  );
  const [showExisting, setShowExisting] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/signin");
      return;
    }

    fetchExistingContacts();
    fetchReports();
  }, [navigate]);

  const fetchExistingContacts = async () => {
    try {
      const response = await fetch("/api/contact/my", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        const data: ContactListResponse = await response.json();
        if (data.success) {
          setExistingContacts(data.contacts);
          setShowExisting(data.contacts.length > 0);
        }
      }
    } catch (error) {
      // Silently fail if contacts endpoint doesn't exist yet
      console.log("Contacts endpoint not available yet");
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports/my", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data: UserReportsResponse = await response.json();
      if (data.success) setReports(data.reports);
    } catch (error) {
      // ignore silently
    } finally {
      setReportsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const contactData = {
        subject: subject.trim(),
        category,
        message: message.trim(),
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(contactData),
      });

      const data: ContactResponse = await response.json();

      if (data.success) {
        toast({
          title: "Message Sent!",
          description:
            "We will respond to you soon. Check 'Your Messages' below for our reply.",
        });

        // Reset form
        setSubject("");
        setCategory("");
        setMessage("");

        // Refresh existing contacts and reveal list
        await fetchExistingContacts();
        setShowExisting(true);
        setTimeout(() => {
          messagesRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 200);
      } else {
        toast({
          title: "Error",
          description:
            data.message || "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in-progress":
        return <MessageSquare className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

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
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center text-neon-blue hover:text-neon-purple transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-neon-blue" />
              <span className="text-sm text-muted-foreground">
                Contact Support
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <Card className="mb-8 bg-gaming-card/80 border-gaming-border backdrop-blur-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <img
                  src="https://cdn.builder.io/api/v1/assets/716fc715e6e8476097c77bcb6279b9ec/zaidgaming-7996ac?format=webp&width=800"
                  alt="Zaid Gaming Logo"
                  className="h-16 w-16 rounded-lg neon-glow mx-auto"
                />
              </div>
              <CardTitle className="text-3xl font-bold neon-text-blue flex items-center justify-center">
                <MessageSquare className="mr-3 h-8 w-8" />
                Support & Reports
              </CardTitle>
              <CardDescription className="text-lg">
                Get help with your account and track your submitted reports
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-neon-blue">
                  Send a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24-48
                  hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="bg-gaming-dark/50 border-gaming-border"
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                      required
                    >
                      <SelectTrigger className="bg-gaming-dark/50 border-gaming-border">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-card border-gaming-border">
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">
                          Technical Support
                        </SelectItem>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-gaming-dark/50 border-gaming-border min-h-[120px]"
                      placeholder="Please provide detailed information about your inquiry..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-neon-blue hover:bg-neon-blue/80"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Messages */}
            {showExisting && (
              <Card
                ref={messagesRef}
                className="bg-gaming-card/80 border-gaming-border backdrop-blur-md"
              >
                <CardHeader>
                  <CardTitle className="text-xl text-neon-purple">
                    Your Messages
                  </CardTitle>
                  <CardDescription>
                    Track the status of your inquiries. We’ll notify you here
                    when we respond.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {existingContacts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No messages yet. Submit your first inquiry using the
                        form.
                      </p>
                    ) : (
                      existingContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="p-4 bg-gaming-dark/50 rounded-lg border border-gaming-border"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-neon-blue truncate">
                              {contact.subject}
                            </h4>
                            <Badge className={getStatusColor(contact.status)}>
                              {getStatusIcon(contact.status)}
                              <span className="ml-1 capitalize">
                                {contact.status.replace("-", " ")}
                              </span>
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2 capitalize">
                            Category: {contact.category}
                          </p>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {contact.message}
                          </p>

                          {contact.response && (
                            <div className="mt-3 p-3 bg-gaming-card/50 rounded border border-neon-blue/30">
                              <p className="text-sm font-medium text-neon-blue mb-1">
                                Support Response:
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {contact.response}
                              </p>
                              {contact.respondedAt && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Responded:{" "}
                                  {new Date(
                                    contact.respondedAt,
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted:{" "}
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Your Reports */}
        <div className="max-w-4xl mx-auto mt-8">
          <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl text-neon-blue flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Your Reports
              </CardTitle>
              <CardDescription>
                View the status of your bug and rule violation reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="text-muted-foreground">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any reports yet.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Link to="/bug-report">
                      <Button className="bg-neon-blue hover:bg-neon-blue/80">
                        Report Bug
                      </Button>
                    </Link>
                    <Link to="/rule-violation">
                      <Button className="bg-neon-purple hover:bg-neon-purple/80">
                        Report Violation
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-gaming-dark/50 rounded-lg border border-gaming-border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {r.status === "pending" ? (
                            <Clock className="h-4 w-4 text-yellow-400" />
                          ) : r.status === "accepted" ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge
                                variant="outline"
                                className={
                                  r.type === "bug"
                                    ? "text-neon-blue border-neon-blue/30"
                                    : "text-neon-purple border-neon-purple/30"
                                }
                              >
                                {r.type === "bug"
                                  ? "Bug Report"
                                  : "Rule Violation"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="font-medium">{r.title}</div>
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {r.description}
                            </div>
                            {r.adminMessage && (
                              <div className="mt-3 p-3 bg-gaming-card/50 rounded border border-neon-blue/30">
                                <p className="text-sm font-medium text-neon-blue mb-1">
                                  Admin Response:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {r.adminMessage}
                                </p>
                                {r.updatedAt && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Updated:{" "}
                                    {new Date(r.updatedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={
                            r.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : r.status === "accepted"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                          }
                        >
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
