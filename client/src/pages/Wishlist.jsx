import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import WishlistCard from '../components/WishlistCard.jsx'
import useRequireAuth from '../hooks/useRequireAuth.js'
import useWishlist from '../hooks/useWishlist.js'

export default function Wishlist() {
  const { customer, checking, loggingOut, handleLogout } = useRequireAuth()
  const { items, count, loading, error, retry, remove } = useWishlist(!checking)

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar
        customerName={customer?.fullName || customer?.name}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        wishlistCount={count}
      />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl text-ink">My Wishlist</h1>
        {!loading && !error && (
          <p className="mt-2 text-sm text-ink/50">
            {items.length} {items.length === 1 ? 'product' : 'products'} saved
          </p>
        )}

        <section className="mt-8" aria-live="polite">
          {loading && <p className="text-sm text-ink/50">Loading your wishlist...</p>}

          {!loading && error && (
            <div className="py-16 text-center">
              <p className="font-medium text-ink">Something went wrong.</p>
              <p className="mt-1 text-sm text-ink/50">We couldn't load your wishlist.</p>
              <button
                onClick={retry}
                className="mt-5 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-4xl" aria-hidden="true">❤️</p>
              <p className="mt-4 font-display text-2xl text-ink">Your wishlist is empty</p>
              <p className="mt-1 text-sm text-ink/50">Save products you love and find them here later.</p>
              <Link
                to="/products"
                className="mt-5 inline-block rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
              >
                Browse Products
              </Link>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <WishlistCard key={p._id} product={p} onRemove={remove} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}