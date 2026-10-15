# ShopKart

A full-stack e-commerce app built with the MERN stack. Customers can register, browse and search products, save a wishlist, manage a cart, and pay through **Razorpay (Test Mode)**. Orders are saved permanently and shown in order history.

> Built as a six-lab sequence: Auth, Auth UI, Product Catalogue, Wishlist, Cart, Checkout and Orders.

## Features

- **Authentication**: register, login, logout and change password. The JWT is stored in an **HttpOnly cookie** (7 days, `sameSite: strict`), and passwords are hashed with bcrypt.
- **Product catalogue**: server-side search (debounced on the client), category filter, price sorting, product details page.
- **Wishlist**: persistent per-customer list with an add/remove toggle and a count in the Navbar.
- **Shopping cart**: stored in MongoDB, shared across the app with React Context. Includes stock validation, a live Navbar count and per-item loading states.
- **Checkout**: shipping form with client-side validation, then Razorpay Standard Checkout.
- **Orders**: purchase-time snapshot of name, price and image; order confirmation page, My Orders list and order details.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express (CommonJS) |
| Database | MongoDB with Mongoose |
| Auth | JWT in an HttpOnly cookie, bcrypt, cookie-parser, cors |
| Payments | Razorpay (Test Mode) |

## Project structure

```
Shop Kart/
├── backend/
│   ├── config/        razorpay.js
│   ├── controllers/   customer, product, wishlist, cart, order
│   ├── middlewares/   auth.middleware.js
│   ├── models/        customer, product, order
│   ├── routes/        customer, product, wishlist, cart, order
│   ├── scripts/       seed.js
│   ├── utils/         generateToken.js
│   └── index.js
└── client/
    └── src/
        ├── pages/       Home, Login, Register, Products, ProductDetails,
        │                Wishlist, Cart, Checkout, OrderSuccess, Orders, OrderDetails
        ├── components/  Navbar, AuthLayout, ProductCard, SearchBar,
        │                WishlistCard, CartItem, OrderCard
        ├── context/     CartContext.jsx
        ├── hooks/       useRequireAuth.js, useWishlist.js
        ├── services/    api.js
        ├── utils/       format.js, orders.js, razorpay.js
        └── App.jsx, main.jsx
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- A MongoDB instance (local or Atlas)
- A Razorpay account with **Test Mode** API keys

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/shopkart
JWT_SECRET=replace_with_a_long_random_string
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
```

Run it:

```bash
npm run dev
```

The API runs on `http://localhost:5000`. `nodemon` does not watch `.env`, so type `rs` to restart after changing it.

### 2. Seed sample data (optional)

```bash
cd backend
node scripts/seed.js
```

This wipes the products collection and inserts 12 products across Electronics, Fashion, Books and Home.

> Do not re-run the seed once wishlists, carts or orders exist. They reference product ids, and re-seeding leaves those ids dangling.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

The app runs on `http://localhost:5173`. Optionally create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

If it is not set, the client falls back to `http://localhost:5000`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | backend | API port (default 5000) |
| `MONGO_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | Secret used to sign auth tokens |
| `NODE_ENV` | backend | Environment name |
| `RAZORPAY_KEY_ID` | backend | Razorpay Test Key ID (also returned to the client, which is safe) |
| `RAZORPAY_KEY_SECRET` | backend | Razorpay Test Key Secret. **Never** expose this to the client or commit it |
| `VITE_API_BASE_URL` | client | Backend base URL |

`.env` must be listed in `.gitignore`. Keep `.env.example` with empty values only.

## API reference

All routes marked **Auth** require the login cookie. Errors have the shape `{ success: false, message }`.

### Customers

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/customers/register` | | Create an account |
| POST | `/customers/login` | | Log in and set the cookie |
| GET | `/customers/me` | ✅ | Current customer (used as the route guard) |
| POST | `/customers/logout` | ✅ | Clear the cookie |
| PATCH | `/customers/change-password` | ✅ | Change password |

### Products

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET | `/products` | | List. Query: `search`, `category`, `sort` (`price_asc` / `price_desc`) |
| GET | `/products/:id` | | Product details |
| POST | `/products` | | Create a product (currently open, no admin auth) |

### Wishlist

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET | `/wishlist` | ✅ | Saved products |
| POST | `/wishlist/:productId` | ✅ | Add (409 if already saved) |
| DELETE | `/wishlist/:productId` | ✅ | Remove |
| PATCH | `/wishlist/:productId/toggle` | ✅ | Add or remove in one call |

### Cart

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET | `/cart` | ✅ | Cart with live price and stock |
| POST | `/cart/:productId` | ✅ | Add one unit |
| PATCH | `/cart/:productId` | ✅ | Set quantity, body `{ quantity }` |
| DELETE | `/cart/:productId` | ✅ | Remove an item |

Every cart mutation returns the full populated cart.

### Orders

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/orders/create-payment-order` | ✅ | Validate address, cart and stock; create a pending order and a Razorpay order |
| POST | `/orders/verify-payment` | ✅ | Verify the Razorpay signature, mark the order paid, decrement stock, clear the cart |
| GET | `/orders` | ✅ | Current customer's paid orders, newest first |
| GET | `/orders/:id` | ✅ | One order (404 if it is not yours) |

## How checkout and payment work

```
Cart → Checkout form → POST /orders/create-payment-order
     → server validates cart + stock, calculates total, creates Razorpay order
     → Razorpay popup opens → user pays (Test Mode)
     → browser sends order_id, payment_id, signature → POST /orders/verify-payment
     → server verifies HMAC-SHA256 signature
     → order PAID + PLACED, stock decremented, cart cleared
     → success page, Navbar shows Cart (0)
```

Key rules:

- The client sends **only the shipping address**. Items and prices come from the server-side cart and live product data, and the server calculates the total.
- Amounts are sent to Razorpay in **paise** (`Math.round(total * 100)`).
- A payment is only trusted after the **signature is verified on the backend** using the Razorpay order id stored in the database.
- The cart is cleared **only after** successful verification. A cancelled or failed payment leaves it untouched.
- Stock is re-checked at order creation and decremented atomically at verification (`updateOne` with `stock: { $gte: qty }` and `$inc`), with rollback if any item fails.
- Verification is idempotent: the order is atomically claimed (`PENDING` → `PAID`), so a repeated call cannot decrement stock twice.
- Orders store a **snapshot** of name, price and image, so history stays correct if a product changes later.

### Testing payments

Use Razorpay **Test Mode** keys only. Test card and UPI details are listed in the Razorpay dashboard documentation. No real money is charged. While the popup is open, the browser console may show `localhost:7071 ERR_CONNECTION_REFUSED` errors. These come from Razorpay's checkout script and can be ignored.

## Security notes

- The auth token is an HttpOnly cookie, so JavaScript cannot read it. The client sends it with `withCredentials: true`, and the backend CORS allows `http://localhost:5173` with credentials.
- Identity always comes from `req.user`, never from a user id sent by the client. Orders are looked up with `{ _id, customer: req.user._id }` to prevent IDOR.
- The Razorpay Key Secret exists only in `backend/.env`.
- Signatures are compared with `crypto.timingSafeEqual`.

## Known limitations

- Stock is not reserved while items sit in a cart. It is re-verified at checkout and decremented at payment.
- If a customer pays but the browser never returns (tab closed), the order stays `PENDING`. Razorpay **webhooks** would solve this and are not implemented.
- If stock runs out between order creation and payment verification, the order stays paid but unfulfilled and needs a manual refund.
- Abandoned `PENDING_PAYMENT` orders are never cleaned up.
- `POST /products` has no admin protection yet.
- The wishlist count in the Navbar shows only on pages that load the wishlist.

## Scripts

| Location | Command | Description |
|---|---|---|
| `backend/` | `npm run dev` | Start the API with nodemon |
| `backend/` | `node scripts/seed.js` | Reset and seed products |
| `client/` | `npm run dev` | Start the Vite dev server |
| `client/` | `npm run build` | Production build |

> Do not run `npm audit fix --force`, and do not add `"type": "module"` to `backend/package.json` (the backend uses CommonJS).