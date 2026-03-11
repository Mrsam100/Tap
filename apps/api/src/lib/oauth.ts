import { Google, GitHub } from 'arctic';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return new Google(clientId, clientSecret, `${API_URL}/api/auth/google/callback`);
}

export function getGitHubClient() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return new GitHub(clientId, clientSecret, `${API_URL}/api/auth/github/callback`);
}
