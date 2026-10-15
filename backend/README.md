# ShopKart — Customer Authentication Service

REST API for customer registration, login, profile access, and logout,
built with Node.js, Express, MongoDB/Mongoose, bcrypt, and jsonwebtoken.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in real values:
   ```
   cp .env.example .env
   ```
   - `MONGO_URI` — your local or Atlas MongoDB connection string
   - `JWT_SECRET` — any long random string
3. Start MongoDB locally (or use Atlas).
4. Run the server:
   ```
   npm run dev
   ```
   Server starts on `http://localhost:5000` by default.

## Testing with Postman

Postman does not persist cookies across requests by default unless you use
the same Postman **Cookie jar** — it works automatically as long as you
keep requests inside the same Postman workspace/domain (`localhost:5000`).

1. **Register** — `POST /customers/register`
   ```json
   {
     "fullName": "John Doe",
     "email": "john@gmail.com",
     "password": "john123",
     "phone": "9876543210"
   }
   ```
2. **Login** — `POST /customers/login`
   ```json
   { "email": "john@gmail.com", "password": "john123" }
   ```
   Check the Postman "Cookies" tab for the response — you should see an
   `HttpOnly` cookie named `token`.
3. **Profile** — `GET /customers/me` (cookie sent automatically by Postman)
4. **Logout** — `POST /customers/logout`
5. **Bonus: Change Password** — `PATCH /customers/change-password`
   ```json
   { "oldPassword": "john123", "newPassword": "newpass456" }
   ```
   (Must be logged in — login again after logout to test this.)

## Design notes / Viva prep

- **bcrypt vs. encryption**: bcrypt is a one-way hash (with per-password
  salt built in), so the original password can never be recovered even if
  the database is compromised. Encryption is reversible and requires
  protecting a key — the wrong tool for storing passwords.
- **JWT payload**: contains only the customer's `_id` and standard claims
  (issued-at, expiry). No password or sensitive data is embedded, since a
  JWT payload is base64-encoded, not encrypted, and readable by anyone who
  has the token.
- **HttpOnly cookies**: prevents client-side JavaScript from reading the
  cookie, which blocks token theft via XSS attacks. Combined with
  `sameSite: "strict"` this also mitigates CSRF.
- **Password never returned**: the schema uses `select: false` on the
  password field so it is excluded from every query by default; it's only
  pulled in explicitly (`.select("+password")`) for login and
  change-password, where it's needed for `bcrypt.compare`.
- **Auth middleware**: centralizes token verification and user lookup so
  protected routes stay thin — it reads the cookie, verifies the JWT,
  loads the customer, and attaches it to `req.user` before calling `next()`.

## Project Structure

```
backend/
├── controllers/
│   └── customer.controller.js
├── models/
│   └── customer.model.js
├── routes/
│   └── customer.routes.js
├── middlewares/
│   └── auth.middleware.js
├── utils/
│   └── generateToken.js
├── index.js
└── .env
```
