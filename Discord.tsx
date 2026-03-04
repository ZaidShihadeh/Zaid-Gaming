import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Bug,
  Shield,
  Users,
  MessageSquareWarning,
  ArrowLeft,
} from "lucide-react";
import { DiscordIcon } from "@/components/DiscordIcon";

export default function Discord() {
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
                  Discord Community
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

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight text-balance bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
              DISCORD COMMUNITY
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our Discord server to connect with fellow gamers, participate
              in events, and help us maintain a fair gaming environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25"
              >
                <a
                  href="https://discord.gg/CQxUGY2CWM"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DiscordIcon className="mr-2 h-5 w-5" />
                  Join Discord Server
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 neon-text-purple">
            Community Features
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gaming-card/80 border-gaming-border hover:border-neon-blue/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/10">
              <CardHeader>
                <div className="w-12 h-12 bg-neon-blue/20 rounded-lg flex items-center justify-center mb-4">
                  <Bug className="h-6 w-6 text-neon-blue" />
                </div>
                <CardTitle className="text-neon-blue">Bug Reporting</CardTitle>
                <CardDescription>
                  Found a glitch or technical issue? Report it here to help
                  improve our gaming experience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/bug-report">
                  <Button
                    variant="ghost"
                    className="w-full text-neon-blue hover:bg-neon-blue/10"
                  >
                    Submit Bug Report
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gaming-card/80 border-gaming-border hover:border-neon-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/10">
              <CardHeader>
                <div className="w-12 h-12 bg-neon-purple/20 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquareWarning className="h-6 w-6 text-neon-purple" />
                </div>
                <CardTitle className="text-neon-purple">
                  Rule Violations
                </CardTitle>
                <CardDescription>
                  Report players who are breaking community rules to maintain a
                  fair gaming environment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/rule-violation">
                  <Button
                    variant="ghost"
                    className="w-full text-neon-purple hover:bg-neon-purple/10"
                  >
                    Report Violation
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gaming-card/80 border-gaming-border hover:border-neon-pink/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-pink/10">
              <CardHeader>
                <div className="w-12 h-12 bg-neon-pink/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-neon-pink" />
                </div>
                <CardTitle className="text-neon-pink">Community</CardTitle>
                <CardDescription>
                  Connect with fellow gamers, participate in events, and join
                  gaming sessions together.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full text-neon-pink hover:bg-neon-pink/10"
                  onClick={() =>
                    window.open("https://discord.gg/CQxUGY2CWM", "_blank")
                  }
                >
                  <DiscordIcon className="mr-2 h-4 w-4" />
                  Join Discord
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Discord Rules Section */}
      <section className="relative z-10 py-16 px-4 bg-gaming-card/40">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 neon-text-blue">
            Community Guidelines
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gaming-card/60 border-gaming-border">
              <CardHeader>
                <CardTitle className="text-neon-blue flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Rules & Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Be respectful to all community members</p>
                <p>• No harassment, bullying, or hate speech</p>
                <p>• Keep content appropriate and family-friendly</p>
                <p>• No cheating or exploiting in games</p>
                <p>• Use appropriate channels for different topics</p>
              </CardContent>
            </Card>

            <Card className="bg-gaming-card/60 border-gaming-border">
              <CardHeader>
                <CardTitle className="text-neon-purple flex items-center">
                  <Bug className="mr-2 h-5 w-5" />
                  Reporting Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Report bugs through our bug report system</p>
                <p>• Use rule violation reports for misconduct</p>
                <p>• Provide detailed information when reporting</p>
                <p>• Include evidence when possible</p>
                <p>• Allow time for moderation team review</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gaming-border bg-gaming-card/80 py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            Join our Discord community and become part of the Zaid Gaming
            family.
          </p>
          <div className="flex justify-center mt-4">
            <Badge
              variant="outline"
              className="text-neon-blue border-neon-blue/50"
            >
              Discord Community
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
