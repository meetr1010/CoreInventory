import emailjs from '@emailjs/browser'

// ── EmailJS config (from .env) ────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID

// ── OTP Helpers ───────────────────────────────────────────────────────────────
const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes

/** Generate a random 6-digit OTP string */
export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * Send a real OTP email via EmailJS and store the code in localStorage.
 * Public key is passed directly in send() — avoids conflicts with emailjs.init().
 * Returns { success: true } or { success: false, error }.
 */
export async function sendEmailOTP(email, recipientName = '') {
  const code = generateOTP()
  const entry = { code, expiry: Date.now() + OTP_TTL_MS }
  localStorage.setItem(`ims_otp_${email.toLowerCase()}`, JSON.stringify(entry))

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        to_name: recipientName || email.split('@')[0],
        otp_code: code,
        valid_minutes: 5,
      },
      EMAILJS_PUBLIC_KEY   // ← pass key here instead of emailjs.init()
    )
    return { success: true }
  } catch (err) {
    console.error('EmailJS error:', err)
    localStorage.removeItem(`ims_otp_${email.toLowerCase()}`)
    return { success: false, error: 'Failed to send OTP email. Please try again.' }
  }
}

/**
 * Verify an OTP for a given email.
 * Returns true if valid, false otherwise. Clears OTP on success.
 */
export function verifyOTP(email, inputCode) {
  const key = `ims_otp_${email.toLowerCase()}`
  const raw = localStorage.getItem(key)
  if (!raw) return false
  const { code, expiry } = JSON.parse(raw)
  if (Date.now() > expiry) {
    localStorage.removeItem(key)
    return false
  }
  if (inputCode.trim() === code) {
    localStorage.removeItem(key)
    return true
  }
  return false
}

// ── User Management ───────────────────────────────────────────────────────────

/** Persist a new user into the ims_users array */
export function saveUser(userObj) {
  const users = getUsers()
  users.push(userObj)
  localStorage.setItem('ims_users', JSON.stringify(users))
}

/** Get all registered users */
export function getUsers() {
  return JSON.parse(localStorage.getItem('ims_users') || '[]')
}

/** Find a user by email. Returns the user object or null. */
export function findUserByEmail(email) {
  return getUsers().find((u) => u.email?.toLowerCase() === email.toLowerCase().trim()) || null
}

// ── Session Management ────────────────────────────────────────────────────────

/** Log in a user (set session keys) */
export function loginUser(userObj) {
  localStorage.setItem('ims_logged_in', 'true')
  localStorage.setItem('ims_user', JSON.stringify(userObj))
}

/** Check if a user is currently logged in */
export function isLoggedIn() {
  return localStorage.getItem('ims_logged_in') === 'true'
}

/** Get the currently logged-in user object */
export function getUser() {
  const raw = localStorage.getItem('ims_user')
  return raw ? JSON.parse(raw) : null
}

/** Log out the current user */
export function logout() {
  localStorage.removeItem('ims_logged_in')
  localStorage.removeItem('ims_user')
  localStorage.removeItem('ims_remember')
  localStorage.removeItem('ims_token')   // ← clear JWT
}
