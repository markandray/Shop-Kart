import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentCustomer, logoutCustomer } from '../services/api.js'

// Same idea as Home.jsx: GET /customers/me IS the route guard.
export default function useRequireAuth() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [checking, setChecking] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let active = true
    getCurrentCustomer()
      .then((res) => active && setCustomer(res.data.customer ?? res.data))
      .catch(() => active && navigate('/login', { replace: true }))
      .finally(() => active && setChecking(false))
    return () => {
      active = false
    }
  }, [navigate])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logoutCustomer()
    } catch {
      // drop back to login even if the request fails
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return { customer, checking, loggingOut, handleLogout }
}