import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// Shared types (from project root)
import type {
  User,
  SignInRequest,
  SignUpRequest,
  UpdateProfileRequest,
  ChangeEmailRequest,
} from "../auth";
import type { EventItem, CreateEventRequest } from "../events";
import type { NotificationItem } from "../notifications";
import type {
  MediaItem,
  CommentItem,
  CreateMediaRequest,
  MediaStatus,
} from "../media";
import type { CreateReportRequest } from "../reports";
import type { CreateGameSuggestionRequest } from "../game-suggestions";

// Supabase database client
import {
  initializeDatabase,
  getUserByEmail,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getApprovedMedia,
  getPendingMedia,
  createMedia,
  updateMediaStatus,
  getComments,
  createComment,
  getAllEvents,
  createEvent,
  getEventRsvp,
  getEventRsvpCount,
  toggleEventRsvp,
  getNotifications,
  getAllReports,
  getUserReports,
  createReport,
  updateReport,
  getAllContacts,
  getUserContacts,
  createContact,
  updateContact,
  getAllGameSuggestions,
  getUserGameSuggestions,
  createGameSuggestion,
  updateGameSuggestion,
} from "./supabase-db";

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z.string().min(1, "Name is required").max(255),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

const createEventSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().max(2000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  location: z.string().max(255).optional(),
  streamUrl: z.string().url().optional(),
});

const createMediaSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  url: z.string().url("Invalid URL"),
});

const createCommentSchema = z.object({
  message: z.string().min(1, "Message required").max(1000),
});

const createReportSchema = z.object({
  type: z.enum(["bug", "rule-violation"]),
  title: z.string().min(1, "Title required").max(255),
  description: z.string().min(1, "Description required").max(2000),
  evidence: z.string().optional(),
});

const contactMessageSchema = z.object({
  subject: z.string().min(1, "Subject required").max(255),
  category: z.string().min(1, "Category required").max(50),
  message: z.string().min(1, "Message required").max(2000),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  profilePicture: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  bannerUrl: z.string().url().optional(),
});

const updateSiteStatusSchema = z.object({
  underConstruction: z.boolean(),
});

const updateReportSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "accepted", "dismissed"]).optional(),
  adminMessage: z.string().max(1000).optional(),
});

const createGameSuggestionSchema = z.object({
  gameTitle: z.string().min(1, "Game title required").max(255),
  genre: z.string().min(1, "Genre required").max(50),
  description: z.string().min(1, "Description required").max(2000),
  whyImportant: z.string().max(1000).optional(),
  contactEmail: z.string().email("Invalid email"),
});

const updateGameSuggestionSchema = z.object({
  id: z.string(),
  status: z.enum(["approved", "rejected"]).optional(),
  adminMessage: z.string().max(1000).optional(),
});

const usersActionSchema = z.object({
  userId: z.string(),
  action: z.enum(["ban", "unban", "kick", "tempban", "change-status"]),
  duration: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
  newStatus: z.enum(["admin", "test", "regular"]).optional(),
});

const adminCreateUserSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  name: z.string().min(1, "Name is required").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  status: z.enum(["admin", "test", "regular"]).optional(),
});

// Validation middleware
function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      res.status(400).json({ success: false, message: "Invalid request" });
    }
  };
}

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// Get JWT secret from env or use a default for development
const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-key-not-for-production-change-me";

function issueToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

function parseToken(token: string | undefined): { userId: string } | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for token in httpOnly cookie first, then fall back to Authorization header for backwards compatibility
  let token: string | undefined;

  // Try cookie first (httpOnly - secure)
  const cookies = req.cookies as Record<string, string> | undefined;
  if (cookies?.auth_token) {
    token = cookies.auth_token;
  } else {
    // Fall back to Authorization header for backwards compatibility
    const header = req.headers["authorization"];
    if (header?.toString().startsWith("Bearer ")) {
      token = header.toString().slice("Bearer ".length);
    }
  }

  const payload = parseToken(token);
  if (!payload) {
    console.log("[Auth] No valid token found for request to", req.path);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  (req as any).userId = payload.userId;
  console.log("[Auth] User authenticated:", payload.userId);
  next();
}

async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) {
      console.log("[Auth] No userId in request for admin check");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("[Auth] Checking admin status for user:", userId);
    const user = await getUserById(userId);
    console.log("[Auth] User found:", user?.id, "is_admin:", user?.is_admin);

    if (!user?.is_admin) {
      console.log("[Auth] User is not admin, denying access");
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    console.log("[Auth] Admin check passed for user:", userId);
    next();
  } catch (error) {
    console.error("[Auth] Admin check error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const ADMIN_EMAIL = "zshihadeh671@gmail.com";
const ADMIN_DISCORD_USERNAME = "zaidshihadehgaming";

// Test credentials - only used in development mode (check DEMO_MODE env)
const DEMO_MODE = (process.env.DEMO_MODE || "false").toLowerCase() === "true";
const TEST_EMAIL = process.env.TEST_EMAIL || "test123@gmail.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Test123";

// In-memory database for non-Supabase data (events, notifications, reports, etc.)
const db = {
  events: new Map(),
  eventRsvps: new Map(),
  notifications: new Map(),
  media: new Map(),
  comments: new Map(),
  reports: new Map(),
  gameSuggestions: new Map(),
  contacts: new Map(),
};

function isAdminByIdentity(
  u: Partial<User> & { email?: string; username?: string },
) {
  return (
    (u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    (u.username &&
      u.username.toLowerCase() === ADMIN_DISCORD_USERNAME.toLowerCase())
  );
}

async function findUserByEmailAsync(email: string) {
  return await getUserByEmail(email);
}

// Convert database user format to API format
function convertDbUserToApi(dbUser: any): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    profilePicture: dbUser.profile_picture,
    bio: dbUser.bio,
    bannerUrl: dbUser.banner_url,
    isAdmin: dbUser.is_admin,
    status: dbUser.status || "regular",
    isBanned: dbUser.is_banned,
    tempBannedUntil: dbUser.temp_banned_until,
    kickedAt: dbUser.kicked_at,
    discordId: dbUser.discord_id,
    username: dbUser.username,
    discriminator: dbUser.discriminator,
    badges: dbUser.badges || [],
    discordRoles: dbUser.discord_roles || [],
    xp: dbUser.xp || 0,
    createdAt: dbUser.created_at,
  };
}

export function createServer() {
  const app = express();

  // Rate limiting for auth endpoints to prevent brute-force attacks
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many authentication attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 signup attempts per hour
    message: "Too many signup attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Initialize Supabase and seed test account
  (async () => {
    await initializeDatabase();

    if (DEMO_MODE) {
      const existingTest = await findUserByEmailAsync(TEST_EMAIL);
      if (!existingTest) {
        const id = uid("user");
        await createUser({
          id,
          email: TEST_EMAIL,
          name: "Test Account",
          is_admin: false,
          status: "test",
          is_banned: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  })();

  // Middleware
  app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health/ping
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server!" });
  });

  // Under construction runtime flag (init from env, default false)
  let underConstruction =
    (process.env.UNDER_CONSTRUCTION || "false").toLowerCase() === "true";

  // Site status
  app.get("/api/site-status", (_req, res) => {
    res.json({ underConstruction });
  });

  // Admin: update site status
  app.post(
    "/api/admin/site-status",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      const { underConstruction: next } = req.body || {};
      if (typeof next !== "boolean") {
        return res
          .status(400)
          .json({
            success: false,
            message: "underConstruction boolean required",
          });
      }
      underConstruction = next;
      res.json({ success: true, underConstruction });
    },
  );

  app.post(
    "/api/admin/site-status/toggle",
    authMiddleware,
    adminMiddleware,
    (_req, res) => {
      underConstruction = !underConstruction;
      res.json({ success: true, underConstruction });
    },
  );

  // Auth
  app.get("/api/auth/status", authMiddleware, async (req, res) => {
    const userId = (req as any).userId as string;
    const user = await getUserById(userId);
    if (!user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    // Convert snake_case to camelCase for response
    const userResponse = convertDbUserToApi(user);
    res.json({ success: true, user: userResponse });
  });

  // Signup endpoint disabled - only admins can create users
  app.post("/api/auth/signup", (_req, res) => {
    res.status(403).json({
      success: false,
      message: "Sign up is disabled. Ask an administrator to create an account for you.",
    });
  });

  app.post(
    "/api/auth/signin",
    authLimiter,
    validateRequest(signInSchema),
    async (req, res) => {
      const body = req.body as SignInRequest;
      try {
        console.log("[Auth] Sign in attempt for:", body.email);
        let user = await findUserByEmailAsync(body.email);
        console.log("[Auth] User found:", user ? user.id : "not found");

        // Handle demo mode test account
        if (
          DEMO_MODE &&
          body.email.toLowerCase() === TEST_EMAIL.toLowerCase()
        ) {
          if (body.password !== TEST_PASSWORD) {
            return res
              .status(401)
              .json({ success: false, message: "Invalid credentials" });
          }
          if (!user) {
            const id = uid("user");
            user = await createUser({
              id,
              email: TEST_EMAIL,
              name: "Test Account",
              is_admin: false,
              status: "test",
              is_banned: false,
              created_at: new Date().toISOString(),
            });
          }
        } else if (!user && DEMO_MODE) {
          // In demo mode, auto-register new users
          const id = uid("user");
          const hashedPassword = await bcryptjs.hash(body.password, 10);
          const isAdmin = isAdminByIdentity({ email: body.email }) || false;
          user = await createUser({
            id,
            email: body.email,
            name: body.email.split("@")[0],
            is_admin: isAdmin,
            status: isAdmin ? "admin" : "regular",
            is_banned: false,
            password_hash: hashedPassword,
            created_at: new Date().toISOString(),
          });
        } else if (!user) {
          // Production: user doesn't exist, fail immediately
          return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });
        } else {
          // User exists: verify password hash
          const passwordHash = (user as any).password_hash;
          if (!passwordHash) {
            return res
              .status(401)
              .json({ success: false, message: "Invalid credentials" });
          }
          const passwordValid = await bcryptjs.compare(
            body.password,
            passwordHash,
          );
          if (!passwordValid) {
            return res
              .status(401)
              .json({ success: false, message: "Invalid credentials" });
          }
          // Update admin flag if identity matches
          if (isAdminByIdentity(user)) {
            user = await updateUser(user.id, { is_admin: true });
          }
        }

        // At this point, user should be defined (or we've returned)
        if (!user) {
          return res
            .status(500)
            .json({ success: false, message: "Sign in failed" });
        }

        if (user.is_banned) {
          return res.json({
            success: false,
            message: "User is banned",
            kickReason: "Banned by admin",
          });
        }

        const token = issueToken(user.id);
        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: "/",
        });

        res.json({ success: true, user: convertDbUserToApi(user) });
      } catch (error) {
        console.error("[Auth] Signin error:", error);
        res.status(500).json({ success: false, message: "Sign in failed" });
      }
    }
  );

  app.post("/api/auth/discord-sync", async (req, res) => {
    try {
      const { id, email, name, profilePicture, discordId, username } =
        req.body || {};
      const userId = typeof id === "string" ? id : uid("user");
      let user = await getUserById(userId);

      if (!user) {
        const isAdmin = isAdminByIdentity({ email, username });
        user = await createUser({
          id: userId,
          email: email || `${username || name || "user"}@example.com`,
          name: name || username || "User",
          profile_picture: profilePicture,
          is_admin: isAdmin,
          status: isAdmin ? "admin" : "regular",
          is_banned: false,
          discord_id: discordId,
          username,
          created_at: new Date().toISOString(),
        });
      } else {
        const updates: any = {};
        if (email) updates.email = email;
        if (name) updates.name = name;
        if (profilePicture) updates.profile_picture = profilePicture;
        if (discordId) updates.discord_id = discordId;
        if (username) updates.username = username;

        if (isAdminByIdentity({ email: user.email, username: user.username })) {
          updates.is_admin = true;
        }

        if (Object.keys(updates).length > 0) {
          user = await updateUser(userId, updates);
        }
      }

      if (!user) {
        return res.status(500).json({ success: false, message: "Failed to sync user" });
      }

      const token = issueToken(userId);
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.json({ success: true, user: convertDbUserToApi(user) });
    } catch (error) {
      console.error("[Auth] Discord sync error:", error);
      res.status(500).json({ success: false, message: "Discord sync failed" });
    }
  });

  app.put("/api/auth/update-profile", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const body = req.body as UpdateProfileRequest;
      const user = await getUserById(userId);

      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const updates: any = {};
      if (typeof body.name === "string") updates.name = body.name;
      if (typeof body.profilePicture === "string") updates.profile_picture = body.profilePicture;
      if (typeof (body as any).bio === "string") updates.bio = (body as any).bio;
      if (typeof (body as any).bannerUrl === "string") updates.banner_url = (body as any).bannerUrl;

      const updatedUser = await updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(500).json({ success: false, message: "Failed to update profile" });
      }

      res.json({ success: true, user: convertDbUserToApi(updatedUser) });
    } catch (error) {
      console.error("[Auth] Update profile error:", error);
      res.status(500).json({ success: false, message: "Failed to update profile" });
    }
  });

  app.post("/api/auth/start-email-change", authMiddleware, (req, res) => {
    const { newEmail } = req.body || {};
    if (!newEmail)
      return res
        .status(400)
        .json({ success: false, message: "New email required" });
    res.json({ success: true, message: "Verification codes sent" });
  });

  app.post("/api/auth/change-email", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const body = req.body as ChangeEmailRequest;
    if (!body?.newEmail)
      return res
        .status(400)
        .json({ success: false, message: "New email required" });
    const user = db.users.get(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.email = body.newEmail;
    res.json({ success: true, user });
  });

  app.post("/api/auth/logout", authMiddleware, (req, res) => {
    // Clear the auth cookie
    res.clearCookie("auth_token", { path: "/" });
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Demo endpoint
  app.get("/api/demo", (_req, res) => {
    res.json({ message: "Demo endpoint working" });
  });

  // Events & Notifications
  app.get("/api/events", (_req, res) => {
    const events = Array.from(db.events.values()).sort((a, b) =>
      a.startsAt.localeCompare(b.startsAt),
    );
    res.json({ success: true, events });
  });

  app.post(
    "/api/events",
    authMiddleware,
    adminMiddleware,
    validateRequest(createEventSchema),
    (req, res) => {
      const body = req.body as CreateEventRequest;
      const id = uid("evt");
      const event: EventItem = {
        id,
        title: body.title,
        description: body.description,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        location: body.location,
        streamUrl: body.streamUrl,
        createdAt: new Date().toISOString(),
      };
      db.events.set(id, event);
      res.json({ success: true, event });
    }
  );

  app.get("/api/events/:id/rsvp", authMiddleware, (req, res) => {
    const eventId = req.params.id;
    const userId = (req as any).userId as string;
    const set = db.eventRsvps.get(eventId) || new Set<string>();
    res.json({ success: true, rsvp: set.has(userId), count: set.size });
  });

  app.post("/api/events/:id/rsvp", authMiddleware, (req, res) => {
    const eventId = req.params.id;
    const userId = (req as any).userId as string;
    if (!db.events.has(eventId))
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    const set = db.eventRsvps.get(eventId) || new Set<string>();
    if (set.has(userId)) set.delete(userId);
    else set.add(userId);
    db.eventRsvps.set(eventId, set);
    res.json({ success: true, rsvp: set.has(userId), count: set.size });
  });

  app.get("/api/notifications", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    let list = db.notifications.get(userId);
    if (!list) {
      list = [
        {
          id: uid("n"),
          type: "announcement",
          title: "Welcome!",
          message: "Thanks for joining the community.",
          createdAt: new Date().toISOString(),
        },
      ];
      db.notifications.set(userId, list);
    }
    res.json({ success: true, notifications: list });
  });

  // Media
  app.get("/api/media", (_req, res) => {
    const items = Array.from(db.media.values()).filter(
      (m) => m.status === ("approved" as MediaStatus),
    );
    res.json({ success: true, items });
  });

  app.post(
    "/api/media",
    authMiddleware,
    validateRequest(createMediaSchema),
    (req, res) => {
      const userId = (req as any).userId as string;
      const body = req.body as CreateMediaRequest;
      const id = uid("m");
      const item: MediaItem = {
        id,
        userId,
        title: body.title,
        url: body.url,
        createdAt: new Date().toISOString(),
        status: "pending",
        creditName: db.users.get(userId)?.name || "User",
      };
      db.media.set(id, item);
      res.json({ success: true, item });
    }
  );

  app.get("/api/media/:id/comments", (req, res) => {
    const id = req.params.id;
    const list = db.comments.get(id) || [];
    res.json({ success: true, comments: list });
  });

  app.post(
    "/api/media/:id/comments",
    authMiddleware,
    validateRequest(createCommentSchema),
    (req, res) => {
      const id = req.params.id;
      const userId = (req as any).userId as string;
      const body = req.body as any;
      if (!db.media.has(id))
        return res
          .status(404)
          .json({ success: false, message: "Media not found" });
      const comment: CommentItem = {
        id: uid("c"),
        mediaId: id,
        userId,
        message: body.message,
        createdAt: new Date().toISOString(),
      };
      const list = db.comments.get(id) || [];
      list.push(comment);
      db.comments.set(id, list);
      res.json({ success: true, comment });
    }
  );

  // Media moderation (admin)
  app.get(
    "/api/media/pending",
    authMiddleware,
    adminMiddleware,
    (_req, res) => {
      const items = Array.from(db.media.values()).filter(
        (m) => m.status === ("pending" as MediaStatus),
      );
      res.json({ success: true, items });
    },
  );

  app.post(
    "/api/media/:id/approve",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      const id = req.params.id;
      const item = db.media.get(id);
      if (!item)
        return res.status(404).json({ success: false, message: "Not found" });
      item.status = "approved";
      res.json({ success: true, item });
    },
  );

  app.post(
    "/api/media/:id/reject",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      const id = req.params.id;
      const item = db.media.get(id);
      if (!item)
        return res.status(404).json({ success: false, message: "Not found" });
      item.status = "rejected";
      res.json({ success: true, item });
    },
  );

  // Reports
  app.post(
    "/api/reports",
    authMiddleware,
    validateRequest(createReportSchema),
    (req, res) => {
      const userId = (req as any).userId as string;
      const body = req.body as CreateReportRequest & {
        type: "bug" | "rule-violation";
      };
      const id = uid("r");
      const reporter = db.users.get(userId);
      const report = {
        id,
        userId,
        reporterName: reporter?.name || "Unknown",
        reporterEmail: reporter?.email || "unknown@example.com",
        type: body.type,
        title: body.title,
        description: body.description,
        evidence: (body as any).evidence,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };
      db.reports.set(id, report);
      // Also attach a contact message for visibility in Contact page
      const contactList = db.contacts.get(userId) || [];
      contactList.push({
        id: uid("contact"),
        subject: `Report: ${report.title}`,
        category: report.type === "bug" ? "technical" : "other",
        message: report.description,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      db.contacts.set(userId, contactList);
      res.json({ success: true, report });
    }
  );

  app.get("/api/reports/my", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const list = Array.from(db.reports.values()).filter(
      (r) => r.userId === userId,
    );
    res.json({ success: true, reports: list });
  });

  app.get("/api/reports", authMiddleware, adminMiddleware, (_req, res) => {
    res.json({ success: true, reports: Array.from(db.reports.values()) });
  });

  app.post(
    "/api/reports/update",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      const { id, status, adminMessage } = req.body || {};
      const report = db.reports.get(id);
      if (!report)
        return res.status(404).json({ success: false, message: "Not found" });
      if (status && ["pending", "accepted", "dismissed"].includes(status))
        report.status = status;
      if (adminMessage) report.adminMessage = adminMessage;
      report.updatedAt = new Date().toISOString();
      res.json({ success: true, report });
    },
  );

  // Game Suggestions
  app.post(
    "/api/game-suggestions",
    authMiddleware,
    validateRequest(createGameSuggestionSchema),
    (req, res) => {
      const userId = (req as any).userId as string;
      const body = req.body as CreateGameSuggestionRequest;
      const id = uid("gs");
      const user = db.users.get(userId);
      const suggestion = {
        id,
        userId,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "unknown@example.com",
        gameTitle: body.gameTitle,
        genre: body.genre,
        description: body.description,
        whyImportant: body.whyImportant,
        contactEmail: body.contactEmail,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };
      db.gameSuggestions.set(id, suggestion);
      res.json({ success: true, message: "Suggestion submitted successfully", suggestion });
    }
  );

  app.get("/api/game-suggestions/my", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const list = Array.from(db.gameSuggestions.values()).filter(
      (s) => s.userId === userId,
    );
    res.json({ success: true, suggestions: list });
  });

  app.get("/api/game-suggestions", authMiddleware, adminMiddleware, (_req, res) => {
    res.json({ success: true, suggestions: Array.from(db.gameSuggestions.values()) });
  });

  app.post(
    "/api/game-suggestions/update",
    authMiddleware,
    adminMiddleware,
    validateRequest(updateGameSuggestionSchema),
    (req, res) => {
      const { id, status, adminMessage } = req.body || {};
      const suggestion = db.gameSuggestions.get(id);
      if (!suggestion)
        return res.status(404).json({ success: false, message: "Suggestion not found" });
      if (status && ["approved", "rejected"].includes(status))
        suggestion.status = status;
      if (adminMessage) suggestion.adminMessage = adminMessage;
      suggestion.updatedAt = new Date().toISOString();
      res.json({ success: true, suggestion });
    },
  );

  // Contact messages
  app.post(
    "/api/contact",
    authMiddleware,
    validateRequest(contactMessageSchema),
    (req, res) => {
      const userId = (req as any).userId as string;
      const body = req.body as any;
      const list = db.contacts.get(userId) || [];
      const item = {
        id: uid("contact"),
        subject: body.subject,
        category: body.category,
        message: body.message,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      list.push(item);
      db.contacts.set(userId, list);
      res.json({
        success: true,
        message: "Contact message submitted",
        contactId: item.id,
      });
    }
  );

  app.get("/api/contact/my", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const list = db.contacts.get(userId) || [];
    res.json({ success: true, contacts: list });
  });

  app.get("/api/contact", authMiddleware, adminMiddleware, (_req, res) => {
    // Flatten all contacts
    const contacts = Array.from(db.contacts.values()).flat();
    res.json({ success: true, contacts });
  });

  app.post(
    "/api/contact/update",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      const { id, status, response } = req.body || {};
      for (const [userId, list] of db.contacts.entries()) {
        const idx = list.findIndex((c) => c.id === id);
        if (idx !== -1) {
          if (status && ["pending", "in-progress", "resolved"].includes(status))
            list[idx].status = status;
          if (response) {
            list[idx].response = response;
            list[idx].respondedAt = new Date().toISOString();
          }
          db.contacts.set(userId, list);
          return res.json({ success: true, contact: list[idx] });
        }
      }
      res.status(404).json({ success: false, message: "Not found" });
    },
  );

  // Users management
  app.get("/api/users", authMiddleware, adminMiddleware, async (_req, res) => {
    try {
      const dbUsers = await getAllUsers();
      const users = dbUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        profilePicture: u.profile_picture,
        isAdmin: u.is_admin,
        status: u.status || "regular",
        isBanned: u.is_banned,
        tempBannedUntil: u.temp_banned_until,
        createdAt: u.created_at,
        password: u.password_hash ? "[HASHED]" : undefined,
      }));
      res.json({ success: true, users });
    } catch (error) {
      console.error("[Users] List error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  });

  app.post(
    "/api/users/action",
    authMiddleware,
    adminMiddleware,
    validateRequest(usersActionSchema),
    async (req, res) => {
      try {
        const body = req.body as any;
        const { userId, action, duration, reason, newStatus } = body;

        const user = await getUserById(userId);
        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        if (action === "ban") {
          await updateUser(userId, { is_banned: true, temp_banned_until: null });
          res.json({ success: true, message: "User banned successfully" });
        } else if (action === "unban") {
          await updateUser(userId, { is_banned: false, temp_banned_until: null });
          res.json({ success: true, message: "User unbanned successfully" });
        } else if (action === "kick") {
          // Delete user (cascade delete handled by database foreign key constraints)
          await deleteUser(userId);
          res.json({ success: true, message: "User kicked successfully" });
        } else if (action === "tempban") {
          if (!duration || duration <= 0) {
            return res.status(400).json({
              success: false,
              message: "Valid duration (hours) required for tempban",
            });
          }
          const until = new Date(Date.now() + duration * 60 * 60 * 1000);
          await updateUser(userId, { temp_banned_until: until.toISOString() });
          res.json({ success: true, message: "User temporarily banned" });
        } else if (action === "change-status") {
          if (!newStatus || !["admin", "test", "regular"].includes(newStatus)) {
            return res.status(400).json({
              success: false,
              message: "Valid status required (admin, test, regular)",
            });
          }
          await updateUser(userId, { status: newStatus });
          res.json({ success: true, message: `User status changed to ${newStatus}` });
        } else {
          res.status(400).json({ success: false, message: "Invalid action" });
        }
      } catch (error) {
        console.error("[Users] Action error:", error);
        res.status(500).json({ success: false, message: "Failed to perform action" });
      }
    }
  );

  // Admin: Create a new user
  app.post(
    "/api/users/create",
    authMiddleware,
    adminMiddleware,
    validateRequest(adminCreateUserSchema),
    async (req, res) => {
      try {
        const body = req.body as any;
        const { email, name, password, status } = body;

        // Check if email already exists
        const existingUser = await findUserByEmailAsync(email);
        if (existingUser) {
          return res.json({ success: false, message: "Email already registered" });
        }

        const id = uid("user");
        const hashedPassword = await bcryptjs.hash(password, 10);
        const userStatus = status || "regular";

        const newUser = await createUser({
          id,
          email,
          name,
          password_hash: hashedPassword,
          is_admin: userStatus === "admin",
          status: userStatus,
          is_banned: false,
          created_at: new Date().toISOString(),
        });

        if (!newUser) {
          return res.status(500).json({ success: false, message: "Failed to create user" });
        }

        res.json({
          success: true,
          message: `User ${name} created successfully with status: ${userStatus}`,
          user: convertDbUserToApi(newUser),
        });
      } catch (error) {
        console.error("[Users] Create error:", error);
        res.status(500).json({ success: false, message: "Failed to create user" });
      }
    }
  );

  // Generate all 1,400+ games from math321.lol
  interface Game {
    id: number;
    category: string;
    name: string;
  }

  // Game distribution by category from their HTML
  const gameCategories: Record<string, number> = {
    Action: 112,
    Adventure: 94,
    Car: 63,
    Casual: 106,
    Clicker: 52,
    Fighting: 59,
    "IO Games": 43,
    Kids: 51,
    Multiplayer: 50,
    Parkour: 48,
    Platform: 121,
    Puzzle: 123,
    Racing: 71,
    Running: 123,
    School: 41,
    Shooting: 130,
    Skill: 127,
    Sport: 81,
    "Two Player": 80,
  };

  // Generate complete games array
  const games: Game[] = [];
  let gameId = 1;
  for (const [category, count] of Object.entries(gameCategories)) {
    for (let i = 0; i < count; i++) {
      games.push({
        id: gameId,
        category,
        name: `${category} ${i + 1}`,
      });
      gameId++;
    }
  }

  // Games endpoint
  app.get("/api/games", (_req, res) => {
    const category = _req.query.category as string | undefined;
    let filtered = games;
    if (category) {
      filtered = games.filter((g) => g.category === category);
    }
    res.json({
      success: true,
      games: filtered,
      total: games.length,
      category: category || "all",
    });
  });

  app.get("/api/games/search", (_req, res) => {
    const q = (_req.query.q as string || "").toLowerCase();
    const results = games.filter((g) => g.name.toLowerCase().includes(q));
    res.json({ success: true, results, count: results.length });
  });

  // Game proxy - extract game HTML from math321.lol and remove website UI
  app.get("/api/games/:gameId/proxy", async (_req, res) => {
    try {
      const gameId = _req.params.gameId;
      const gameUrl = `https://math321.lol/exercise-${gameId}.html`;

      console.log(`[Game Proxy] Fetching game ${gameId} from ${gameUrl}`);

      // Fetch the game page with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response;
      try {
        response = await fetch(gameUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        console.error(`[Game Proxy] Failed to fetch game ${gameId}: ${response.status}`);
        const errorHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Game Not Found</title>
  <style>
    body { background: #000; color: #fff; font-family: Arial; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .error { text-align: center; }
    h1 { color: #ff4444; }
    p { color: #aaa; }
  </style>
</head>
<body>
  <div class="error">
    <h1>Game Not Found</h1>
    <p>Could not load game ${gameId}</p>
    <p style="font-size: 12px; margin-top: 20px;">Status: ${response.status}</p>
  </div>
</body>
</html>`;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(404).send(errorHtml);
      }

      let html = await response.text();
      console.log(`[Game Proxy] Successfully fetched game ${gameId}, HTML size: ${html.length} bytes`);

      // Remove HTML comments
      html = html.replace(/<!--[\s\S]*?-->/g, "");

      // Remove header and navigation
      html = html.replace(/<header[\s\S]*?<\/header>/gi, "");
      html = html.replace(/<nav[\s\S]*?<\/nav>/gi, "");
      html = html.replace(/<\.topbar[\s\S]*?<\/\.topbar>/gi, "");

      // Remove sidebars
      html = html.replace(/<aside[\s\S]*?<\/aside>/gi, "");
      html = html.replace(/<\.side[\s\S]*?<\/\.side>/gi, "");

      // Remove footer
      html = html.replace(/<footer[\s\S]*?<\/footer>/gi, "");
      html = html.replace(/<\.site-footer[\s\S]*?<\/\.site-footer>/gi, "");

      // Remove all divs with "exercise" or "lesson" in class/id (exercise resource containers)
      html = html.replace(/<div[^>]*(?:class|id)="[^"]*exercise[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
      html = html.replace(/<div[^>]*(?:class|id)="[^"]*lesson[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
      html = html.replace(/<section[\s\S]*?<\/section>/gi, "");

      // Remove ads and tracking
      html = html.replace(/<\.addelao[\s\S]*?<\/\.addelao>/gi, "");
      html = html.replace(/<ins[\s\S]*?<\/ins>/gi, "");
      html = html.replace(/<script[\s\S]*?aiptag[\s\S]*?<\/script>/gi, "");
      html = html.replace(/<script[\s\S]*?gtag[\s\S]*?<\/script>/gi, "");
      html = html.replace(/<script[\s\S]*?criteo[\s\S]*?<\/script>/gi, "");
      html = html.replace(/<script[\s\S]*?google[\s\S]*?<\/script>/gi, "");
      html = html.replace(/<iframe[\s\S]*?google[\s\S]*?<\/iframe>/gi, "");
      html = html.replace(/<iframe[\s\S]*?doubleclick[\s\S]*?<\/iframe>/gi, "");
      html = html.replace(/<iframe[\s\S]*?criteo[\s\S]*?<\/iframe>/gi, "");

      // Remove all links and anchors
      html = html.replace(/<a[\s\S]*?<\/a>/gi, "");

      // Remove title, removes "Exercise 1" branding
      html = html.replace(/<title[\s\S]*?<\/title>/gi, "<title>Game</title>");

      // Add styles to hide any remaining non-game content and center canvas
      const styleInjection = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
          body { display: flex; align-items: center; justify-content: center; font-size: 0; }
          main, .main, .home, article, .article { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; margin: 0 !important; padding: 0 !important; background: #000 !important; }
          canvas { display: block !important; margin: 0 auto !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain; }
          header, nav, aside, footer, .topbar, .side, .addelao, ins, .site-footer, .menu-toggle, .search-box, .addelao.v300, .addelao.v300x250, section { display: none !important; }
          script[async], link[rel="stylesheet"] { display: none !important; }
          body > div:not(.game-container):not([id^="iframe"]) { display: none !important; }
          .exercise-resource, .lesson-container, .exercise-similar, .related-exercises { display: none !important; }
        </style>
        <script>
          // Auto-click Learn Now button to load the game
          function clickLearnButton() {
            const allButtons = document.querySelectorAll('button, a, [role="button"]');
            for (let btn of allButtons) {
              if (btn.textContent && (btn.textContent.includes('Learn') || btn.textContent.includes('Now') || btn.textContent.includes('Start') || btn.textContent.includes('Play'))) {
                console.log('Clicking button:', btn.textContent.trim());
                btn.click();
                return true;
              }
            }
            return false;
          }

          // Try clicking on DOMContentLoaded
          document.addEventListener('DOMContentLoaded', function() {
            clickLearnButton();
            // Also try again after a short delay
            setTimeout(clickLearnButton, 300);
            setTimeout(clickLearnButton, 600);
          });

          // Try immediately in case DOM is already loaded
          if (document.readyState === 'interactive' || document.readyState === 'complete') {
            clickLearnButton();
          }
        </script>
      `;

      // Inject styles and script before closing head tag
      html = html.replace("</head>", `${styleInjection}</head>`);
      html = html.replace(/<head[^>]*>/, "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>");

      // Remove all links that point to math321.lol or have href
      html = html.replace(/href=["'][^"']*math321[^"']*["']/gi, "href='#'");
      html = html.replace(/href=["'](?!(?:https?:|\/|data:|#|javascript:))([^"']+)["']/gi, "href='#'");

      // Don't rewrite asset URLs to math321.lol - just remove src entirely if it's a relative URL
      // This will prevent loading external resources
      html = html.replace(/src=["'](?!(?:https?:|\/|data:))([^"']+)["']/g, 'src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22%3E%3C/svg%3E"');

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.send(html);
    } catch (error) {
      console.error(`[Game Proxy] Error:`, error);
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Error Loading Game</title>
          <style>
            body { background: #000; color: #fff; font-family: Arial; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .error { text-align: center; }
            h1 { color: #ff4444; }
            p { color: #aaa; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Error Loading Game</h1>
            <p>Please try again later or go back to the games list.</p>
          </div>
        </body>
        </html>
      `;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(500).send(errorHtml);
    }
  });

  // Admin ops
  app.get("/api/admin/health", authMiddleware, adminMiddleware, (_req, res) => {
    res.json({ success: true, status: "ok", time: new Date().toISOString() });
  });

  app.post(
    "/api/admin/backfill",
    authMiddleware,
    adminMiddleware,
    (_req, res) => {
      res.json({ success: true, message: "Backfill completed" });
    },
  );

  return app;
}
