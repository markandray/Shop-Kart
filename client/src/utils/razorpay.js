// Loads Razorpay's Checkout script once. Resolves false instead of throwing,
// so the caller can show a friendly message.
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

// Opens Razorpay Checkout.
// Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature }.
// Rejects only when the user closes the window without paying.
// A "payment.failed" event is NOT final: the user can retry inside the same modal,
// so we only remember the message and use it if they then close the window.
export const openRazorpayCheckout = ({ data, prefill }) =>
  new Promise((resolve, reject) => {
    let lastFailure = null

    const rzp = new window.Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: 'ShopKart',
      description: 'ShopKart Order',
      order_id: data.razorpayOrderId,
      prefill,
      // NOT proof of payment. We just forward these to the backend for verification.
      handler: (response) =>
        resolve({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      modal: {
        ondismiss: () =>
          reject(
            new Error(
              lastFailure
                ? `Payment failed${lastFailure}. Your cart has not been cleared. Please try again.`
                : 'Payment cancelled. Your cart has not been cleared.'
            )
          ),
      },
    })

    rzp.on('payment.failed', (response) => {
      const reason = response?.error?.description
      lastFailure = reason ? ` (${reason})` : ''
    })

    rzp.open()
  })