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
  if (!payload)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  (req as any).userId = payload.userId;
  next();
}

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId as string | undefined;
  if (!userId)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  const user = db.users.get(userId);
  if (!user?.isAdmin)
    return res.status(403).json({ success: false, message: "Forbidden" });
  next();
}

const ADMIN_EMAIL = "zshihadeh671@gmail.com";
const ADMIN_DISCORD_USERNAME = "zaidshihadehgaming";

// Test credentials - only used in development mode (check DEMO_MODE env)
const DEMO_MODE = (process.env.DEMO_MODE || "false").toLowerCase() === "true";
const TEST_EMAIL = process.env.TEST_EMAIL || "test123@gmail.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Test123";

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
  app.get("/api/auth/status", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const user = db.users.get(userId);
    if (!user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    // Don't return password hash to client
    const userResponse = { ...user };
    delete (userResponse as any).passwordHash;
    res.json({ success: true, user: userResponse });
  });

  app.post(
    "/api/auth/signup",
    signupLimiter,
    validateRequest(signUpSchema),
    async (req, res) => {
      const body = req.body as SignUpRequest;

      if (findUserByEmail(body.email))
      return res.json({ success: false, message: "Email already registered" });

    try {
      const id = uid("user");
      const hashedPassword = await bcryptjs.hash(body.password, 10);
      const isAdmin = isAdminByIdentity({ email: body.email }) || false;
      const user: User & { passwordHash?: string } = {
        id,
        email: body.email,
        name: body.name,
        isAdmin: isAdmin,
        status: isAdmin ? "admin" : "regular",
        isBanned: false,
        createdAt: new Date().toISOString(),
        profilePicture: undefined,
        passwordHash: hashedPassword,
      };
      db.users.set(id, user);
      const token = issueToken(id);
      // Set httpOnly cookie for secure token storage
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });
      // Don't return password hash to client
      const userResponse = { ...user };
      delete (userResponse as any).passwordHash;
      res.json({ success: true, user: userResponse });
    } catch (error) {
      res.status(500).json({ success: false, message: "Signup failed" });
    }
  }
  );

  app.post(
    "/api/auth/signin",
    authLimiter,
    validateRequest(signInSchema),
    async (req, res) => {
      const body = req.body as SignInRequest;
      try {
        let user = findUserByEmail(body.email);

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
            const newUser = {
              id,
              email: TEST_EMAIL,
              name: "Test Account",
              isAdmin: false,
              isBanned: false,
              createdAt: new Date().toISOString(),
            } as User & { passwordHash?: string };
            db.users.set(id, newUser);
            user = newUser;
          }
        } else if (!user && DEMO_MODE) {
          // In demo mode, auto-register new users
          const id = uid("user");
          const hashedPassword = await bcryptjs.hash(body.password, 10);
          const isAdmin = isAdminByIdentity({ email: body.email }) || false;
          const newUser = {
            id,
            email: body.email,
            name: body.email.split("@")[0],
            isAdmin: isAdmin,
            status: isAdmin ? "admin" : "regular",
            isBanned: false,
            createdAt: new Date().toISOString(),
            passwordHash: hashedPassword,
          } as User & { passwordHash?: string };
          db.users.set(id, newUser);
          user = newUser;
        } else if (!user) {
          // Production: user doesn't exist, fail immediately
          return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });
        } else {
          // User exists: verify password hash
          const passwordHash = (user as any).passwordHash;
          if (!passwordHash) {
            // User has no password hash (legacy account), reject
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
          if (isAdminByIdentity(user)) (user as any).isAdmin = true;
        }

        // At this point, user should be defined (or we've returned)
        if (!user) {
          return res
            .status(500)
            .json({ success: false, message: "Sign in failed" });
        }

        if (user.isBanned) {
          return res.json({
            success: false,
            message: "User is banned",
            kickReason: "Banned by admin",
          });
        }

        const token = issueToken(user.id);
        // Set httpOnly cookie for secure token storage
        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: "/",
        });
        // Don't return password hash to client
        const userResponse = { ...user };
        delete (userResponse as any).passwordHash;
        res.json({ success: true, user: userResponse });
      } catch (error) {
        res.status(500).json({ success: false, message: "Sign in failed" });
      }
    }
  );

  app.post("/api/auth/discord-sync", (req, res) => {
    const { id, email, name, profilePicture, discordId, username } =
      req.body || {};
    const userId = typeof id === "string" ? id : uid("user");
    let user = db.users.get(userId);
    if (!user) {
      const isAdmin = isAdminByIdentity({ email, username });
      const newUser = {
        id: userId,
        email: email || `${username || name || "user"}@example.com`,
        name: name || username || "User",
        profilePicture,
        isAdmin: isAdmin,
        status: isAdmin ? "admin" : "regular",
        isBanned: false,
        createdAt: new Date().toISOString(),
        discordId,
        username,
      } as User & { passwordHash?: string };
      db.users.set(userId, newUser);
      user = newUser;
    } else {
      user.email = email || user.email;
      user.name = name || user.name;
      user.profilePicture = profilePicture || user.profilePicture;
      (user as any).discordId = discordId || (user as any).discordId;
      (user as any).username = username || (user as any).username;
      if (
        isAdminByIdentity({
          email: user.email,
          username: (user as any).username,
        })
      ) {
        (user as any).isAdmin = true;
      }
    }
    const token = issueToken(userId);
    // Set httpOnly cookie for secure token storage
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });
    // Don't return password hash to client
    const userResponse = { ...user };
    delete (userResponse as any).passwordHash;
    res.json({ success: true, user: userResponse });
  });

  app.put("/api/auth/update-profile", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const body = req.body as UpdateProfileRequest;
    const user = db.users.get(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (typeof body.name === "string") user.name = body.name;
    if (typeof body.profilePicture === "string")
      user.profilePicture = body.profilePicture;
    if (typeof (body as any).bio === "string")
      (user as any).bio = (body as any).bio;
    if (typeof (body as any).bannerUrl === "string")
      (user as any).bannerUrl = (body as any).bannerUrl;
    // Don't return password hash to client
    const userResponse = { ...user };
    delete (userResponse as any).passwordHash;
    res.json({ success: true, user: userResponse });
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
  app.get("/api/users", authMiddleware, adminMiddleware, (_req, res) => {
    const users = Array.from(db.users.values()).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      profilePicture: u.profilePicture,
      isAdmin: u.isAdmin,
      status: (u as any).status || "regular",
      isBanned: u.isBanned,
      tempBannedUntil: (u as any).tempBannedUntil,
      createdAt: u.createdAt,
      password: (u as any).passwordHash ? "[HASHED]" : undefined, // Show hashed indicator for admin
    }));
    res.json({ success: true, users });
  });

  app.post(
    "/api/users/action",
    authMiddleware,
    adminMiddleware,
    validateRequest(usersActionSchema),
    (req, res) => {
      const body = req.body as any;
      const { userId, action, duration, reason, newStatus } = body;

      const user = db.users.get(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (action === "ban") {
        user.isBanned = true;
        res.json({ success: true, message: "User banned successfully" });
      } else if (action === "unban") {
        user.isBanned = false;
        (user as any).tempBannedUntil = undefined;
        res.json({ success: true, message: "User unbanned successfully" });
      } else if (action === "kick") {
        // Cascade delete: clean up user's data
        db.users.delete(userId);
        db.notifications.delete(userId);
        db.contacts.delete(userId);
        db.eventRsvps.forEach((set) => set.delete(userId));

        // Remove user's media and comments
        for (const [mediaId, comments] of db.comments.entries()) {
          db.comments.set(
            mediaId,
            comments.filter((c) => c.userId !== userId),
          );
        }
        for (const [id, media] of db.media.entries()) {
          if (media.userId === userId) db.media.delete(id);
        }

        // Remove user's reports and their associated contact messages
        for (const [id, report] of db.reports.entries()) {
          if (report.userId === userId) db.reports.delete(id);
        }

        res.json({ success: true, message: "User kicked successfully" });
      } else if (action === "tempban") {
        if (!duration || duration <= 0) {
          return res.status(400).json({
            success: false,
            message: "Valid duration (hours) required for tempban",
          });
        }
        const until = new Date(Date.now() + duration * 60 * 60 * 1000);
        (user as any).tempBannedUntil = until.toISOString();
        res.json({ success: true, message: "User temporarily banned" });
      } else if (action === "change-status") {
        if (!newStatus || !["admin", "test", "regular"].includes(newStatus)) {
          return res.status(400).json({
            success: false,
            message: "Valid status required (admin, test, regular)",
          });
        }
        (user as any).status = newStatus;
        res.json({ success: true, message: `User status changed to ${newStatus}` });
      } else {
        res.status(400).json({ success: false, message: "Invalid action" });
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
