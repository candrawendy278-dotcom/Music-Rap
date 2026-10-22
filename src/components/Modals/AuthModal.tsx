import React, { useState } from 'react';
import { useAuth, AuthUser } from '../../hooks/useAuth';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { ResetPasswordStep } from './ResetPasswordStep';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const { signInWithEmail, registerWithEmail } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'recover') => {
    resetFormState();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        const user = await signInWithEmail(trimmedEmail, password);
        resetFormState();
        onClose();
        if (onSuccess) {
          onSuccess(user);
        }
      } else {
        const user = await registerWithEmail(trimmedEmail, password);
        resetFormState();
        onClose();
        if (onSuccess) {
          onSuccess(user);
        }
      }
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="auth-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="auth-modal-card"
        className="bg-apple-card border border-apple-border/70 w-full max-w-md rounded-[28px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 relative"
      >
        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-apple-bg text-apple-subtext hover:text-apple-text flex items-center justify-center transition-colors cursor-pointer"
        >
          <i className="ph-bold ph-x text-base"></i>
        </button>

        {mode === 'recover' ? (
          <ResetPasswordStep
            initialEmail={email}
            onSuccess={() => {
              resetFormState();
              setMode('login');
              setSuccessMessage('Password reset complete. You can now sign in with your new password.');
            }}
            onBackToLogin={() => handleSwitchMode('login')}
          />
        ) : (
          <>
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md flex items-center justify-center text-white text-2xl mx-auto mb-3">
                {mode === 'register' ? (
                  <i className="ph-fill ph-user-plus"></i>
                ) : (
                  <i className="ph-fill ph-user"></i>
                )}
              </div>
              <h2 className="text-2xl font-black text-apple-text tracking-tight">
                {mode === 'register' ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-xs sm:text-sm text-apple-subtext mt-1">
                {mode === 'register'
                  ? 'Register with email to save and backup your career to the cloud'
                  : 'Sign in with your email and password to access your career'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-apple-bg p-1 rounded-2xl mb-5 border border-apple-border/40">
              <button
                id="auth-tab-login"
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`py-2 text-sm font-bold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-apple-card text-apple-text shadow-sm'
                    : 'text-apple-subtext hover:text-apple-text'
                }`}
              >
                Sign In
              </button>
              <button
                id="auth-tab-register"
                type="button"
                onClick={() => handleSwitchMode('register')}
                className={`py-2 text-sm font-bold rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-apple-card text-apple-text shadow-sm'
                    : 'text-apple-subtext hover:text-apple-text'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs sm:text-sm animate-in fade-in">
                <i className="ph-fill ph-warning-circle text-lg shrink-0 mt-0.5 text-rose-500"></i>
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMessage && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs sm:text-sm animate-in fade-in">
                <i className="ph-fill ph-check-circle text-lg shrink-0 mt-0.5 text-emerald-600"></i>
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-apple-text mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-apple-subtext text-lg pointer-events-none">
                    <i className="ph-fill ph-envelope-simple"></i>
                  </span>
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-apple-text">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      id="auth-forgot-password-link"
                      type="button"
                      onClick={() => handleSwitchMode('recover')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-apple-subtext text-lg pointer-events-none">
                    <i className="ph-fill ph-lock-key"></i>
                  </span>
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-11 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-apple-subtext hover:text-apple-text p-1 cursor-pointer"
                  >
                    <i className={`ph-bold ${showPassword ? 'ph-eye-slash' : 'ph-eye'} text-lg`}></i>
                  </button>
                </div>
              </div>

              {/* Confirm Password Input (Register) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-apple-text mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-apple-subtext text-lg pointer-events-none">
                      <i className="ph-fill ph-shield-check"></i>
                    </span>
                    <input
                      id="auth-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm sm:text-base active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="ph-bold ph-spinner animate-spin text-lg"></i>
                    <span>Processing...</span>
                  </>
                ) : mode === 'register' ? (
                  <>
                    <i className="ph-bold ph-user-plus"></i>
                    <span>Create Account</span>
                  </>
                ) : (
                  <>
                    <i className="ph-bold ph-sign-in"></i>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="mt-5 pt-4 border-t border-apple-border/50 text-center">
              {mode === 'login' ? (
                <p className="text-xs text-apple-subtext">
                  Don't have an account?{' '}
                  <button
                    id="auth-switch-to-register"
                    type="button"
                    onClick={() => handleSwitchMode('register')}
                    className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer"
                  >
                    Register now
                  </button>
                </p>
              ) : (
                <p className="text-xs text-apple-subtext">
                  Already have an account?{' '}
                  <button
                    id="auth-switch-to-login"
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
