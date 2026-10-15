import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getCart,
  addToCartRequest,
  updateCartQuantity,
  removeCartItem,
} from '../services/api.js'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([]) // [{ product, quantity }]
  const [loaded, setLoaded] = useState(false) // true after the first successful load
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingIds, setPendingIds] = useState(() => new Set())

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getCart()
      setItems(res.data.cart)
      setLoaded(true)
    } catch {
      setError('Unable to load your cart.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Runs one mutation, tracks per-product pending state, and replaces
  // the cart with the server's response. Throws a friendly Error on failure.
  const mutate = useCallback(async (productId, request) => {
    setPendingIds((prev) => new Set(prev).add(productId))
    try {
      const res = await request()
      setItems(res.data.cart)
      setLoaded(true)
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }, [])

  const addToCart = useCallback(
    (productId) => mutate(productId, () => addToCartRequest(productId)),
    [mutate]
  )
  const updateQuantity = useCallback(
    (productId, quantity) => mutate(productId, () => updateCartQuantity(productId, quantity)),
    [mutate]
  )
  const removeFromCart = useCallback(
    (productId) => mutate(productId, () => removeCartItem(productId)),
    [mutate]
  )

  // Derived values: never stored, always computed from `items`
  const itemCount = useMemo(
    () => (loaded ? items.reduce((sum, i) => sum + i.quantity, 0) : null),
    [items, loaded]
  )
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  )
  const quantities = useMemo(
    () => new Map(items.map((i) => [i.product._id, i.quantity])),
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      itemCount, // null until the cart has loaded once
      subtotal,
      getQuantity: (productId) => quantities.get(productId) ?? 0,
      isPending: (productId) => pendingIds.has(productId),
      refresh,
      addToCart,
      updateQuantity,
      removeFromCart,
    }),
    [items, loading, error, itemCount, subtotal, quantities, pendingIds, refresh, addToCart, updateQuantity, removeFromCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}