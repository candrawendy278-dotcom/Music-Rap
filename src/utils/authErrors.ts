/**
 * Helper to map Auth error codes to user-friendly messages in English
 */
export function getAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';

  if (message.includes('already exists')) {
    return 'An account with this email already exists. Please sign in.';
  }
  if (message.includes('at least 6 characters')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('No account found')) {
    return 'No account found with this email. Please register first.';
  }
  if (message.includes('Incorrect email or password')) {
    return 'Incorrect email or password. Please try again.';
  }

  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format. Please check your spelling.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please register first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Access temporarily blocked for security. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your connection and try again.';
    default:
      return message || 'An error occurred during the request. Please try again.';
  }
}

