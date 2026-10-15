const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatPrice = (n) => inr.format(n)
export const stockLabel = (n) => (n > 0 ? `${n} units left` : 'Out of stock')