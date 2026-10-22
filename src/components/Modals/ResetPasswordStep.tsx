import React, { useState } from 'react';

interface ResetPasswordStepProps {
  initialEmail?: string;
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export function ResetPasswordStep({
  initialEmail = '',
  onSuccess,
  onBackToLogin
}: ResetPasswordStepProps) {
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setSuccessMessage('Password has been reset successfully! You can now sign in.');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="reset-password-step-container" className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-md flex items-center justify-center text-white text-2xl mx-auto mb-3">
          <i className="ph-fill ph-key"></i>
        </div>
        <h2 className="text-2xl font-black text-apple-text tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-apple-subtext mt-1">
          Enter your registered email and your new password.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs sm:text-sm">
          <i className="ph-fill ph-warning-circle text-lg shrink-0 mt-0.5 text-rose-500"></i>
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs sm:text-sm">
          <i className="ph-fill ph-check-circle text-lg shrink-0 mt-0.5 text-emerald-600"></i>
          <span className="leading-snug">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-apple-text mb-1.5">
            Registered Email Address
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-apple-subtext text-lg pointer-events-none">
              <i className="ph-fill ph-envelope-simple"></i>
            </span>
            <input
              id="reset-password-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-apple-text mb-1.5">
            New Password
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-apple-subtext text-lg pointer-events-none">
              <i className="ph-fill ph-lock-key"></i>
            </span>
            <input
              id="reset-password-new-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full pl-10 pr-11 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
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

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold text-apple-text mb-1.5">
            Confirm New Password
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-apple-subtext text-lg pointer-events-none">
              <i className="ph-fill ph-shield-check"></i>
            </span>
            <input
              id="reset-password-confirm-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full pl-10 pr-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>
        </div>

        <button
          id="reset-password-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold text-sm sm:text-base active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <i className="ph-bold ph-spinner animate-spin text-lg"></i>
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <i className="ph-bold ph-check"></i>
              <span>Update Password</span>
            </>
          )}
        </button>
      </form>

      {/* Back Button */}
      <div className="text-center pt-2">
        <button
          id="reset-password-back-btn"
          type="button"
          onClick={onBackToLogin}
          className="text-xs font-bold text-apple-subtext hover:text-apple-text transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <i className="ph-bold ph-arrow-left"></i>
          <span>Back to Sign In</span>
        </button>
      </div>
    </div>
  );
}
