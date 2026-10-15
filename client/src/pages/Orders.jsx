import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import OrderCard from '../components/OrderCard.jsx'
import useRequireAuth from '../hooks/useRequireAuth.js'
import { getOrders } from '../services/api.js'

export default function Orders() {
  const { customer, checking, loggingOut, handleLogout } = useRequireAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getOrders()
      .then((res) => active && setOrders(res.data.orders))
      .catch(() => active && setError('Unable to load your orders.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [attempt])

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar
        customerName={customer?.fullName || customer?.name}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl text-ink">My Orders</h1>

        {loading && <p className="mt-6 text-sm text-ink/50">Loading your orders...</p>}

        {!loading && error && (
          <div className="mt-6">
            <p className="text-sm text-clay">{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-3 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-10 text-center">
            <p className="text-lg text-ink">You have not placed any orders yet.</p>
            <Link
              to="/products"
              className="mt-5 inline-block rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}