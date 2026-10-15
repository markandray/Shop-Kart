import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import CartItem from '../components/CartItem.jsx'
import useRequireAuth from '../hooks/useRequireAuth.js'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function Cart() {
  const { customer, checking, loggingOut, handleLogout } = useRequireAuth()
  const { items, loading, error, itemCount, subtotal, refresh } = useCart()

  const navigate = useNavigate()

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  const hasOverStock = items.some((i) => i.quantity > i.product.stock)

  return (
    <div className="min-h-screen bg-paper">
      <Navbar
        customerName={customer?.fullName || customer?.name}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl text-ink">My Cart</h1>

        {loading && <p className="mt-6 text-sm text-ink/50">Loading your cart...</p>}

        {!loading && error && (
          <div className="mt-6">
            <p className="text-sm text-clay">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-3 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-10 text-center">
            <p className="text-lg text-ink">Your cart is empty 🛒</p>
            <p className="mt-1 text-sm text-ink/50">Looks like you haven't added anything yet.</p>
            <Link
              to="/products"
              className="mt-5 inline-block rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            >
              Browse Products
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_16rem]">
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </div>

            <aside className="h-fit rounded-lg border border-line bg-white p-5">
              <h2 className="font-medium text-ink">Order Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/60">Items</dt>
                  <dd className="text-ink">{itemCount}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 font-medium">
                  <dt className="text-ink">Subtotal</dt>
                  <dd className="text-ink">{formatPrice(subtotal)}</dd>
                </div>
              </dl>
              {hasOverStock && (
                <p className="mt-3 text-sm text-clay">Fix quantities marked above to continue.</p>
              )}
              <button
                type="button"
                disabled={hasOverStock}
                onClick={() => navigate('/checkout')}
                className="mt-4 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
              >
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}