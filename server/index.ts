import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

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

// Simple in-memory stores (ephemeral, dev-only)
const db = {
  users: new Map<string, User & { password?: string }>(),
  events: new Map<string, EventItem>(),
  eventRsvps: new Map<string, Set<string>>(), // eventId -> Set<userId>
  notifications: new Map<string, NotificationItem[]>(), // userId -> notifications
  media: new Map<string, MediaItem>(),
  comments: new Map<string, CommentItem[]>(), // mediaId -> comments
  reports: new Map<string, any>(), // reportId -> report
  contacts: new Map<string, any[]>(), // userId -> contact messages
  pendingMedia: new Set<string>(), // ids of pending media
};

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function issueToken(userId: string): string {
  const payload = { userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function parseToken(token: string | undefined): { userId: string } | null {
  if (!token) return null;
  try {
    const str = Buffer.from(token, "base64").toString();
    const obj = JSON.parse(str);
    if (
      typeof obj.userId === "string" &&
      typeof obj.exp === "number" &&
      obj.exp > Date.now()
    ) {
      return { userId: obj.userId };
    }
    return null;
  } catch {
    return null;
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];
  const token = header?.toString().startsWith("Bearer ")
    ? header.toString().slice("Bearer ".length)
    : undefined;
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
const TEST_EMAIL = "test123@gmail.com";
const TEST_PASSWORD = "Test123";

function isAdminByIdentity(
  u: Partial<User> & { email?: string; username?: string },
) {
  return (
    (u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    (u.username &&
      u.username.toLowerCase() === ADMIN_DISCORD_USERNAME.toLowerCase())
  );
}

function findUserByEmail(email: string) {
  email = email.toLowerCase();
  return Array.from(db.users.values()).find(
    (u) => u.email?.toLowerCase?.() === email,
  );
}

export function createServer() {
  const app = express();

  // Seed a deterministic Test Account (non-admin)
  const existingTest = findUserByEmail(TEST_EMAIL);
  if (!existingTest) {
    const id = uid("user");
    db.users.set(id, {
      id,
      email: TEST_EMAIL,
      name: "Test Account",
      isAdmin: false,
      isBanned: false,
      createdAt: new Date().toISOString(),
      password: TEST_PASSWORD,
    } as any);
  }

  // Middleware
  app.use(cors());
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
    res.json({ success: true, user });
  });

  app.post("/api/auth/signup", (req, res) => {
    const body = req.body as SignUpRequest;
    if (!body?.email || !body?.password || !body?.name) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }
    if (findUserByEmail(body.email))
      return res.json({ success: false, message: "Email already registered" });
    const id = uid("user");
    const user: User & { password?: string } = {
      id,
      email: body.email,
      name: body.name,
      isAdmin: isAdminByIdentity({ email: body.email }) || false,
      isBanned: false,
      createdAt: new Date().toISOString(),
      profilePicture: undefined,
      password: body.password,
    };
    db.users.set(id, user);
    const token = issueToken(id);
    res.json({ success: true, user, token });
  });

  app.post("/api/auth/signin", (req, res) => {
    const body = req.body as SignInRequest;
    if (!body?.email || !body?.password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });
    }
    let user = findUserByEmail(body.email);

    // Enforce Test Account credentials
    if (body.email.toLowerCase() === TEST_EMAIL.toLowerCase()) {
      if (body.password !== TEST_PASSWORD) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
      if (!user) {
        const id = uid("user");
        user = {
          id,
          email: TEST_EMAIL,
          name: "Test Account",
          isAdmin: false,
          isBanned: false,
          createdAt: new Date().toISOString(),
          password: TEST_PASSWORD,
        } as any;
        db.users.set(id, user);
      }
    }

    if (!user) {
      // Auto-register non-admins for demo
      const id = uid("user");
      user = {
        id,
        email: body.email,
        name: body.email.split("@")[0],
        isAdmin: isAdminByIdentity({ email: body.email }) || false,
        isBanned: false,
        createdAt: new Date().toISOString(),
        password: body.password,
      } as any;
      db.users.set(id, user);
    } else {
      // Update admin flag if identity matches
      if (isAdminByIdentity(user)) (user as any).isAdmin = true;
    }

    if (user.isBanned) {
      return res.json({
        success: false,
        message: "User is banned",
        kickReason: "Banned by admin",
      });
    }
    const token = issueToken(user.id);
    res.json({ success: true, user, token });
  });

  app.post("/api/auth/discord-sync", (req, res) => {
    const { id, email, name, profilePicture, discordId, username } =
      req.body || {};
    const userId = typeof id === "string" ? id : uid("user");
    let user = db.users.get(userId);
    if (!user) {
      user = {
        id: userId,
        email: email || `${username || name || "user"}@example.com`,
        name: name || username || "User",
        profilePicture,
        isAdmin: isAdminByIdentity({ email, username }),
        isBanned: false,
        createdAt: new Date().toISOString(),
        discordId,
        username,
      } as any;
      db.users.set(userId, user);
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
    res.json({ success: true, user, token });
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
    res.json({ success: true, user });
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

  app.post("/api/events", authMiddleware, adminMiddleware, (req, res) => {
    const body = req.body as CreateEventRequest;
    if (!body?.title || !body?.startsAt)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
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
  });

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

  app.post("/api/media", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const body = req.body as CreateMediaRequest;
    if (!body?.title || !body?.url)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    const id = uid("m");
    const item: MediaItem = {
      id,
      userId,
      title: body.title,
      url: body.url,
      createdAt: new Date().toISOString(),
      status: "approved",
      creditName: db.users.get(userId)?.name || "User",
    };
    db.media.set(id, item);
    res.json({ success: true, item });
  });

  app.get("/api/media/:id/comments", (req, res) => {
    const id = req.params.id;
    const list = db.comments.get(id) || [];
    res.json({ success: true, comments: list });
  });

  app.post("/api/media/:id/comments", authMiddleware, (req, res) => {
    const id = req.params.id;
    const userId = (req as any).userId as string;
    const { message } = req.body || {};
    if (!db.media.has(id))
      return res
        .status(404)
        .json({ success: false, message: "Media not found" });
    if (!message || typeof message !== "string")
      return res
        .status(400)
        .json({ success: false, message: "Message required" });
    const comment: CommentItem = {
      id: uid("c"),
      mediaId: id,
      userId,
      message,
      createdAt: new Date().toISOString(),
    };
    const list = db.comments.get(id) || [];
    list.push(comment);
    db.comments.set(id, list);
    res.json({ success: true, comment });
  });

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
  app.post("/api/reports", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const body = req.body as CreateReportRequest & {
      type: "bug" | "rule-violation";
    };
    if (!body?.type || !body?.title || !body?.description)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    const id = uid("r");
    const report = {
      id,
      userId,
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
  });

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

  // Contact messages
  app.post("/api/contact", authMiddleware, (req, res) => {
    const userId = (req as any).userId as string;
    const { subject, category, message } = req.body || {};
    if (!subject || !category || !message)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    const list = db.contacts.get(userId) || [];
    const item = {
      id: uid("contact"),
      subject,
      category,
      message,
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
  });

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
