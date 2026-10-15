import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import ProductCard from '../components/ProductCard.jsx'
import useRequireAuth from '../hooks/useRequireAuth.js'
import useWishlist from '../hooks/useWishlist.js'
import { getProducts } from '../services/api.js'

export default function Products() {
  const { customer, checking, loggingOut, handleLogout } = useRequireAuth()
  const wishlist = useWishlist(!checking)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('')

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Wait 400ms after the last keystroke so we don't fire a request per letter
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (checking) return
    let active = true // ignore stale responses if filters change mid-request
    setLoading(true)
    setError(false)
    getProducts({ search: debouncedSearch, category, sort })
      .then((res) => active && setProducts(res.data.products))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [checking, debouncedSearch, category, sort])

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar
        customerName={customer?.fullName || customer?.name}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        wishlistCount={wishlist.count}
      />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl text-ink mb-8">Products</h1>
        <SearchBar
          search={search}
          onSearch={setSearch}
          category={category}
          onCategory={setCategory}
          sort={sort}
          onSort={setSort}
        />

        <section className="mt-8" aria-live="polite">
          {loading && <p className="text-sm text-ink/50">Loading products...</p>}
          {!loading && error && <p className="text-sm text-clay">Something went wrong while loading products.</p>}
          {!loading && !error && products.length === 0 && <p className="text-sm text-ink/50">No products found.</p>}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  saved={wishlist.savedIds.has(p._id)}
                  onToggleWishlist={wishlist.toggle}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}