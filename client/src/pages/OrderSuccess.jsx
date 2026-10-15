import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import useRequireAuth from '../hooks/useRequireAuth.js'
import { getOrderById } from '../services/api.js'
import { formatPrice } from '../utils/format.js'

export default function OrderSuccess() {
  const { id } = useParams()
  const { customer, checking, loggingOut, handleLogout } = useRequireAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getOrderById(id)
      .then((res) => active && setOrder(res.data.order))
      .catch((err) => active && setError(err.response?.data?.message || 'Unable to load your order.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  const confirmed = order?.paymentStatus === 'PAID' && order?.status !== 'PENDING_PAYMENT'

  return (
    <div className="min-h-screen bg-paper">
      <Navbar
        customerName={customer?.fullName || customer?.name}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
      <main className="mx-auto max-w-4xl px-6 py-12">
        {loading && <p className="text-sm text-ink/50">Loading your order...</p>}

        {!loading && error && (
          <div>
            <p className="text-sm text-clay">{error}</p>
            <Link
              to="/orders"
              className="mt-4 inline-block rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink/80"
            >
              View My Orders
            </Link>
          </div>
        )}

        {!loading && !error && order && (
          <div className="mx-auto max-w-md rounded-lg border border-line bg-white p-8 text-center">
            {confirmed ? (
              <>
                <p className="text-4xl">✅</p>
                <h1 className="mt-3 font-display text-3xl text-ink">Order Placed Successfully</h1>
              </>
            ) : (
              <>
                <p className="text-4xl">⏳</p>
                <h1 className="mt-3 font-display text-3xl text-ink">Order not confirmed yet</h1>
                <p className="mt-2 text-sm text-clay">
                  Payment for this order has not been verified.
                </p>
              </>
            )}

            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="text-ink/60">Order ID</dt>
                <dd className="break-all text-ink">{order._id}</dd>
              </div>
              <div>
                <dt className="text-ink/60">Total</dt>
                <dd className="text-ink">{formatPrice(order.totalAmount)}</dd>
              </div>
              <div>
                <dt className="text-ink/60">Status</dt>
                <dd className="font-medium text-moss">{order.status}</dd>
              </div>
            </dl>

            {confirmed && (
              <p className="mt-6 text-sm text-ink/60">Your order has been saved successfully.</p>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <Link
                to={`/orders/${order._id}`}
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
              >
                View Order Details
              </Link>
              <Link
                to="/orders"
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink/80"
              >
                View My Orders
              </Link>
              <Link to="/products" className="mt-1 text-sm text-ink/60 hover:text-ink">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}