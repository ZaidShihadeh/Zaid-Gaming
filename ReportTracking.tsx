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
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Report, UserReportsResponse } from "@shared/reports";
import { getAuthToken } from "@/lib/auth-utils";

export default function ReportTracking() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/signin");
      return;
    }

    fetchReports();
  }, [navigate]);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports/my", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data: UserReportsResponse = await response.json();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-neon-blue">Loading your reports...</div>
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
            <Link to="/" className="flex items-center space-x-4">
              <img
                src="https://cdn.builder.io/api/v1/assets/716fc715e6e8476097c77bcb6279b9ec/zaidgaming-7996ac?format=webp&width=800"
                alt="Zaid Gaming Logo"
                className="h-12 w-12 rounded-lg neon-glow"
              />
              <div>
                <h1 className="text-xl font-black neon-text-blue font-rounded">
                  Zaid Gaming
                </h1>
                <p className="text-sm text-muted-foreground">Report Tracking</p>
              </div>
            </Link>
            <Link to="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="text-neon-blue hover:bg-neon-blue/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold neon-text-blue mb-2">
              Your Report History
            </h2>
            <p className="text-muted-foreground">
              Track the status of your submitted reports
            </p>
          </div>

          {reports.length === 0 ? (
            <Card className="bg-gaming-card/80 border-gaming-border">
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No reports yet</h3>
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
                        <div>
                          <CardTitle className="text-lg">
                            {report.title}
                          </CardTitle>
                          <CardDescription className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant="outline"
                              className={
                                report.type === "bug"
                                  ? "text-neon-blue border-neon-blue/30"
                                  : "text-neon-purple border-neon-purple/30"
                              }
                            >
                              {report.type === "bug"
                                ? "Bug Report"
                                : "Rule Violation"}
                            </Badge>
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
                      <div className="bg-gaming-dark/50 rounded-lg p-4 border border-gaming-border">
                        <p className="text-sm font-medium text-neon-blue mb-2">
                          Admin Response:
                        </p>
                        <p className="text-sm">{report.adminMessage}</p>
                        {report.updatedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Updated:{" "}
                            {new Date(report.updatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
