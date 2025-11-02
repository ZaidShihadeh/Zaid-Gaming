import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Scale,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TermsAndConditions() {
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
              <MessageSquare className="h-5 w-5 text-neon-purple" />
              <span className="text-sm text-muted-foreground">
                Community Guidelines
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
                <FileText className="mr-3 h-8 w-8" />
                Community Rules & Guidelines
              </CardTitle>
              <CardDescription className="text-lg">
                Please read these community guidelines to understand how we
                operate
              </CardDescription>
              <div className="flex items-center justify-center space-x-4 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Last Updated: August 2, 2025
                </div>
                <div>Version 1.0</div>
              </div>
            </CardHeader>
          </Card>

          {/* Community Rules Content */}
          <div className="space-y-6">
            <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-neon-blue">
                  1. Welcome to Our Community
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  By joining Zaid Gaming, you become part of our gaming
                  community. These guidelines help us maintain a positive and
                  enjoyable environment for everyone.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  These guidelines outline how our community operates and what
                  we expect from all members to ensure everyone has a great
                  experience.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-neon-blue">
                  2. Community Behavior
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To keep our community fun and welcoming for everyone, we ask
                  that you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Be respectful to all community members</li>
                  <li>Keep your account information up to date</li>
                  <li>Protect your account by keeping your password secure</li>
                  <li>Let us know if you notice any security issues</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-neon-purple">Things to avoid:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Harassment, bullying, or threats toward other users</li>
                  <li>Posting spam or unwanted promotional content</li>
                  <li>Sharing inappropriate or offensive content</li>
                  <li>Attempting to disrupt or break our platform</li>
                  <li>Creating fake accounts or impersonating others</li>
                  <li>Sharing other people's personal information</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-neon-blue">
                  3. Keeping Things Fun
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our moderators help keep the community enjoyable for everyone.
                  If something isn't working well, we might:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Remove content that doesn't fit our community vibe</li>
                  <li>Give friendly reminders about our guidelines</li>
                  <li>Take a break from someone who needs to cool down</li>
                  <li>Use tools to help keep things running smoothly</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  If you think we made a mistake, just reach out through our
                  contact form. We're always happy to chat and make things
                  right!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-neon-blue">
                  4. Fair Play and Respect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our community thrives on mutual respect and fair play. We
                  expect all members to treat each other with kindness and
                  consideration.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-neon-purple">
                    What we encourage:
                  </strong>
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Helping new members learn and improve</li>
                  <li>Sharing gaming tips and strategies</li>
                  <li>Participating in community events</li>
                  <li>Reporting issues when you see them</li>
                  <li>Being patient with others who are learning</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Remember, we're all here to have fun and enjoy gaming
                  together!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-neon-blue">
                  5. Questions or Concerns?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have any questions about our community guidelines, just
                  reach out!
                </p>
                <div className="bg-gaming-dark/50 rounded-lg p-4 space-y-4">
                  <p className="text-neon-blue font-medium">
                    Zaid Gaming Support
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-white rounded-lg transition-colors"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Support & Reports
                  </Link>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  We're here to help and always happy to chat!
                </p>
              </CardContent>
            </Card>

            {/* Footer */}
            <Card className="bg-gaming-card/80 border-gaming-border backdrop-blur-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Thanks for being part of our gaming community! Following
                    these guidelines helps keep things fun for everyone.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                    <span>🎮 Zaid Gaming Community</span>
                    <span>•</span>
                    <span>Have fun and be awesome!</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
