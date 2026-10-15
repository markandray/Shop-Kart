import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'

export default function CartItem({ item }) {
  const { product, quantity } = item
  const { updateQuantity, removeFromCart, isPending } = useCart()
  const [error, setError] = useState('')

  const pending = isPending(product._id)
  const overStock = quantity > product.stock
  const atMax = quantity >= product.stock

  const run = async (action) => {
    if (pending) return
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    }
  }

  const btn =
    'h-8 w-8 rounded-md border border-line text-ink/80 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line'

  return (
    <article className="flex gap-4 rounded-lg border border-line bg-white p-4">
      <Link to={`/products/${product._id}`} className="shrink-0">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-24 w-24 rounded-md bg-paper object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to={`/products/${product._id}`} className="font-medium text-ink hover:underline">
              {product.name}
            </Link>
            <p className="text-sm text-ink/50">{formatPrice(product.price)} each</p>
          </div>
          <p className="font-medium text-ink">{formatPrice(product.price * quantity)}</p>
        </div>

        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              className={btn}
              disabled={pending || quantity <= 1}
              onClick={() => run(() => updateQuantity(product._id, quantity - 1))}
            >
              −
            </button>
            <span className="w-6 text-center text-sm" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              className={btn}
              disabled={pending || atMax}
              onClick={() => run(() => updateQuantity(product._id, quantity + 1))}
            >
              +
            </button>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => removeFromCart(product._id))}
            className="text-sm text-ink/60 underline hover:text-clay disabled:opacity-50"
          >
            {pending ? 'Updating...' : 'Remove'}
          </button>
        </div>

        {overStock && (
          <p className="text-sm text-clay">
            Only {product.stock} unit(s) available now. Please reduce the quantity.
          </p>
        )}
        {error && (
          <p className="text-sm text-clay" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  )
}