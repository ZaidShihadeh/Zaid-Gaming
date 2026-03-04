# Security Migration Guides

This document provides step-by-step guidance for implementing the remaining security improvements.

## 1. Migrate from localStorage to httpOnly Cookies

### Current Implementation (Vulnerable to XSS)
Tokens are stored in localStorage, which JavaScript can access.

### Target Implementation (Secure)
Use httpOnly cookies set by the server, which JavaScript cannot access.

### Implementation Steps

#### Step 1: Update Server to Set httpOnly Cookies

In `server/index.ts`, modify the signin/signup endpoints:

```typescript
app.post(
  "/api/auth/signin",
  authLimiter,
  validateRequest(signInSchema),
  async (req, res) => {
    // ... existing validation ...
    
    const token = issueToken(user.id);
    
    // Set httpOnly cookie instead of returning token
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });
    
    // Return user without token in response body
    const userResponse = { ...user };
    delete (userResponse as any).passwordHash;
    res.json({ success: true, user: userResponse });
  }
);
```

#### Step 2: Add CSRF Protection

Install: `npm install csurf`

```typescript
import csrf from "csurf";

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
```

#### Step 3: Update authMiddleware

```typescript
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies["auth_token"];
  const payload = parseToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  
  (req as any).userId = payload.userId;
  next();
}
```

#### Step 4: Update Client Auth Utils

Remove localStorage usage and rely on cookies (sent automatically with fetch):

```typescript
// auth-utils.ts
export function getAuthToken(): string | null {
  // Token is now in httpOnly cookie, not accessible here
  // Return a marker that auth is via cookies
  return "cookie-based";
}

export function setAuthData(user: User): void {
  // Store only user info (non-sensitive) if needed for offline access
  sessionStorage.setItem("user", JSON.stringify(user));
}

export function clearAuthData(): void {
  sessionStorage.removeItem("user");
  // Cookie will be cleared by server on logout
}
```

#### Step 5: Update API Client

```typescript
// In apiCall function, set credentials to include cookies:
const response = await fetch(endpoint, {
  ...options,
  headers,
  credentials: "include", // Include cookies in requests
});
```

#### Step 6: Update Client Requests

Remove manual Bearer token headers since cookies are sent automatically:

```typescript
// Before:
const response = await fetch("/api/data", {
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

// After:
const response = await fetch("/api/data", {
  credentials: "include", // Cookies sent automatically
});
```

#### Step 7: Add Logout Endpoint

```typescript
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("auth_token", { path: "/" });
  res.json({ success: true, message: "Logged out" });
});
```

### Benefits
- ✅ Tokens not accessible to JavaScript (prevents XSS theft)
- ✅ CSRF protection with SameSite cookies
- ✅ Automatic cookie management
- ✅ No manual token passing needed

### Migration Checklist
- [ ] Update server endpoints to set httpOnly cookies
- [ ] Add CSRF protection
- [ ] Update authMiddleware to read from cookies
- [ ] Update client auth-utils.ts
- [ ] Update API client to use credentials: "include"
- [ ] Remove manual Authorization headers from client
- [ ] Add logout endpoint
- [ ] Test authentication flow end-to-end
- [ ] Update documentation

---

## 2. Enable TypeScript Strict Mode

### Current State
TypeScript strict mode is disabled in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": false,
    "strictNullChecks": false,
    "noImplicitAny": false
  }
}
```

### Target State
Enable strict mode and fix all compilation errors.

### Implementation Steps

#### Step 1: Enable Strict Mode Gradually

Edit `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Step 2: Run Type Checking

```bash
npm run typecheck
```

#### Step 3: Fix Common Issues

**Issue: Implicit any**
```typescript
// Before
const user = data.user;

// After
const user: User = data.user;
```

**Issue: Null/undefined checks**
```typescript
// Before
if (user) { user.name; }

// After
if (user !== null && user !== undefined) { user.name; }
// Or use optional chaining:
user?.name
```

**Issue: Unknown errors**
```typescript
// Before
catch (error) { console.error(error); }

// After
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

**Issue: Missing return types**
```typescript
// Before
function fetchData() { return fetch(...); }

// After
function fetchData(): Promise<Response> { return fetch(...); }
```

#### Step 4: Fix Type Assertions

Replace `as any` with proper types:

```typescript
// Before
(req as any).userId = payload.userId;

// After
// Add to Request interface or use module augmentation:
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Then use directly:
req.userId = payload.userId;
```

#### Step 5: Run Tests and Build

```bash
npm run typecheck
npm run build
npm test
```

### Common Files to Fix
1. **auth-utils.ts** - Add return types, handle null cases
2. **server/index.ts** - Add type assertions for req properties, fix unknown errors
3. **Client components** - Add proper types for API responses
4. **lib/api-client.ts** - Fix error handling types

### Benefits
- ✅ Catches bugs at compile time
- ✅ Better IDE autocomplete
- ✅ Safer refactoring
- ✅ Better code documentation
- ✅ Prevents entire classes of runtime errors

### Estimated Effort
- Small project: 2-4 hours
- Medium project: 4-8 hours
- Large project: 8+ hours

### Checklist
- [ ] Enable strict mode in tsconfig.json
- [ ] Run typecheck and document errors
- [ ] Fix implicit any errors
- [ ] Fix null/undefined check errors
- [ ] Fix unknown type errors in catch blocks
- [ ] Add missing return types
- [ ] Remove unnecessary as any assertions
- [ ] Test application thoroughly
- [ ] Add strict mode to CI/CD pipeline

---

## Priority of Remaining Tasks

### Critical (Security)
1. **httpOnly Cookies Migration** - Prevents XSS token theft
   - Estimated effort: 3-4 hours
   - Impact: High (XSS protection)
   - Recommendation: **Do this first**

### Important (Code Quality)
2. **TypeScript Strict Mode** - Prevents runtime errors
   - Estimated effort: 4-6 hours
   - Impact: Medium (bug prevention)
   - Recommendation: **Do this second**

## Quick Reference Commands

```bash
# Type checking
npm run typecheck

# Build and check for errors
npm run build

# Run server in demo mode
DEMO_MODE=true npm run dev

# Build for production
npm run build
npm run start
```

## Additional Security Recommendations

Beyond the migration tasks:

1. **Add rate limiting globally** (already done for auth endpoints)
2. **Enable CORS restrictions** - Only allow trusted origins
3. **Add security headers** (HSTS, X-Frame-Options, etc.)
4. **Implement request logging** for audit trails
5. **Add API usage monitoring** to detect abuse
6. **Regular security audits** - Run npm audit regularly
7. **Dependency updates** - Keep packages updated
8. **Environment variable validation** - Verify required vars exist

## Testing the Changes

After implementing these changes, test:

1. Sign up and sign in flows
2. Token persistence across page reloads
3. Logout and token clearing
4. API requests with authentication
5. CSRF protection
6. XSS vulnerability (try accessing document.cookie)
7. Type checking passes
8. Application builds successfully

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN Web Docs: httpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
