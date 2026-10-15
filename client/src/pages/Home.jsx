import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentCustomer, logoutCustomer } from '../services/api.js'
import Navbar from '../components/Navbar.jsx'

export default function Home() {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    // /home is "protected" only in the sense that this fetch is the real
    // gatekeeper: there is no client-side flag to check because the auth
    // token lives in an HttpOnly cookie JS can't read. If this call fails
    // (no valid session), we bounce to /login.
    getCurrentCustomer()
      .then((res) => {
        if (isMounted) setCustomer(res.data.customer ?? res.data)
      })
      .catch(() => {
        if (isMounted) navigate('/login', { replace: true })
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logoutCustomer()
    } catch {
      // Even if the request fails, drop the user back to login —
      // there's nothing useful to keep them on this page for.
    } finally {
      navigate('/login', { replace: true })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">
        Loading your account…
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="min-h-screen bg-paper">
      <Navbar
        customerName={customer.fullName || customer.name}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm text-ink/50 mb-1">Account</p>
        <h1 className="font-display text-4xl text-ink mb-10">
          Welcome back, {customer.fullName || customer.name}.
        </h1>

        <dl className="divide-y divide-line rounded-lg border border-line bg-white">
          <Row label="Full name" value={customer.fullName || customer.name} />
          <Row label="Email" value={customer.email} />
          <Row label="Phone number" value={customer.phone || customer.phoneNumber} />
        </dl>

        <Link
          to="/products"
          className="mt-8 inline-block rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white hover:bg-ink/90"
        >
          Browse products
        </Link>
      </main>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <dt className="text-sm text-ink/50">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value || '—'}</dd>
    </div>
  )
}