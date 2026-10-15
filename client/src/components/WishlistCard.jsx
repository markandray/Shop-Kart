import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice, stockLabel } from '../utils/format.js'

export default function WishlistCard({ product, onRemove }) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const out = product.stock === 0

  const handleRemove = async () => {
    if (removing) return
    setRemoving(true)
    setError('')
    try {
      await onRemove(product._id)
    } catch {
      setError('Unable to remove product. Please try again.')
      setRemoving(false)
    }
    // on success the card is removed from the list, so no reset needed
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-white">
      <div className="aspect-square bg-paper">
        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
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
          onClick={handleRemove}
          disabled={removing}
          className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink/80 transition-colors hover:border-clay hover:text-clay focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 disabled:opacity-60"
        >
          {removing ? 'Removing...' : 'Remove ♥'}
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