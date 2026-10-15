import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice, stockLabel } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'

export default function ProductCard({ product, saved = false, onToggleWishlist }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cartError, setCartError] = useState('')
  const { addToCart, getQuantity, isPending } = useCart()

  const out = product.stock === 0
  const inCart = getQuantity(product._id)
  const adding = isPending(product._id)
  const atLimit = inCart >= product.stock

  const handleWishlist = async () => {
    if (saving) return // block duplicate clicks while a request is running
    setSaving(true)
    setError('')
    try {
      await onToggleWishlist(product)
    } catch {
      setError('Unable to update wishlist. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddToCart = async () => {
    if (adding) return
    setCartError('')
    try {
      await addToCart(product._id)
    } catch (err) {
      setCartError(err.message)
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-white">
      <div className="relative aspect-square bg-paper">
        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        {saved && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-sm text-clay" aria-hidden="true">
            ♥
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium text-ink">{product.name}</h3>
        <p className="text-sm text-ink/50">{product.category}</p>
        <p className="mt-1 text-lg font-medium text-ink">{formatPrice(product.price)}</p>
        <p className={`text-sm ${out ? 'text-clay' : 'text-moss'}`}>{stockLabel(product.stock)}</p>

        <Link
          to={`/products/${product._id}`}
          className="mt-3 rounded-lg bg-ink px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
        >
          View Details
        </Link>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || out || atLimit}
          className="rounded-lg border border-ink px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          {adding
            ? 'Adding...'
            : out
              ? 'Out of stock'
              : atLimit
                ? `Max in cart (${inCart})`
                : inCart > 0
                  ? `Add Another (${inCart} in cart)`
                  : 'Add to Cart'}
        </button>

        {cartError && (
          <p className="text-sm text-clay" role="alert">
            {cartError}
          </p>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          disabled={saving}
          aria-pressed={saved}
          className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 disabled:opacity-60 ${
            saved ? 'border-clay text-clay' : 'border-line text-ink/80 hover:border-ink'
          }`}
        >
          {saving ? '⏳ Saving...' : saved ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
        </button>

        {error && (
          <p className="text-sm text-clay" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  )
}