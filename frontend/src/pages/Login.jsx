import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginWithPassword, requestOtp } from '../services/api'
import emailjs from '@emailjs/browser'

// ── Shared Icons ──────────────────────────────────────────────────────────────
const EyeOff = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
  </svg>
)
const EyeOn = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
)
const AlertBanner = ({ msg, variant = 'error' }) => {
  const styles = {
    error:   'bg-red-600/15 border-red-500/30 text-red-400',
    warning: 'bg-amber-600/15 border-amber-500/30 text-amber-400',
  }
  return (
    <div className={`mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${styles[variant]}`}>
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {msg}
    </div>
  )
}

// ── Password Tab ──────────────────────────────────────────────────────────────
function PasswordTab({ onForgot }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.'
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
    if (serverError) setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setServerError('')

    try {
      const result = await loginWithPassword(form.email.trim().toLowerCase(), form.password)
      if (rememberMe) localStorage.setItem('ims_remember', 'true')
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {serverError && <AlertBanner msg={serverError} />}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" autoComplete="email"
            className={`w-full rounded-xl bg-gray-800 border px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.email ? 'border-red-500/70 focus:ring-red-500' : 'border-gray-700'}`}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="••••••••" autoComplete="current-password"
              className={`w-full rounded-xl bg-gray-800 border px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.password ? 'border-red-500/70 focus:ring-red-500' : 'border-gray-700'}`}
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff /> : <EyeOn />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
        </div>

        {/* Remember me & Forgot */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none group">
            <div onClick={() => setRememberMe((p) => !p)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-800 border-gray-600 group-hover:border-gray-400'}`}>
              {rememberMe && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
            </div>
            <span className="group-hover:text-gray-300 transition-colors">Remember me</span>
          </label>
          <button type="button" onClick={onForgot} className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in…</>
          ) : 'Sign In'}
        </button>
      </form>
    </>
  )
}

// ── OTP Login Tab ─────────────────────────────────────────────────────────────
function OTPTab() {
  const navigate = useNavigate()
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    const val = email.trim()
    if (!val) { setError('Please enter your email address.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setError('Enter a valid email address.'); return }

    setLoading(true)
    setError('')

    try {
      // Backend looks up the user's role automatically — no need to specify it
      const res = await requestOtp(val.toLowerCase())

      // Send OTP via EmailJS
      if (res.otp) {
        emailjs.init({ publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY })
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_email:      val.toLowerCase(),
            to_name:       val.split('@')[0],
            otp_code:      String(res.otp),
            valid_minutes: '5',
          }
        )
      }

      // Pass the role returned by the backend to the verify screen
      navigate('/verify-otp', {
        state: { flow: 'login-otp', identifier: val.toLowerCase(), role: res.role },
      })
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && <AlertBanner msg={error} />}
      <form onSubmit={handleSend} className="space-y-5" noValidate>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }}
            placeholder="you@company.com" autoComplete="email"
            className={`w-full rounded-xl bg-gray-800 border px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${error ? 'border-red-500/70 focus:ring-red-500' : 'border-gray-700'}`}
          />
          <p className="mt-1.5 text-xs text-gray-600">We&apos;ll send a 6-digit OTP to this email address.</p>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending OTP…</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>Send OTP to Email</>
          )}
        </button>
      </form>
    </>
  )
}

// ── Main Login ────────────────────────────────────────────────────────────────
export default function Login() {
  const [tab, setTab] = useState('password')

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"/>

      <div className="relative w-full max-w-md z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="Flowventory" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Flow<span className="text-green-400">ventory</span></h1>
          <p className="text-gray-400 text-sm mt-2">Welcome back! Please sign in to continue.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm p-8 shadow-2xl shadow-black/40">
          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-800/60 p-1 mb-6 gap-1">
            <button type="button" onClick={() => setTab('password')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === 'password' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-gray-200'}`}>
              Password
            </button>
            <button type="button" onClick={() => setTab('otp')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === 'otp' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-gray-200'}`}>
              OTP Login
            </button>
          </div>

          {tab === 'password' ? <PasswordTab onForgot={() => setTab('otp')} /> : <OTPTab />}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-800"/>
            <span className="text-xs text-gray-600">or</span>
            <div className="flex-1 h-px bg-gray-800"/>
          </div>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">Create account</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-5">
          Demo credentials:{' '}
          <span className="text-gray-500 font-mono">admin@ims.com</span>{' '}/{' '}
          <span className="text-gray-500 font-mono">admin123</span>
        </p>
      </div>
    </div>
  )
}
