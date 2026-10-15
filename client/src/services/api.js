import axios from 'axios'

// Base URL comes from the environment so the same build can point at
// a local backend during development and a deployed one in production.
// In production, default to the current origin when the API is served from the
// same host; otherwise set VITE_API_BASE_URL explicitly.
const BASE_URL =
  import.meta.env.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:5000')

// withCredentials: true is the important bit here — it tells the browser
// to send (and accept) cookies on cross-origin requests. The backend sets
// the session token as an HttpOnly cookie, so this is the only way the
// browser will attach it automatically on every subsequent request.
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const registerCustomer = (payload) => api.post('/customers/register', payload)

export const loginCustomer = (payload) => api.post('/customers/login', payload)

export const getCurrentCustomer = () => api.get('/customers/me')

export const logoutCustomer = () => api.post('/customers/logout')

// Only send filters that have a value, so the URL stays clean
export const getProducts = ({ search, category, sort } = {}) => {
  const params = {}
  if (search) params.search = search
  if (category) params.category = category
  if (sort) params.sort = sort
  return api.get('/products', { params })
}

export const getProductById = (id) => api.get(`/products/${id}`)

export const getWishlist = () => api.get('/wishlist')

export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`)

export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`)

export const toggleWishlist = (productId) => api.patch(`/wishlist/${productId}/toggle`)

export const getCart = () => api.get('/cart')

export const addToCartRequest = (productId) => api.post(`/cart/${productId}`)

export const updateCartQuantity = (productId, quantity) =>
  api.patch(`/cart/${productId}`, { quantity })

export const removeCartItem = (productId) => api.delete(`/cart/${productId}`)

export const createPaymentOrder = (shippingAddress) =>
  api.post('/orders/create-payment-order', { shippingAddress })

export const verifyPayment = (payload) => api.post('/orders/verify-payment', payload)

export const getOrders = () => api.get('/orders')

export const getOrderById = (id) => api.get(`/orders/${id}`)

export default api