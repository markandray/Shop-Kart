import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

const linkClass = ({ isActive }) =>
  `text-sm transition-colors ${isActive ? 'font-medium text-ink' : 'text-ink/60 hover:text-ink'}`

export default function Navbar({ customerName, onLogout, loggingOut, wishlistCount }) {
  const { itemCount } = useCart()

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <span className="font-display text-xl text-moss">ShopKart</span>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <NavLink to="/home" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/products" className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/wishlist" className={linkClass}>
              Wishlist{typeof wishlistCount === 'number' ? ` (${wishlistCount})` : ''}
            </NavLink>
            <NavLink to="/cart" className={linkClass}>
              Cart{typeof itemCount === 'number' ? ` (${itemCount})` : ''}
            </NavLink>
            <NavLink to="/orders" className={linkClass}>
              Orders
            </NavLink>
          </nav>
          {customerName && (
            <span className="hidden text-sm text-ink/60 md:inline">Hi, {customerName}</span>
          )}
          <button
            onClick={onLogout}
            disabled={loggingOut}
            className="rounded-md border border-line px-3.5 py-2 text-sm font-medium text-ink/80 transition-colors hover:border-clay hover:text-clay disabled:opacity-60"
          >
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  )
}