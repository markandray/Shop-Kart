import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import useRequireAuth from '../hooks/useRequireAuth.js'
import { useCart } from '../context/CartContext.jsx'
import { createPaymentOrder, verifyPayment } from '../services/api.js'
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay.js'
import { formatPrice } from '../utils/format.js'

const FIELDS = [
  { name: 'fullName', label: 'Full Name', autoComplete: 'name' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel', inputMode: 'numeric' },
  { name: 'addressLine1', label: 'Address', autoComplete: 'address-line1' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', autoComplete: 'address-level1' },
  { name: 'pincode', label: 'Pincode', autoComplete: 'postal-code', inputMode: 'numeric' },
]

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
}

// Same rules as the backend (the backend re-checks them anyway)
const validate = (values) => {
  const errors = {}
  for (const f of FIELDS) {
    if (!values[f.name].trim()) errors[f.name] = `${f.label} is required.`
  }
  if (!errors.phone && !/^[6-9]\d{9}$/.test(values.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Phone must be a valid 10-digit mobile number.'
  }
  if (!errors.pincode && !/^\d{6}$/.test(values.pincode.trim())) {
    errors.pincode = 'Pincode must contain 6 digits.'
  }
  return errors
}

const BUTTON_LABEL = {
  idle: 'Place Order',
  creating: 'Creating order...',
  paying: 'Waiting for payment...',
  verifying: 'Confirming payment...',
}

export default function Checkout() {
  const navigate = useNavigate()
  const { customer, checking, loggingOut, handleLogout } = useRequireAuth()
  const { items, loading, error, subtotal, refresh } = useCart()

  const [values, setValues] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [phase, setPhase] = useState('idle') // idle | creating | paying | verifying

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  const busy = phase !== 'idle'
  const hasOverStock = items.some((i) => i.quantity > i.product.stock)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return

    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return // no backend call if client validation fails

    const address = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v.trim()])
    )

    setFormError('')
    try {
      // 1. Backend validates cart + stock, prices it, creates the Razorpay order
      setPhase('creating')
      const { data } = await createPaymentOrder(address)

      // 2. Open Razorpay Checkout
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        throw new Error('Unable to load the payment window. Check your connection and try again.')
      }
      setPhase('paying')
      const payment = await openRazorpayCheckout({
        data,
        prefill: { name: address.fullName, contact: address.phone },
      })

      // 3. Backend verifies the signature (the only thing that marks the order PAID)
      setPhase('verifying')
      try {
        await verifyPayment({ shopKartOrderId: data.shopKartOrderId, ...payment })
      } catch (err) {
        const msg = err.response?.data?.message || 'Please try again.'
        throw new Error(`We could not confirm your payment: ${msg}`)
      }

      // 4. Navigate first (unmounts this page), then resync the cart so Navbar shows Cart (0)
      navigate(`/order-success/${data.shopKartOrderId}`, { replace: true })
      refresh()
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Something went wrong.')
      setPhase('idle')
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
        <h1 className="font-display text-4xl text-ink">Checkout</h1>

        {loading && <p className="mt-6 text-sm text-ink/50">Loading your cart...</p>}

        {!loading && error && (
          <div className="mt-6">
            <p className="text-sm text-clay">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-3 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-10 text-center">
            <p className="text-lg text-ink">Your cart is empty 🛒</p>
            <p className="mt-1 text-sm text-ink/50">Add something before checking out.</p>
            <Link
              to="/products"
              className="mt-5 inline-block rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            >
              Browse Products
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-8 md:grid-cols-[1fr_18rem]">
            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="font-medium text-ink">Shipping Details</h2>
              <div className="mt-4 flex flex-col gap-4">
                {FIELDS.map((f) => (
                  <div key={f.name}>
                    <label htmlFor={f.name} className="block text-sm text-ink/80">
                      {f.label}
                    </label>
                    <input
                      id={f.name}
                      name={f.name}
                      type="text"
                      value={values[f.name]}
                      onChange={handleChange}
                      disabled={busy}
                      autoComplete={f.autoComplete}
                      inputMode={f.inputMode}
                      aria-invalid={Boolean(errors[f.name])}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none disabled:opacity-60"
                    />
                    {errors[f.name] && (
                      <p role="alert" className="mt-1 text-sm text-clay">
                        {errors[f.name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-lg border border-line bg-white p-5">
              <h2 className="font-medium text-ink">Order Summary</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.product._id} className="flex justify-between gap-3">
                    <span className="text-ink/80">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="text-ink">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-2 text-sm font-medium">
                <span className="text-ink">Total</span>
                <span className="text-ink">{formatPrice(subtotal)}</span>
              </div>

              {hasOverStock && (
                <p className="mt-3 text-sm text-clay">
                  Some items exceed available stock.{' '}
                  <Link to="/cart" className="underline">
                    Fix your cart
                  </Link>
                  .
                </p>
              )}
              {formError && (
                <p role="alert" className="mt-3 text-sm text-clay">
                  {formError}
                </p>
              )}
              {busy && phase !== 'creating' && (
                <p className="mt-3 text-xs text-ink/50">Please don't close or refresh this page.</p>
              )}

              <button
                type="submit"
                disabled={busy || hasOverStock}
                className="mt-4 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
              >
                {BUTTON_LABEL[phase]}
              </button>
              <Link
                to="/cart"
                className="mt-2 block text-center text-sm text-ink/60 hover:text-ink"
              >
                Back to cart
              </Link>
            </aside>
          </form>
        )}
      </main>
    </div>
  )
}