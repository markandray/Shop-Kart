import { useCallback, useEffect, useMemo, useState } from 'react'
import { getWishlist, removeFromWishlist, toggleWishlist } from '../services/api.js'

export default function useWishlist(enabled = true) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let active = true // ignore stale responses
    setLoading(true)
    setError(false)
    getWishlist()
      .then((res) => active && setItems(res.data.wishlist))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [enabled, reloadKey])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  const savedIds = useMemo(() => new Set(items.map((i) => i._id)), [items])

  // Bonus: one action that adds or removes. The server decides which and replies with `saved`.
  // Throws on failure so the calling card can show its own error message.
  const toggle = useCallback(async (product) => {
    const res = await toggleWishlist(product._id)
    if (res.data.saved) {
      setItems((prev) => (prev.some((i) => i._id === product._id) ? prev : [...prev, product]))
    } else {
      setItems((prev) => prev.filter((i) => i._id !== product._id))
    }
  }, [])

  // Used by the Wishlist page (DELETE /wishlist/:productId)
  const remove = useCallback(async (productId) => {
    await removeFromWishlist(productId)
    setItems((prev) => prev.filter((i) => i._id !== productId))
  }, [])

  // Bonus: Navbar count. null until the backend has answered, so we never show a wrong number.
  const count = loading || error ? null : items.length

  return { items, savedIds, count, loading, error, retry, toggle, remove }
}