const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Home']

export default function SearchBar({ search, onSearch, category, onCategory, sort, onSort }) {
  const field =
    'rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10'
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
        className={`${field} flex-1`}
      />
      <select value={category} onChange={(e) => onCategory(e.target.value)} aria-label="Category" className={field}>
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sort" className={field}>
        <option value="">Newest first</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
    </div>
  )
}