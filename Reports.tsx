import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Bug,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Report,
  ReportsListResponse,
  UpdateReportRequest,
} from "@shared/reports";
import { getAuthToken, getUserData } from "@/lib/auth-utils";

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const navigate = useNavigate();

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

    fetchReports();
  }, [navigate]);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data: ReportsListResponse = await response.json();

      if (data.success) {
        setReports(data.reports);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch reports.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reports.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async (
    reportId: string,
    status: "accepted" | "dismissed",
    message: string,
  ) => {
    setActionLoading(reportId);

    try {
      const updateData: UpdateReportRequest = {
        reportId,
        status,
        adminMessage: message || undefined,
      };

      const response = await fetch("/api/reports/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        setReports(
          reports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status,
                  adminMessage: message,
                  updatedAt: new Date().toISOString(),
                }
              : report,
          ),
        );
        toast({
          title: "Success!",
          description: `Report ${status} successfully.`,
        });
        setSelectedReport(null);
        setAdminMessage("");
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${status} report.`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "dismissed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Accepted
          </Badge>
        );
      case "dismissed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Dismissed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "bug" ? (
      <Bug className="h-4 w-4 text-neon-blue" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-neon-purple" />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-neon-blue">Loading reports...</div>
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
                <p className="text-sm text-muted-foreground">
                  Reports Dashboard
                </p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/users">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neon-purple hover:bg-neon-purple/10"
                >
                  User Management
                </Button>
              </Link>
              <Link to="/contacts">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neon-pink hover:bg-neon-pink/10"
                >
                  Contact Inbox
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
              <Shield className="mr-2 h-6 w-6" />
              Reports Management
            </CardTitle>
            <CardDescription>
              Review and manage user-submitted reports
            </CardDescription>
          </CardHeader>
        </Card>

        {reports.length === 0 ? (
          <Card className="bg-gaming-card/80 border-gaming-border">
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports yet</h3>
              <p className="text-muted-foreground">
                No reports have been submitted yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="bg-gaming-card/80 border-gaming-border"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(report.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getTypeIcon(report.type)}
                          <CardTitle className="text-lg">
                            {report.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="flex items-center space-x-2">
                          <span>From: {report.reporterName}</span>
                          <span>•</span>
                          <span>{report.reporterEmail}</span>
                          <span>•</span>
                          <span>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {report.description}
                  </p>
                  {report.evidence && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Evidence:</p>
                      <p className="text-sm text-muted-foreground">
                        {report.evidence}
                      </p>
                    </div>
                  )}
                  {report.adminMessage && (
                    <div className="bg-gaming-dark/50 rounded-lg p-4 border border-gaming-border mb-4">
                      <p className="text-sm font-medium text-neon-blue mb-2">
                        Admin Response:
                      </p>
                      <p className="text-sm">{report.adminMessage}</p>
                    </div>
                  )}
                  {report.status === "pending" && (
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setSelectedReport(report)}
                          >
                            Accept
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gaming-card border-gaming-border">
                          <DialogHeader>
                            <DialogTitle className="text-green-400">
                              Accept Report
                            </DialogTitle>
                            <DialogDescription>
                              Accept this report and optionally leave a message
                              for the user.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="message">
                              Message to user (optional)
                            </Label>
                            <Textarea
                              id="message"
                              value={adminMessage}
                              onChange={(e) => setAdminMessage(e.target.value)}
                              className="bg-gaming-dark/50 border-gaming-border mt-2"
                              placeholder="Thank you for your report. We have taken appropriate action..."
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() =>
                                selectedReport &&
                                handleReportAction(
                                  selectedReport.id,
                                  "accepted",
                                  adminMessage,
                                )
                              }
                              className="bg-green-600 hover:bg-green-700"
                              disabled={actionLoading === report.id}
                            >
                              {actionLoading === report.id
                                ? "Accepting..."
                                : "Accept Report"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSelectedReport(report)}
                          >
                            Dismiss
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gaming-card border-gaming-border">
                          <DialogHeader>
                            <DialogTitle className="text-red-400">
                              Dismiss Report
                            </DialogTitle>
                            <DialogDescription>
                              Dismiss this report and optionally leave a message
                              explaining why.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="dismiss-message">
                              Message to user (optional)
                            </Label>
                            <Textarea
                              id="dismiss-message"
                              value={adminMessage}
                              onChange={(e) => setAdminMessage(e.target.value)}
                              className="bg-gaming-dark/50 border-gaming-border mt-2"
                              placeholder="Thank you for your report. After investigation, we found..."
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() =>
                                selectedReport &&
                                handleReportAction(
                                  selectedReport.id,
                                  "dismissed",
                                  adminMessage,
                                )
                              }
                              variant="destructive"
                              disabled={actionLoading === report.id}
                            >
                              {actionLoading === report.id
                                ? "Dismissing..."
                                : "Dismiss Report"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
