import crypto from 'crypto';
import { emailService } from './emailService.ts';
import { serverStorage } from './storage.ts';
import { createAuthToken } from './authService.ts';

interface VerificationEntry {
  email: string;
  code: string;
  purpose: 'login_2fa' | 'password_reset';
  expiresAt: number;
  attemptsLeft: number;
  tempToken?: string;
  uid?: string;
}

const verifications = new Map<string, VerificationEntry>();

function getKey(email: string, purpose: string): string {
  return `${email.toLowerCase().trim()}_${purpose}`;
}

export const verificationService = {
  async sendLogin2FACode(email: string, uid: string) {
    const cleanEmail = email.toLowerCase().trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const tempToken = 'tmp_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const key = getKey(cleanEmail, 'login_2fa');
    verifications.set(key, {
      email: cleanEmail,
      code,
      purpose: 'login_2fa',
      expiresAt,
      attemptsLeft: 5,
      tempToken,
      uid
    });

    const emailResult = await emailService.sendVerificationEmail(cleanEmail, code, 'login_2fa');

    return {
      requires2FA: true,
      email: cleanEmail,
      tempToken,
      previewCode: emailResult.previewCode,
      isSimulated: emailResult.isSimulated,
      message: 'Verification code sent to your email.'
    };
  },

  verifyLogin2FA(tempToken: string, code: string) {
    const cleanCode = code.trim();
    let foundKey: string | null = null;
    let foundEntry: VerificationEntry | null = null;

    for (const [key, entry] of verifications.entries()) {
      if (entry.purpose === 'login_2fa' && entry.tempToken === tempToken) {
        foundKey = key;
        foundEntry = entry;
        break;
      }
    }

    if (!foundEntry || !foundKey) {
      throw new Error('Invalid or expired login session. Please try logging in again.');
    }

    if (Date.now() > foundEntry.expiresAt) {
      verifications.delete(foundKey);
      throw new Error('Verification code has expired. Please log in again.');
    }

    if (foundEntry.attemptsLeft <= 0) {
      verifications.delete(foundKey);
      throw new Error('Too many incorrect attempts. Please log in again.');
    }

    if (foundEntry.code !== cleanCode) {
      foundEntry.attemptsLeft -= 1;
      verifications.set(foundKey, foundEntry);
      throw new Error(`Incorrect verification code. ${foundEntry.attemptsLeft} attempts remaining.`);
    }

    // Code matches! Clear verification entry
    verifications.delete(foundKey);

    const uid = foundEntry.uid!;
    const email = foundEntry.email;
    const token = createAuthToken(uid, email);

    return {
      user: { uid, email },
      token
    };
  },

  async sendPasswordResetCode(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = serverStorage.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('No account found with this email address.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const key = getKey(cleanEmail, 'password_reset');

    verifications.set(key, {
      email: cleanEmail,
      code,
      purpose: 'password_reset',
      expiresAt,
      attemptsLeft: 5
    });

    const emailResult = await emailService.sendVerificationEmail(cleanEmail, code, 'password_reset');

    return {
      success: true,
      email: cleanEmail,
      previewCode: emailResult.previewCode,
      isSimulated: emailResult.isSimulated,
      message: 'Password reset code sent to your email.'
    };
  },

  verifyAndResetPassword(email: string, code: string, newPassword: string) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const key = getKey(cleanEmail, 'password_reset');
    const entry = verifications.get(key);

    if (!entry) {
      throw new Error('No active password reset request found for this email.');
    }

    if (Date.now() > entry.expiresAt) {
      verifications.delete(key);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    if (entry.attemptsLeft <= 0) {
      verifications.delete(key);
      throw new Error('Too many incorrect attempts. Please request a new code.');
    }

    if (entry.code !== cleanCode) {
      entry.attemptsLeft -= 1;
      verifications.set(key, entry);
      throw new Error(`Incorrect verification code. ${entry.attemptsLeft} attempts remaining.`);
    }

    // Verified! Update password
    verifications.delete(key);
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(newPassword, salt, 10000, 64, 'sha512').toString('hex');
    serverStorage.updatePassword(cleanEmail, `${salt}:${hash}`);

    return { success: true, message: 'Password has been reset successfully.' };
  }
};
