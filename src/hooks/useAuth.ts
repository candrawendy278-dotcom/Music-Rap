import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase.ts';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { cloudSync } from '../utils/cloudSync.ts';

export interface AuthUser {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage or Firebase
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Check if server token exists in localStorage
      const savedToken = localStorage.getItem('music_sim_auth_token');
      const savedUserStr = localStorage.getItem('music_sim_auth_user');

      if (savedToken && savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (isMounted) {
            setUser({
              uid: parsed.uid,
              email: parsed.email,
              getIdToken: async () => savedToken,
            });
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem('music_sim_auth_token');
          localStorage.removeItem('music_sim_auth_user');
        }
      }

      // 2. Firebase auth state listener fallback
      const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
        if (!isMounted) return;
        if (fbUser) {
          const token = await fbUser.getIdToken();
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            getIdToken: async () => token,
          });
        } else if (!localStorage.getItem('music_sim_auth_token')) {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveLocalSession = (userData: { uid: string; email: string }, token: string) => {
    localStorage.setItem('music_sim_auth_token', token);
    localStorage.setItem('music_sim_auth_user', JSON.stringify(userData));
    const authUserObj: AuthUser = {
      uid: userData.uid,
      email: userData.email,
      getIdToken: async () => token,
    };
    setUser(authUserObj);
    return authUserObj;
  };

  const registerWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    const trimmedEmail = email.trim();
    // Try Server Auth directly (robust, guaranteed to work in any environment)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, password: pass }),
    });

    const data = await res.json();
    if (!res.ok) {
      // If server returned error, check if Firebase is available
      try {
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
        const token = await credential.user.getIdToken();
        return saveLocalSession({ uid: credential.user.uid, email: credential.user.email || trimmedEmail }, token);
      } catch {
        throw new Error(data.error || 'Registration failed.');
      }
    }

    return saveLocalSession(data.user, data.token);
  };

  const signInWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    const trimmedEmail = email.trim();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, password: pass }),
    });

    const data = await res.json();
    if (!res.ok) {
      // Check Firebase client SDK if server login wasn't found
      try {
        const credential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
        const token = await credential.user.getIdToken();
        return saveLocalSession(
          { uid: credential.user.uid, email: credential.user.email || trimmedEmail },
          token
        );
      } catch {
        throw new Error(data.error || 'Incorrect email or password. Please try again.');
      }
    }

    return saveLocalSession(data.user, data.token);
  };

  const resetPassword = async (email: string, newPassword?: string): Promise<void> => {
    const trimmedEmail = email.trim();
    if (newPassword) {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      return;
    }

    // Try Firebase reset email if no newPassword provided
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send password reset email.');
    }
  };

  const signOut = async () => {
    await cloudSync.clearLocalSaveOnSignOut();
    localStorage.removeItem('music_sim_auth_token');
    localStorage.removeItem('music_sim_auth_user');
    setUser(null);
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore if not signed in via Firebase
    }
  };

  return {
    user,
    loading,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    saveLocalSession,
    signOut
  };
}


