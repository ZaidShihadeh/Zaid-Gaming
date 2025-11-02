import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateReportRequest, ReportResponse } from "@shared/reports";
import { getAuthToken } from "@/lib/auth-utils";

export default function RuleViolation() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/signin");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const reportData: CreateReportRequest = {
        type: "rule-violation",
        title,
        description,
        evidence: evidence || undefined,
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(reportData),
      });

      const data: ReportResponse = await response.json();

      if (data.success) {
        toast({
          title: "Rule Violation Report Submitted!",
          description:
            "We will respond to you soon. Check the Support & Reports page for updates.",
        });
        navigate("/contact");
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
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
                <p className="text-sm text-muted-foreground">
                  Rule Violation Reports
                </p>
              </div>
            </Link>
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-neon-blue hover:bg-neon-blue/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-neon-purple" />
            </div>
            <h2 className="text-3xl font-bold neon-text-purple mb-2">
              Report Rule Violation
            </h2>
            <p className="text-muted-foreground">
              Help us maintain a fair and respectful gaming environment by
              reporting rule violations.
            </p>
          </div>

          <Card className="bg-gaming-card/80 border-gaming-border">
            <CardHeader>
              <CardTitle className="text-neon-purple">
                Rule Violation Report
              </CardTitle>
              <CardDescription>
                Please provide detailed information about the rule violation to
                help us investigate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Violation Summary</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the rule violation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-gaming-dark/50 border-gaming-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the rule violation, who was involved, what rules were broken, when it happened..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-gaming-dark/50 border-gaming-border min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence">Evidence (Optional)</Label>
                  <Input
                    id="evidence"
                    placeholder="Screenshots, chat logs, video links, or other evidence"
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    className="bg-gaming-dark/50 border-gaming-border"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-neon-purple hover:bg-neon-purple/80"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
