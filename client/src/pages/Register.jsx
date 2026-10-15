import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerCustomer } from '../services/api.js'
import AuthLayout from '../components/AuthLayout.jsx'

const initialForm = { fullName: '', email: '', password: '', phone: '' }

function validate(form) {
  const errors = {}

  if (!form.fullName.trim()) {
    errors.fullName = 'Enter your full name.'
  }

  if (!form.email.trim()) {
    errors.email = 'Enter your email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!form.password) {
    errors.password = 'Create a password.'
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  }

  if (!form.phone.trim()) {
    errors.phone = 'Enter your phone number.'
  } else if (!/^\d{10}$/.test(form.phone.trim())) {
    errors.phone = 'Enter a 10-digit phone number.'
  }

  return errors
}

export default function Register() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await registerCustomer({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
      })
      navigate('/login', { state: { justRegistered: true } })
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Could not create your account. Please try again.'
      setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="New here"
      title="Your basket, your way."
      subtitle="Create an account to save addresses, track orders, and check out in one tap."
    >
      <h1 className="font-display text-3xl text-ink mb-8">Create your account</h1>

      {serverError && (
        <div className="mb-5 rounded-md border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          autoComplete="name"
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          autoComplete="tel"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-moss px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-mossDark disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink/60">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-moss hover:text-mossDark">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}

function Field({ label, name, type = 'text', value, onChange, error, autoComplete }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink/80">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-moss ${
          error ? 'border-clay' : 'border-line'
        }`}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-clay">
          {error}
        </p>
      )}
    </div>
  )
}
