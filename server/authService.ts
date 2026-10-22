import crypto from 'crypto';
import { serverStorage } from './storage.ts';

const TOKEN_SECRET = process.env.AUTH_SECRET || 'music_superstar_app_secret_key_2026';

function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, combinedHash: string): boolean {
  const parts = combinedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(testHash, 'hex'));
}

export function createAuthToken(uid: string, email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      uid,
      email,
      exp: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
    })
  ).toString('base64url');

  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `app_tok_${payload}.${signature}`;
}

export function verifyAuthToken(token: string): { uid: string; email: string } | null {
  if (!token.startsWith('app_tok_')) return null;
  const raw = token.slice('app_tok_'.length);
  const [payloadStr, signature] = raw.split('.');
  if (!payloadStr || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadStr).digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return { uid: payload.uid, email: payload.email };
  } catch {
    return null;
  }
}

export const authService = {
  register(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const existing = serverStorage.findUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const { salt, hash } = hashPassword(password);
    const uid = 'usr_' + crypto.randomBytes(12).toString('hex');
    const newUser = {
      uid,
      email: cleanEmail,
      passwordHash: `${salt}:${hash}`,
      createdAt: new Date().toISOString(),
    };

    serverStorage.saveUser(newUser);
    const token = createAuthToken(uid, cleanEmail);

    return {
      user: { uid, email: cleanEmail },
      token,
    };
  },

  registerOrSync(uid: string, email: string, password?: string) {
    const cleanEmail = email.toLowerCase().trim();
    let existing = serverStorage.findUserByEmail(cleanEmail);
    if (!existing) {
      const { salt, hash } = hashPassword(password || 'synced_oauth_account');
      const newUser = {
        uid: uid || 'usr_' + crypto.randomBytes(12).toString('hex'),
        email: cleanEmail,
        passwordHash: `${salt}:${hash}`,
        createdAt: new Date().toISOString(),
      };
      serverStorage.saveUser(newUser);
      existing = newUser;
    } else if (password) {
      const { salt, hash } = hashPassword(password);
      serverStorage.updatePassword(cleanEmail, `${salt}:${hash}`);
    }
    return existing;
  },

  login(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const user = serverStorage.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('No account found with this email address. Please register first.');
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Incorrect email or password. Please try again.');
    }

    const token = createAuthToken(user.uid, user.email);
    return {
      user: { uid: user.uid, email: user.email },
      token,
    };
  },

  resetPasswordDirect(email: string, newPassword: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    const user = serverStorage.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('No account found with this email address.');
    }
    const { salt, hash } = hashPassword(newPassword);
    serverStorage.updatePassword(cleanEmail, `${salt}:${hash}`);
    return { success: true, message: 'Password has been updated successfully.' };
  },

  validateCredentials(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const user = serverStorage.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('No account found with this email address. Please register first.');
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Incorrect email or password. Please try again.');
    }

    return {
      uid: user.uid,
      email: user.email,
    };
  },

  resetPassword(email: string, newPassword: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const user = serverStorage.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('No account found with this email address.');
    }

    const { salt, hash } = hashPassword(newPassword);
    serverStorage.updatePassword(cleanEmail, `${salt}:${hash}`);
    return { success: true };
  }
};
