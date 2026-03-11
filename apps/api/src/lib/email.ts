const APP_URL = process.env.APP_URL || 'http://localhost:3000';

interface EmailClient {
  send(params: { from: string; to: string; subject: string; html: string }): Promise<void>;
}

function getEmailClient(): EmailClient | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  // Lazy import to avoid errors when resend isn't needed
  return {
    async send({ from, to, subject, html }) {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      await resend.emails.send({ from, to, subject, html });
    },
  };
}

const FROM = 'Tap <noreply@tap.bio>';

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${APP_URL}/verify-email?token=${token}`;
  const client = getEmailClient();

  if (!client) {
    console.log(`\n📧 Email Verification (dev mode):`);
    console.log(`   To: ${email}`);
    console.log(`   URL: ${url}\n`);
    return;
  }

  await client.send({
    from: FROM,
    to: email,
    subject: 'Verify your Tap account',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to Tap</h1>
        <p style="color: #666; margin-bottom: 24px;">Click the button below to verify your email address.</p>
        <a href="${url}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">If you didn't create a Tap account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${token}`;
  const client = getEmailClient();

  if (!client) {
    console.log(`\n📧 Password Reset (dev mode):`);
    console.log(`   To: ${email}`);
    console.log(`   URL: ${url}\n`);
    return;
  }

  await client.send({
    from: FROM,
    to: email,
    subject: 'Reset your Tap password',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Reset your password</h1>
        <p style="color: #666; margin-bottom: 24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${url}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}
