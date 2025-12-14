// Simple password authentication manager
// For home use - stores hashed password in localStorage

/**
 * Hash password using Web Crypto API
 */
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Set up password for the first time
 */
export async function setupPassword(password) {
  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters' }
  }

  const hashedPassword = await hashPassword(password)
  localStorage.setItem('parentPassword', hashedPassword)

  return { success: true }
}

/**
 * Check if password is set up
 */
export function isPasswordSet() {
  return localStorage.getItem('parentPassword') !== null
}

/**
 * Verify password
 */
export async function verifyPassword(password) {
  const storedHash = localStorage.getItem('parentPassword')

  if (!storedHash) {
    // No password set yet
    return { success: false, error: 'No password set' }
  }

  const inputHash = await hashPassword(password)

  if (inputHash === storedHash) {
    // Create session token
    const sessionToken = generateSessionToken()
    sessionStorage.setItem('parentSession', sessionToken)
    sessionStorage.setItem('sessionTimestamp', Date.now().toString())

    return { success: true, token: sessionToken }
  } else {
    return { success: false, error: 'Incorrect password' }
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
  // Verify current password first
  const verification = await verifyPassword(currentPassword)

  if (!verification.success) {
    return { success: false, error: 'Current password is incorrect' }
  }

  // Set new password
  return await setupPassword(newPassword)
}

/**
 * Remove password protection (requires current password)
 */
export async function removePassword(currentPassword) {
  const verification = await verifyPassword(currentPassword)

  if (!verification.success) {
    return { success: false, error: 'Incorrect password' }
  }

  localStorage.removeItem('parentPassword')
  logoutSession()

  return { success: true }
}

/**
 * Generate random session token
 */
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
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
