import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'
import { formatDate, shortId } from '../utils/orders.js'

export default function OrderCard({ order }) {
  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium text-ink">Order #{shortId(order._id)}</h2>
          <p className="text-sm text-ink/50">{formatDate(order.createdAt)}</p>
        </div>
        <span className="text-sm font-medium text-moss">{order.status}</span>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-ink/80">
        {order.items.map((item) => (
          <li key={item.product}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <p className="text-sm font-medium text-ink">Total: {formatPrice(order.totalAmount)}</p>
        <Link
          to={`/orders/${order._id}`}
          className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink/80 hover:text-ink"
        >
          View Details
        </Link>
      </div>
    </article>
  )
}