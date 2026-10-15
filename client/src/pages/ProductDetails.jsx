import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import useRequireAuth from '../hooks/useRequireAuth.js'
import { getProductById } from '../services/api.js'
import { formatPrice, stockLabel } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'

export default function ProductDetails() {
  const { id } = useParams()
  const { customer, checking, loggingOut, handleLogout } = useRequireAuth()
  const { addToCart, getQuantity, isPending } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    if (checking) return
    let active = true
    setLoading(true)
    setError('')
    getProductById(id)
      .then((res) => active && setProduct(res.data.product))
      .catch((err) => {
        if (!active) return
        const status = err.response?.status
        setError(
          status === 404 || status === 400
            ? "We couldn't find this product."
            : 'Something went wrong while loading this product.'
        )
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [checking, id])

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  const out = product?.stock === 0
  const inCart = product ? getQuantity(product._id) : 0
  const adding = product ? isPending(product._id) : false
  const atLimit = product ? inCart >= product.stock : false

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
    <div className="min-h-screen bg-paper">
      <Navbar
        customerName={customer?.fullName || customer?.name}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/products" className="text-sm text-ink/50 hover:text-ink">
          Back to products
        </Link>

        {loading && <p className="mt-6 text-sm text-ink/50">Loading product...</p>}
        {!loading && error && <p className="mt-6 text-sm text-clay">{error}</p>}

        {!loading && product && (
          <div className="mt-6 grid gap-10 md:grid-cols-2">
            <img
              src={product.image}
              alt={product.name}
              className="w-full rounded-lg border border-line bg-white object-cover"
            />
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink/50">{product.category}</p>
              <h1 className="font-display text-4xl text-ink">{product.name}</h1>
              <p className="text-2xl font-medium text-ink">{formatPrice(product.price)}</p>
              <p className={`text-sm ${out ? 'text-clay' : 'text-moss'}`}>{stockLabel(product.stock)}</p>
              <p className="max-w-prose leading-relaxed text-ink/80">{product.description}</p>

              <button
                type="button"
                disabled={adding || out || atLimit}
                onClick={handleAddToCart}
                className="mt-4 rounded-lg bg-ink px-6 py-3 font-medium text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
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

              {inCart > 0 && (
                <Link to="/cart" className="text-sm text-ink/60 underline hover:text-ink">
                  View Cart
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}