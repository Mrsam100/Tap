import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import * as OTPAuth from 'otpauth';
import { db, users, oauthAccounts, sessions, emailVerificationTokens, passwordResetTokens } from '@tap/db';
import type { AppEnv } from '../types';
import type { Context } from 'hono';
import {
  hashPassword, verifyPassword,
  createSession, invalidateSession, invalidateAllUserSessions,
  setSessionCookie, clearSessionCookie, getSessionCookie, validateSession,
  createEmailVerificationToken, verifyEmailToken, deleteEmailVerificationToken,
  createPasswordResetToken, verifyResetToken, markResetTokenUsed,
  sanitizeUser, generateToken, hashToken,
  generateBackupCodes, verifyBackupCode, logAuditEvent,
} from '../lib/auth';
import { validateEmail, validatePassword, validateUsername } from '../lib/validation';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email';
import { requireAuth } from '../middleware/auth';
import { getGoogleClient, getGitHubClient } from '../lib/oauth';
import { generateCodeVerifier, generateState } from 'arctic';

export const authRoutes = new Hono<AppEnv>();

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ── Helpers ──────────────────────────────────────────────────────────

/** Extract IP and User-Agent from request for session/audit tracking */
function getClientInfo(c: Context) {
  return {
    ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown',
    userAgent: c.req.header('user-agent') || undefined,
  };
}

// ── In-memory per-email login attempt tracker ────────────────────────
// Tracks failed login attempts per email to add progressive delays.
// No lockout — just increasing delay to slow brute-force attacks.

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAST_ATTEMPTS = 5; // after this, add delay

function recordFailedLogin(email: string) {
  const now = Date.now();
  const entry = loginAttempts.get(email);
  if (!entry || now - entry.lastAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
  } else {
    entry.count++;
    entry.lastAttempt = now;
  }
}

function clearFailedLogins(email: string) {
  loginAttempts.delete(email);
}

function getLoginDelay(email: string): number {
  const entry = loginAttempts.get(email);
  if (!entry || entry.count <= MAX_FAST_ATTEMPTS) return 0;
  // Progressive delay: 1s, 2s, 4s, 8s... max 30s
  const extraAttempts = entry.count - MAX_FAST_ATTEMPTS;
  return Math.min(1000 * Math.pow(2, extraAttempts - 1), 30_000);
}

// Cleanup stale entries every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;
  for (const [email, entry] of loginAttempts) {
    if (entry.lastAttempt < cutoff) loginAttempts.delete(email);
  }
}, 30 * 60 * 1000);

// ── GET /check-username ──────────────────────────────────────────────

authRoutes.get('/check-username', async (c) => {
  const username = c.req.query('username');
  if (!username || typeof username !== 'string' || username.length < 3) {
    return c.json({ available: false });
  }

  const clean = username.trim().toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, clean)).limit(1);
  return c.json({ available: existing.length === 0 });
});

// ── POST /register ──────────────────────────────────────────────────

authRoutes.post('/register', async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  // V7 fix: safely extract and validate types
  const { email, username, password } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (typeof email !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
    return c.json({ error: 'Email, username, and password must be strings' }, 400);
  }

  // Validate
  const emailErr = validateEmail(email);
  if (emailErr) return c.json({ error: emailErr, field: 'email' }, 400);

  const usernameErr = validateUsername(username);
  if (usernameErr) return c.json({ error: usernameErr, field: 'username' }, 400);

  const passwordErr = validatePassword(password);
  if (passwordErr) return c.json({ error: passwordErr, field: 'password' }, 400);

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  // Check uniqueness — V2 fix: generic message for email to prevent enumeration
  const existingEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, cleanEmail)).limit(1);
  if (existingEmail.length > 0) return c.json({ error: 'Unable to create account. Please try a different email or sign in.', field: 'email' }, 409);

  const existingUsername = await db.select({ id: users.id }).from(users).where(eq(users.username, cleanUsername)).limit(1);
  if (existingUsername.length > 0) return c.json({ error: 'This username is taken', field: 'username' }, 409);

  // Create user
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    email: cleanEmail,
    username: cleanUsername,
    displayName: cleanUsername,
    passwordHash,
  }).returning();

  // Create session with device info
  const client = getClientInfo(c);
  const session = await createSession(user.id, client);
  setSessionCookie(c, session.id);

  // Audit log
  logAuditEvent('register', { userId: user.id, ...client });

  // Send verification email (async, don't block response)
  createEmailVerificationToken(user.id).then(token => {
    sendVerificationEmail(cleanEmail, token).catch(err => {
      console.error('Failed to send verification email:', err);
    });
  });

  return c.json({ user: sanitizeUser(user) }, 201);
});

// ── POST /login ─────────────────────────────────────────────────────

authRoutes.post('/login', async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { email, password, mfaCode } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return c.json({ error: 'Email and password are required' }, 400);
  }
  if (mfaCode !== undefined && typeof mfaCode !== 'string') {
    return c.json({ error: 'Invalid MFA code format' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  const client = getClientInfo(c);

  // Per-email progressive delay (no lockout)
  const delay = getLoginDelay(cleanEmail);
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Find user
  const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

  if (!user || !user.passwordHash) {
    // V1 timing fix: perform a dummy hash to prevent timing-based email enumeration.
    await hashPassword('dummy-password-timing-pad');
    recordFailedLogin(cleanEmail);
    logAuditEvent('login_failed', { ...client, metadata: { email: cleanEmail, reason: 'user_not_found' } });
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  // Verify password
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    recordFailedLogin(cleanEmail);
    logAuditEvent('login_failed', { userId: user.id, ...client, metadata: { reason: 'wrong_password' } });
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  // MFA check
  if (user.mfaEnabled && user.mfaSecret) {
    if (!mfaCode) {
      return c.json({ mfaRequired: true }, 200);
    }

    // Try TOTP code first
    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.mfaSecret) });
    const delta = totp.validate({ token: mfaCode, window: 1 });

    if (delta === null) {
      // Try backup code
      const storedBackupCodes: string[] = user.mfaBackupCodes ? JSON.parse(user.mfaBackupCodes) : [];
      if (storedBackupCodes.length > 0) {
        const remaining = verifyBackupCode(mfaCode, storedBackupCodes);
        if (remaining) {
          // Valid backup code — update remaining codes
          await db.update(users).set({
            mfaBackupCodes: JSON.stringify(remaining),
            updatedAt: new Date(),
          }).where(eq(users.id, user.id));
          logAuditEvent('mfa_backup_used', { userId: user.id, ...client, metadata: { remaining: remaining.length } });
        } else {
          recordFailedLogin(cleanEmail);
          logAuditEvent('login_failed', { userId: user.id, ...client, metadata: { reason: 'invalid_mfa' } });
          return c.json({ error: 'Invalid MFA code' }, 401);
        }
      } else {
        recordFailedLogin(cleanEmail);
        logAuditEvent('login_failed', { userId: user.id, ...client, metadata: { reason: 'invalid_mfa' } });
        return c.json({ error: 'Invalid MFA code' }, 401);
      }
    }
  }

  // Clear failed attempts on successful login
  clearFailedLogins(cleanEmail);

  // Create session with device info
  const session = await createSession(user.id, client);
  setSessionCookie(c, session.id);

  logAuditEvent('login', { userId: user.id, ...client });

  return c.json({ user: sanitizeUser(user) });
});

// ── POST /logout ────────────────────────────────────────────────────

authRoutes.post('/logout', async (c) => {
  const sessionId = getSessionCookie(c);
  if (sessionId) {
    await invalidateSession(sessionId);
  }
  clearSessionCookie(c);
  return c.json({ ok: true });
});

// ── GET /me ─────────────────────────────────────────────────────────

authRoutes.get('/me', requireAuth, (c) => {
  return c.json({ user: c.get('user') });
});

// ── GET /sessions — List active sessions for current user ───────────

authRoutes.get('/sessions', requireAuth, async (c) => {
  const authUser = c.get('user');
  const currentSession = c.get('session');

  const activeSessions = await db
    .select({
      id: sessions.id,
      ipAddress: sessions.ipAddress,
      userAgent: sessions.userAgent,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, authUser.id))
    .orderBy(sessions.createdAt);

  return c.json({
    sessions: activeSessions.map(s => ({
      ...s,
      isCurrent: s.id === currentSession.id,
    })),
  });
});

// ── DELETE /sessions/:id — Revoke a specific session ────────────────

authRoutes.delete('/sessions/:sessionId', requireAuth, async (c) => {
  const authUser = c.get('user');
  const targetId = c.req.param('sessionId');

  // Verify the session belongs to this user
  const [target] = await db.select().from(sessions)
    .where(and(eq(sessions.id, targetId), eq(sessions.userId, authUser.id)))
    .limit(1);

  if (!target) return c.json({ error: 'Session not found' }, 404);

  await invalidateSession(targetId);
  return c.json({ ok: true });
});

// ── POST /verify-email ──────────────────────────────────────────────

authRoutes.post('/verify-email', async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { token } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (!token || typeof token !== 'string') return c.json({ error: 'Token is required' }, 400);

  const record = await verifyEmailToken(token);
  if (!record) return c.json({ error: 'Invalid or expired token' }, 400);

  // Check if user is already verified (prevents token replay)
  const [user] = await db.select({ emailVerified: users.emailVerified }).from(users).where(eq(users.id, record.userId)).limit(1);
  if (user?.emailVerified) {
    await deleteEmailVerificationToken(record.id);
    return c.json({ error: 'Email is already verified' }, 400);
  }

  await db.update(users).set({ emailVerified: true }).where(eq(users.id, record.userId));
  await deleteEmailVerificationToken(record.id);

  return c.json({ ok: true });
});

// ── POST /forgot-password ───────────────────────────────────────────

authRoutes.post('/forgot-password', async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { email } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (!email || typeof email !== 'string') return c.json({ error: 'Email is required' }, 400);

  const cleanEmail = email.trim().toLowerCase();
  const client = getClientInfo(c);

  // Always return success (don't reveal if email exists)
  const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
  if (user) {
    // Delete old tokens + create new one in a transaction to prevent race conditions
    const token = await db.transaction(async (tx) => {
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
      const newToken = generateToken();
      const tokenHash = hashToken(newToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await tx.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });
      return newToken;
    });
    await sendPasswordResetEmail(cleanEmail, token).catch(err => {
      console.error('Failed to send reset email:', err);
    });
    logAuditEvent('password_reset_requested', { userId: user.id, ...client });
  }

  return c.json({ ok: true });
});

// ── POST /reset-password ────────────────────────────────────────────

authRoutes.post('/reset-password', async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { token, password } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
    return c.json({ error: 'Token and password are required' }, 400);
  }

  const passwordErr = validatePassword(password);
  if (passwordErr) return c.json({ error: passwordErr }, 400);

  const record = await verifyResetToken(token);
  if (!record) return c.json({ error: 'Invalid or expired token' }, 400);

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record.userId));
  await markResetTokenUsed(record.id);
  await invalidateAllUserSessions(record.userId);

  logAuditEvent('password_reset', { userId: record.userId, ...getClientInfo(c) });

  return c.json({ ok: true });
});

// ── POST /resend-verification ──────────────────────────────────────
// IMP5: Allow users to request a new verification email

authRoutes.post('/resend-verification', requireAuth, async (c) => {
  const authUser = c.get('user');

  if (authUser.emailVerified) {
    return c.json({ error: 'Email is already verified' }, 400);
  }

  // Delete old tokens for this user before creating a new one
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, authUser.id));

  const token = await createEmailVerificationToken(authUser.id);
  sendVerificationEmail(authUser.email, token).catch(err => {
    console.error('Failed to send verification email:', err);
  });

  return c.json({ ok: true });
});

// ── OAuth: Google ───────────────────────────────────────────────────

authRoutes.get('/google', async (c) => {
  const google = getGoogleClient();
  if (!google) return c.json({ error: 'Google OAuth not configured' }, 503);

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);

  const isProduction = process.env.NODE_ENV === 'production';
  setCookie(c, 'google_oauth_state', state, { httpOnly: true, secure: isProduction, sameSite: 'Lax', maxAge: 600, path: '/' });
  setCookie(c, 'google_code_verifier', codeVerifier, { httpOnly: true, secure: isProduction, sameSite: 'Lax', maxAge: 600, path: '/' });

  return c.redirect(url.toString());
});

authRoutes.get('/google/callback', async (c) => {
  const google = getGoogleClient();
  if (!google) return c.json({ error: 'Google OAuth not configured' }, 503);

  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'google_oauth_state');
  const codeVerifier = getCookie(c, 'google_code_verifier');

  if (!code || !state || state !== storedState || !codeVerifier) {
    return c.redirect(`${APP_URL}/login?error=oauth_failed`);
  }

  // B3: clear state cookies after use
  deleteCookie(c, 'google_oauth_state', { path: '/' });
  deleteCookie(c, 'google_code_verifier', { path: '/' });

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    // B2: validate Google API response
    const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
    const googleUser = await res.json() as { sub?: string; email?: string; name?: string; picture?: string };
    if (!googleUser.sub || !googleUser.email) throw new Error('Missing required fields from Google');

    const user = await findOrCreateOAuthUser('google', googleUser.sub, {
      email: googleUser.email,
      displayName: googleUser.name || null,
      avatarUrl: googleUser.picture || null,
    });

    const client = getClientInfo(c);
    const session = await createSession(user.id, client);
    setSessionCookie(c, session.id);
    logAuditEvent('login_oauth', { userId: user.id, ...client, metadata: { provider: 'google' } });
    return c.redirect(`${APP_URL}/dashboard`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return c.redirect(`${APP_URL}/login?error=oauth_failed`);
  }
});

// ── OAuth: GitHub ───────────────────────────────────────────────────

authRoutes.get('/github', async (c) => {
  const github = getGitHubClient();
  if (!github) return c.json({ error: 'GitHub OAuth not configured' }, 503);

  const state = generateState();
  const url = github.createAuthorizationURL(state, ['user:email']);

  const isProduction = process.env.NODE_ENV === 'production';
  setCookie(c, 'github_oauth_state', state, { httpOnly: true, secure: isProduction, sameSite: 'Lax', maxAge: 600, path: '/' });

  return c.redirect(url.toString());
});

authRoutes.get('/github/callback', async (c) => {
  const github = getGitHubClient();
  if (!github) return c.json({ error: 'GitHub OAuth not configured' }, 503);

  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'github_oauth_state');

  if (!code || !state || state !== storedState) {
    return c.redirect(`${APP_URL}/login?error=oauth_failed`);
  }

  // B3: clear state cookie after use
  deleteCookie(c, 'github_oauth_state', { path: '/' });

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    // B2: validate GitHub API responses
    const ghHeaders = { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Tap' };
    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);
    if (!userRes.ok) throw new Error(`GitHub user API failed: ${userRes.status}`);
    if (!emailsRes.ok) throw new Error(`GitHub emails API failed: ${emailsRes.status}`);

    const ghUser = await userRes.json() as { id?: number; login?: string; name?: string; avatar_url?: string };
    const emails = await emailsRes.json();

    if (!ghUser.id || !ghUser.login) throw new Error('Missing required fields from GitHub');
    if (!Array.isArray(emails)) throw new Error('Invalid emails response from GitHub');

    const primaryEmail = (emails as Array<{ email: string; primary: boolean; verified: boolean }>)
      .find(e => e.primary && e.verified)?.email || emails[0]?.email;

    if (!primaryEmail) {
      return c.redirect(`${APP_URL}/login?error=no_email`);
    }

    const user = await findOrCreateOAuthUser('github', ghUser.id.toString(), {
      email: primaryEmail,
      displayName: ghUser.name || ghUser.login,
      avatarUrl: ghUser.avatar_url || null,
    });

    const client = getClientInfo(c);
    const session = await createSession(user.id, client);
    setSessionCookie(c, session.id);
    logAuditEvent('login_oauth', { userId: user.id, ...client, metadata: { provider: 'github' } });
    return c.redirect(`${APP_URL}/dashboard`);
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    return c.redirect(`${APP_URL}/login?error=oauth_failed`);
  }
});

// ── MFA: TOTP ───────────────────────────────────────────────────────

authRoutes.post('/mfa/setup', requireAuth, async (c) => {
  const user = c.get('user');

  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: 'Tap',
    label: user.email,
    secret,
  });

  // V4 fix: return secret to client, don't store in DB until verified.
  // The client must send it back with the verification code.
  return c.json({ secret: secret.base32, uri: totp.toString() });
});

authRoutes.post('/mfa/verify-setup', requireAuth, async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { code, secret } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (!code || typeof code !== 'string') return c.json({ error: 'Code is required' }, 400);
  if (!secret || typeof secret !== 'string') return c.json({ error: 'Secret is required' }, 400);

  // Validate the code against the provided secret
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret) });
  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) return c.json({ error: 'Invalid code' }, 400);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Store the verified secret, enable MFA, and save hashed backup codes
  const authUser = c.get('user');
  await db.update(users).set({
    mfaEnabled: true,
    mfaSecret: secret,
    mfaBackupCodes: JSON.stringify(backupCodes.hashed),
    updatedAt: new Date(),
  }).where(eq(users.id, authUser.id));

  logAuditEvent('mfa_enable', { userId: authUser.id, ...getClientInfo(c) });

  // Return plaintext backup codes (shown once, never stored in plaintext)
  return c.json({ ok: true, backupCodes: backupCodes.plain });
});

authRoutes.post('/mfa/disable', requireAuth, async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { password, code } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (!password || !code || typeof password !== 'string' || typeof code !== 'string') {
    return c.json({ error: 'Password and MFA code are required' }, 400);
  }

  const authUser = c.get('user');
  const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!user?.passwordHash || !user.mfaSecret) return c.json({ error: 'MFA not enabled' }, 400);

  const validPw = await verifyPassword(user.passwordHash, password);
  if (!validPw) return c.json({ error: 'Invalid password' }, 401);

  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.mfaSecret) });
  if (totp.validate({ token: code, window: 1 }) === null) return c.json({ error: 'Invalid MFA code' }, 401);

  await db.update(users).set({
    mfaEnabled: false,
    mfaSecret: null,
    mfaBackupCodes: null,
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  logAuditEvent('mfa_disable', { userId: user.id, ...getClientInfo(c) });

  return c.json({ ok: true });
});

// ── POST /mfa/regenerate-backup — Generate new backup codes ─────────

authRoutes.post('/mfa/regenerate-backup', requireAuth, async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { password } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (!password || typeof password !== 'string') return c.json({ error: 'Password is required' }, 400);

  const authUser = c.get('user');
  const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!user?.passwordHash || !user.mfaEnabled) return c.json({ error: 'MFA not enabled' }, 400);

  const validPw = await verifyPassword(user.passwordHash, password);
  if (!validPw) return c.json({ error: 'Invalid password' }, 401);

  const backupCodes = generateBackupCodes();
  await db.update(users).set({
    mfaBackupCodes: JSON.stringify(backupCodes.hashed),
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  logAuditEvent('mfa_backup_regenerated', { userId: user.id, ...getClientInfo(c) });

  return c.json({ backupCodes: backupCodes.plain });
});

// ── POST /change-password ────────────────────────────────────────────

authRoutes.post('/change-password', requireAuth, async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { currentPassword, newPassword } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return c.json({ error: 'Current and new password are required' }, 400);
  }

  const pwError = validatePassword(newPassword);
  if (pwError) return c.json({ error: pwError }, 400);

  const authUser = c.get('user');
  const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!user?.passwordHash) return c.json({ error: 'Account uses OAuth login — no password to change' }, 400);

  const validPw = await verifyPassword(user.passwordHash, currentPassword);
  if (!validPw) return c.json({ error: 'Current password is incorrect' }, 401);

  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, user.id));

  // Invalidate all other sessions for security
  await invalidateAllUserSessions(user.id);

  // Create a fresh session so the user stays logged in
  const client = getClientInfo(c);
  const session = await createSession(user.id, client);
  setSessionCookie(c, session.id);

  logAuditEvent('password_change', { userId: user.id, ...client });

  return c.json({ ok: true });
});

// ── POST /delete-account ──────────────────────────────────────────────

authRoutes.post('/delete-account', requireAuth, async (c) => {
  const authUser = c.get('user');

  logAuditEvent('account_delete', { userId: authUser.id, ...getClientInfo(c) });

  // Cascade delete: profiles, links, sessions, tokens, api keys, contacts, etc.
  // All related tables have ON DELETE CASCADE on the userId foreign key.
  await db.delete(users).where(eq(users.id, authUser.id));

  clearSessionCookie(c);
  return c.json({ ok: true });
});

// ── Helper: Find or Create OAuth User ───────────────────────────────

async function findOrCreateOAuthUser(
  provider: string,
  providerUserId: string,
  profile: { email: string; displayName: string | null; avatarUrl: string | null },
) {
  // B1 fix: query by BOTH provider AND providerUserId in SQL
  const existing = await db
    .select()
    .from(oauthAccounts)
    .innerJoin(users, eq(oauthAccounts.userId, users.id))
    .where(and(
      eq(oauthAccounts.provider, provider),
      eq(oauthAccounts.providerUserId, providerUserId),
    ))
    .limit(1);

  if (existing.length > 0) return existing[0].users;

  // Use transaction to prevent race conditions during user creation/linking
  const cleanEmail = profile.email.trim().toLowerCase();

  return await db.transaction(async (tx) => {
    const [existingUser] = await tx.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

    if (existingUser) {
      if (!existingUser.emailVerified) {
        // Delete the unverified account and create a fresh one with OAuth
        await tx.delete(users).where(eq(users.id, existingUser.id));
      } else {
        await tx.insert(oauthAccounts).values({
          userId: existingUser.id,
          provider,
          providerUserId,
        });
        return existingUser;
      }
    }

    // Create new user — generateUniqueUsername uses tx to avoid race conditions
    const username = await generateUniqueUsername(cleanEmail.split('@')[0], tx);
    const [newUser] = await tx.insert(users).values({
      email: cleanEmail,
      username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      emailVerified: true, // OAuth emails are verified by the provider
    }).returning();

    await tx.insert(oauthAccounts).values({
      userId: newUser.id,
      provider,
      providerUserId,
    });

    return newUser;
  });
}

async function generateUniqueUsername(base: string, txOrDb: Pick<typeof db, 'select'> = db): Promise<string> {
  // Clean to alphanumeric + underscore
  let username = base.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 25);
  if (username.length < 3) username = 'user';

  const existing = await txOrDb.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (existing.length === 0) return username;

  // Append random suffix, retry if collision
  for (let i = 0; i < 5; i++) {
    const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const candidate = `${username.slice(0, 25)}_${suffix}`;
    const clash = await txOrDb.select({ id: users.id }).from(users).where(eq(users.username, candidate)).limit(1);
    if (clash.length === 0) return candidate;
  }

  // Extremely unlikely fallback
  return `${username.slice(0, 20)}_${Date.now().toString(36)}`;
}
