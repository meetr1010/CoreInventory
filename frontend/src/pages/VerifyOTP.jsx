import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { requestOtp, verifyOtp, verifyRegisterOtp } from '../services/api'

const RESEND_SECONDS = 60

export default function VerifyOTP() {
  const navigate = useNavigate()
  const { state } = useLocation()

  const flow       = state?.flow        // 'register' | 'login-otp'
  const email      = state?.identifier  // email address
  const devOtp     = state?.devOtp      // backend-provided OTP (dev mode only)

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS)
  const [resendMsg, setResendMsg] = useState('')
  const inputRefs = useRef([])

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) return
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft])

  // Auto-focus first box
  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  // Guard: missing state
  if (!flow || !email) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Invalid page access.</p>
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 underline">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // ── Input handlers ──────────────────────────────────────────────────────────
  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError('')
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  // ── Verify ──────────────────────────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < 6) { setError('Please enter all 6 digits.'); return }

    setLoading(true)
    setError('')

    try {
      if (flow === 'login-otp') {
        // Real backend OTP login verification
        await verifyOtp(email, code, state?.role)
        navigate('/', { replace: true })
      } else if (flow === 'register') {
        // Real backend registration OTP verification — creates user in DB + returns JWT
        await verifyRegisterOtp(email, code, state?.role)
        setSuccess(true)
      }
    } catch (err) {
      setError(err.message || 'Incorrect or expired OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  // ── Resend ──────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (timeLeft > 0) return
    setResendMsg('')
    setError('')
    setDigits(['', '', '', '', '', ''])
    
    try {
      // Both login-otp and register flows use backend OTP endpoints
      if (flow === 'login-otp') {
        await requestOtp(email, state?.role)
      } else if (flow === 'register') {
        // Import registerUser dynamically to avoid circular deps
        const { registerUser } = await import('../services/api')
        // We can't easily re-send without the original form data; just inform user
        setResendMsg('Please go back and re-submit the registration form to get a new OTP.')
        setTimeLeft(0)
        return
      }
      setResendMsg('A new OTP has been sent to your email.')
      setTimeLeft(RESEND_SECONDS)
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.')
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-full max-w-md z-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Verified!</h2>
          <p className="text-gray-400 text-sm mb-8">
            Your email has been verified and your account is ready. You can now sign in.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-600 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            Go to Sign In
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  // ── Masked email ─────────────────────────────────────────────────────────────
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />

      <div className="relative w-full max-w-md z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Check Your <span className="text-indigo-400">Email</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            We sent a 6-digit code to{' '}
            <span className="text-gray-200 font-semibold">{maskedEmail}</span>
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm p-8 shadow-2xl shadow-black/40">

          {/* Info notice */}
          <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-sm">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Please check your inbox (and spam folder) for the OTP email. The code expires in <strong>5 minutes</strong>.</span>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Resend success */}
          {resendMsg && !error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {resendMsg}
            </div>
          )}

          <form onSubmit={handleVerify}>
            {/* 6-digit inputs */}
            <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-gray-800 text-white focus:outline-none focus:ring-2 transition-all
                    ${d ? 'border-indigo-500 focus:ring-indigo-500' : 'border-gray-700 focus:ring-indigo-500'}`}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </>
              ) : 'Verify & Continue'}
            </button>
          </form>

          {/* Resend section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the email?{' '}
              {timeLeft > 0 ? (
                <span className="text-gray-400">
                  Resend in{' '}
                  <span className="font-mono text-indigo-400">0:{String(timeLeft).padStart(2, '0')}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Resend OTP
                </button>
              )}
            </p>
          </div>

          {/* Back link */}
          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
