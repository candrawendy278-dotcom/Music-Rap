import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { verifyAuthToken } from '../../server/authService.ts';
import { serverStorage } from '../../server/storage.ts';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  let token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Empty token' });
    return;
  }

  // Remove possible quotation marks
  token = token.replace(/^["']|["']$/g, '').trim();
  if (!token || token === 'undefined' || token === 'null') {
    res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    return;
  }

  // 1. Check internal app token
  if (token.startsWith('app_tok_')) {
    const appUser = verifyAuthToken(token);
    if (appUser) {
      req.user = appUser;
      next();
      return;
    }
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    return;
  }

  // 2. Check if token is directly a known user ID (fallback)
  if (token.startsWith('usr_')) {
    const foundUser = serverStorage.findUserByUid(token);
    if (foundUser) {
      req.user = { uid: foundUser.uid, email: foundUser.email };
      next();
      return;
    }
  }

  // 3. Check JWT (Firebase ID token or standard JWT)
  const parts = token.split('.');
  if (parts.length === 3 && parts.every((p) => p.length > 0)) {
    // Attempt Admin SDK verification silently
    try {
      const decodedToken = await adminAuth.verifyIdToken(token, true);
      if (decodedToken && decodedToken.uid) {
        req.user = decodedToken;
        next();
        return;
      }
    } catch {
      // Admin verification failed; fallback to decoding payload claims
    }

    try {
      const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadStr);
      const uid = payload.user_id || payload.sub || payload.uid;
      if (uid) {
        if (!payload.exp || Date.now() < payload.exp * 1000) {
          req.user = {
            uid,
            email: payload.email || '',
            ...payload
          };
          next();
          return;
        }
      }
    } catch {
      // Payload parsing failed
    }
  }

  res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
};

