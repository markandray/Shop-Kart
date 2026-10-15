# ShopKart — Login → Home Flow

React + Vite + Tailwind implementation of the ShopKart customer auth flow: Register, Login, and a protected Home page, wired to a Lab 01 backend.

## Setup

```bash
npm install
cp .env.example .env   # then set VITE_API_BASE_URL to your Lab 01 backend
npm run dev
```

Open http://localhost:5173 — it redirects to `/login`.

## Routes

| Route        | Page              |
|--------------|-------------------|
| `/register`  | Registration      |
| `/login`     | Login             |
| `/home`      | Protected home    |

## How the pieces fit together

- **`src/services/api.js`** — one axios instance, `withCredentials: true`, base URL from `VITE_API_BASE_URL`. Every request/response cookie handling goes through here.
- **`src/pages/Register.jsx`** — controlled form (name, email, password, phone), client-side validation, `POST /customers/register`, redirects to `/login` on success.
- **`src/pages/Login.jsx`** — controlled form (email, password), `POST /customers/login`, redirects to `/home` on success, shows "Invalid Credentials" on 401/400.
- **`src/pages/Home.jsx`** — on mount, calls `GET /customers/me`. Success renders the profile; failure redirects to `/login`. This fetch *is* the route guard — there's no separate client-side "isLoggedIn" flag, since the session lives in an HttpOnly cookie the frontend can't read anyway.
- **`src/components/Navbar.jsx`** — shown on Home, has the Logout button (`POST /customers/logout`, then redirect to `/login`).

## Backend response shape assumed

- `GET /customers/me` → `{ customer: { fullName, email, phone } }` (or the fields directly on the body — `Home.jsx` handles both).
- Errors → `{ message: "..." }`, surfaced in the forms.

Adjust the field names in `Home.jsx` / `Register.jsx` / `Login.jsx` if your Lab 01 backend uses different keys (e.g. `name` vs `fullName`, `phoneNumber` vs `phone`).

## Viva answers (quick reference)

1. **`withCredentials: true`** — tells the browser to attach and accept cookies on requests to a different origin than the page itself. Without it, the browser won't send the session cookie back to the API, so every request after login would look unauthenticated.
2. **JS can't read an HttpOnly cookie** — that flag is set by the server specifically to hide the cookie from `document.cookie` and any script on the page, so a malicious script (e.g. via XSS) can't steal the session token.
3. **`/home` is a protected route** — because it should only be viewable by an authenticated user, so it never trusts local state; it verifies the session with the server (`/customers/me`) before rendering anything, and bounces to `/login` if that check fails.
4. **Fetching `/customers/me` instead of storing the user manually** — storing user data client-side (e.g. in localStorage) can go stale or be tampered with, and doesn't prove the session is still valid server-side. Asking the server "who am I right now" is the source of truth and doubles as the auth check.
5. **Authentication vs. authorization** — authentication confirms *who* you are (login/password check); authorization decides *what* you're allowed to do once you're known (e.g. can this customer view this order, is this user an admin).
