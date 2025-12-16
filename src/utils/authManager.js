// Simple password authentication manager
// For home use - stores hashed password in server database

let passwordStatus = null;

/**
 * Check if password is set up
 */
export function isPasswordSet() {
  // Use cached status if available
  if (passwordStatus !== null) {
    return passwordStatus;
  }
  return false;
}

/**
 * Load password status from server
 */
export async function loadPasswordStatus() {
  try {
    const response = await fetch('/api/auth/password-status');
    const data = await response.json();
    passwordStatus = data.isSet;
    return passwordStatus;
  } catch (error) {
    console.error('Failed to load password status:', error);
    return false;
  }
}

/**
 * Set up password for the first time
 */
export async function setupPassword(password) {
  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters' }
  }

  try {
    const response = await fetch('/api/auth/setup-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (data.success) {
      passwordStatus = true;
    }

    return data;
  } catch (error) {
    return { success: false, error: 'Failed to set password' };
  }
}

/**
 * Verify password
 */
export async function verifyPassword(password) {
  try {
    const response = await fetch('/api/auth/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (data.success) {
      // Create session token
      sessionStorage.setItem('parentSession', data.token);
      sessionStorage.setItem('sessionTimestamp', Date.now().toString());
    }

    return data;
  } catch (error) {
    return { success: false, error: 'Failed to verify password' };
  }
}

/**
 * Check if current session is valid
 */
export function isSessionValid() {
  const token = sessionStorage.getItem('parentSession')
  const timestamp = sessionStorage.getItem('sessionTimestamp')

  if (!token || !timestamp) {
    return false
  }

  // Session expires after 24 hours
  const sessionAge = Date.now() - parseInt(timestamp)
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  if (sessionAge > maxAge) {
    logoutSession()
    return false
  }

  return true
}

/**
 * Logout - clear session
 */
export function logoutSession() {
  sessionStorage.removeItem('parentSession')
  sessionStorage.removeItem('sessionTimestamp')
}

/**
 * Change password
 */
export async function changePassword(currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters' };
  }

  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Failed to change password' };
  }
}

/**
 * Remove password protection (requires current password)
 */
export async function removePassword(currentPassword) {
  try {
    const response = await fetch('/api/auth/remove-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword })
    });

    const data = await response.json();

    if (data.success) {
      passwordStatus = false;
      logoutSession();
    }

    return data;
  } catch (error) {
    return { success: false, error: 'Failed to remove password' };
  }
}

/**
 * Get password strength
 */
export function getPasswordStrength(password) {
  if (!password) return { strength: 0, text: 'No password', color: 'gray' }

  let strength = 0

  if (password.length >= 4) strength++
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  if (strength <= 1) return { strength: 1, text: 'Weak', color: 'red' }
  if (strength <= 2) return { strength: 2, text: 'Fair', color: 'orange' }
  if (strength <= 3) return { strength: 3, text: 'Good', color: 'yellow' }
  if (strength <= 4) return { strength: 4, text: 'Strong', color: 'green' }
  return { strength: 5, text: 'Very Strong', color: 'green' }
}
