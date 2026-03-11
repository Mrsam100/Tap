import crypto from 'node:crypto';
import { eq, and, gt, lt } from 'drizzle-orm';
import { hash, verify } from '@node-rs/argon2';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { db, users, sessions, emailVerificationTokens, passwordResetTokens, auditLogs } from '@tap/db';

const SESSION_COOKIE = 'tap_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

// ── Session Management ──────────────────────────────────────────────

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string, meta?: { ipAddress?: string; userAgent?: string }) {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await db.insert(sessions).values({
    id, userId, expiresAt,
    ipAddress: meta?.ipAddress ?? null,
    userAgent: meta?.userAgent ?? null,
  });
  return { id, userId, expiresAt };
}

export async function validateSession(sessionId: string) {
  const result = await db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (result.length === 0) return null;

  const { sessions: session, users: user } = result[0];

  // IMP1: Session sliding — extend expiry if more than half the session has elapsed
  const halfLife = SESSION_MAX_AGE * 500; // half in ms
  const timeRemaining = session.expiresAt.getTime() - Date.now();
  if (timeRemaining < halfLife) {
    const newExpiry = new Date(Date.now() + SESSION_MAX_AGE * 1000);
    await db.update(sessions).set({ expiresAt: newExpiry }).where(eq(sessions.id, sessionId));
  }

  return { session, user };
}

export async function invalidateSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateAllUserSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// ── Password Hashing ────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 4,
  });
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  return verify(hashed, password);
}

// ── Token Utilities ─────────────────────────────────────────────────

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ── Cookie Helpers ──────────────────────────────────────────────────

export function setSessionCookie(c: Context, sessionId: string) {
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export function getSessionCookie(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE);
}

// ── Email Verification Token ────────────────────────────────────────

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

  await db.insert(emailVerificationTokens).values({ userId, tokenHash, expiresAt });
  return token;
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const result = await db
    .select()
    .from(emailVerificationTokens)
    .where(and(
      eq(emailVerificationTokens.tokenHash, tokenHash),
      gt(emailVerificationTokens.expiresAt, new Date())
    ))
    .limit(1);

  if (result.length === 0) return null;
  return result[0];
}

export async function deleteEmailVerificationToken(id: string) {
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id));
}

// ── Password Reset Token ────────────────────────────────────────────

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
  return token;
}

export async function verifyResetToken(token: string) {
  const tokenHash = hashToken(token);
  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      eq(passwordResetTokens.used, false),
      gt(passwordResetTokens.expiresAt, new Date())
    ))
    .limit(1);

  if (result.length === 0) return null;
  return result[0];
}

export async function markResetTokenUsed(id: string) {
  await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, id));
}

// ── User Helpers ────────────────────────────────────────────────────

/** Return only AuthUser-safe fields — no secrets, no internal data */
export function sanitizeUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    emailVerified: user.emailVerified ?? false,
    mfaEnabled: user.mfaEnabled ?? false,
    plan: user.plan ?? 'free',
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

// ── MFA Backup Codes ────────────────────────────────────────────────

const BACKUP_CODE_COUNT = 8;

/** Generate 8 backup codes (plaintext returned to user, hashed stored in DB) */
export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = crypto.randomBytes(4).toString('hex'); // 8-char hex code
    plain.push(code);
    hashed.push(hashToken(code));
  }
  return { plain, hashed };
}

/** Verify a backup code against hashed list. Returns updated list with used code removed, or null if invalid. */
export function verifyBackupCode(code: string, hashedCodes: string[]): string[] | null {
  const codeHash = hashToken(code.trim().toLowerCase());
  const idx = hashedCodes.indexOf(codeHash);
  if (idx === -1) return null;
  // Remove the used code
  return [...hashedCodes.slice(0, idx), ...hashedCodes.slice(idx + 1)];
}

// ── Audit Logging ───────────────────────────────────────────────────

export async function logAuditEvent(
  action: string,
  opts: { userId?: string | null; ipAddress?: string; userAgent?: string; metadata?: Record<string, unknown> } = {},
) {
  try {
    await db.insert(auditLogs).values({
      userId: opts.userId ?? null,
      action,
      ipAddress: opts.ipAddress ?? null,
      userAgent: opts.userAgent ?? null,
      metadata: opts.metadata ?? null,
    });
  } catch (err) {
    // Audit logging should never break the request — fire and forget
    console.error('Audit log error:', err);
  }
}

// ── Cleanup (V5 + V6) ──────────────────────────────────────────────

/** Delete expired sessions and tokens. Call periodically (e.g. every hour). */
export async function cleanupExpiredData() {
  const now = new Date();
  const [sessionsDeleted] = await Promise.all([
    db.delete(sessions).where(lt(sessions.expiresAt, now)),
    db.delete(emailVerificationTokens).where(lt(emailVerificationTokens.expiresAt, now)),
    db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, now)),
  ]);
  return sessionsDeleted;
}
