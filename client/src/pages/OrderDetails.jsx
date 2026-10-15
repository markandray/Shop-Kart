import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import useRequireAuth from '../hooks/useRequireAuth.js'
import { getOrderById } from '../services/api.js'
import { formatPrice } from '../utils/format.js'
import { formatDate, shortId } from '../utils/orders.js'

export default function OrderDetails() {
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
      .catch((err) => active && setError(err.response?.data?.message || 'Unable to load this order.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  const a = order?.shippingAddress

  return (
    <div className="min-h-screen bg-paper">
      <Navbar
        customerName={customer?.fullName || customer?.name}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/orders" className="text-sm text-ink/60 hover:text-ink">
          ← My Orders
        </Link>

        {loading && <p className="mt-6 text-sm text-ink/50">Loading order...</p>}
        {!loading && error && <p className="mt-6 text-sm text-clay">{error}</p>}

        {!loading && !error && order && (
          <>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="font-display text-4xl text-ink">Order #{shortId(order._id)}</h1>
              <span className="text-sm font-medium text-moss">{order.status}</span>
            </div>
            <p className="text-sm text-ink/50">Placed on {formatDate(order.createdAt)}</p>

            <div className="mt-6 grid gap-8 md:grid-cols-[1fr_18rem]">
              <section className="rounded-lg border border-line bg-white p-5">
                <h2 className="font-medium text-ink">Items</h2>
                <ul className="mt-4 divide-y divide-line">
                  {order.items.map((item) => (
                    <li key={item.product} className="flex items-center gap-4 py-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1 text-sm">
                        <p className="text-ink">{item.name}</p>
                        <p className="text-ink/50">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm text-ink">{formatPrice(item.price * item.quantity)}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <aside className="flex h-fit flex-col gap-4">
                <div className="rounded-lg border border-line bg-white p-5 text-sm">
                  <h2 className="font-medium text-ink">Payment</h2>
                  <dl className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-ink/60">Status</dt>
                      <dd className="text-ink">{order.paymentStatus}</dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2 font-medium">
                      <dt className="text-ink">Total</dt>
                      <dd className="text-ink">{formatPrice(order.totalAmount)}</dd>
                    </div>
                  </dl>
                  {order.razorpayPaymentId && (
                    <p className="mt-3 break-all text-xs text-ink/50">
                      Payment ID: {order.razorpayPaymentId}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-line bg-white p-5 text-sm">
                  <h2 className="font-medium text-ink">Shipping To</h2>
                  <address className="mt-3 not-italic text-ink/80">
                    {a.fullName}
                    <br />
                    {a.addressLine1}
                    <br />
                    {a.city}, {a.state} {a.pincode}
                    <br />
                    {a.phone}
                  </address>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}