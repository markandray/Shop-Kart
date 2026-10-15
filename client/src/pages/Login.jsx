import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginCustomer } from '../services/api.js'
import AuthLayout from '../components/AuthLayout.jsx'

const initialForm = { email: '', password: '' }

function validate(form) {
  const errors = {}
  if (!form.email.trim()) errors.email = 'Enter your email.'
  if (!form.password) errors.password = 'Enter your password.'
  return errors
}

export default function Login() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.justRegistered

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setAuthError('')

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      // withCredentials: true (set in services/api.js) makes the browser
      // store the HttpOnly session cookie the backend sends back here.
      await loginCustomer({ email: form.email.trim(), password: form.password })
      navigate('/home')
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 400) {
        setAuthError('Invalid Credentials')
      } else {
        setAuthError(err?.response?.data?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Pick up right where you left off."
      subtitle="Log in to see your saved cart, past orders, and delivery addresses."
    >
      <h1 className="font-display text-3xl text-ink mb-8">Log in</h1>

      {justRegistered && !authError && (
        <div className="mb-5 rounded-md border border-moss/25 bg-moss/10 px-4 py-3 text-sm text-mossDark">
          Account created. Log in to continue.
        </div>
      )}

      {authError && (
        <div className="mb-5 rounded-md border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink/80">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-moss ${
              errors.email ? 'border-clay' : 'border-line'
            }`}
          />
          {errors.email && <p className="mt-1.5 text-xs text-clay">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink/80">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-moss ${
              errors.password ? 'border-clay' : 'border-line'
            }`}
          />
          {errors.password && <p className="mt-1.5 text-xs text-clay">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-moss px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-mossDark disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink/60">
        New to ShopKart?{' '}
        <Link to="/register" className="font-medium text-moss hover:text-mossDark">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
