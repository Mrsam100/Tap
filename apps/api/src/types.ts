/** AuthUser shape matching @tap/shared AuthUser */
interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  plan: string;
  createdAt: string;
}

/** Hono environment type for context variables set by auth middleware */
export type AppEnv = {
  Variables: {
    user: AuthUser;
    session: { id: string; userId: string; expiresAt: Date };
  };
};
