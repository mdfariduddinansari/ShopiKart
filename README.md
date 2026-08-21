# ShopiKart

ShopiKart is a full-stack e-commerce and rental marketplace built with an Express (Node.js) backend and a React frontend.

---

Table of Contents :


- Project: Overview and purpose
- Features: What this app provides
- Prerequisites: Tools and accounts needed
- Setup: Backend and frontend setup steps
- Development: Running and testing
- Architecture: Key folders and files
- Contributing: How to help
- License & Contact n+


---

Project :

- Description: ShopiKart is an e-commerce platform that supports product sales, rentals, returns, referrals, recommendations, and admin workflows. It pairs a RESTful Express API with a modern React SPA.

Features :

- Product catalog: product CRUD and inventory management
- Orders & payments: order processing with hooks for payment providers
- Rentals: rental listings, bookings, rental agreements, and security workflows
- Returns & refunds: return request lifecycle and admin processing
- Recommendations: recommendation engine / NLP helper service
- Auth & roles: JWT-based auth and admin/user roles

Prerequisites :

- Node.js >= 16
- npm or yarn
- MongoDB (local or Atlas)
- Optional: Stripe or other payment provider credentials for payments

Quick Start :

1. Clone the repo

```bash
git clone <repo-url>
cd ShopiKart
```

2. Backend

```bash
cd backend
npm install
# copy or create .env with required vars (MONGODB_URI, JWT_SECRET, etc.)
npm run dev
```

- Backend entrypoint: [backend/server.js](backend/server.js)

3. Frontend

```bash
cd frontend
npm install
npm start
```

- Frontend entrypoint: [frontend/src/index.js](frontend/src/index.js)

Open http://localhost:3000 to view the frontend.

Development & Testing :

- Backend tests (if available):

```bash
cd backend
npm test
```

- Frontend tests:

```bash
cd frontend
npm test
```

Environment variables (examples) :

- `MONGODB_URI` — MongoDB connection string
- `PORT` — backend port (default 5000)
- `JWT_SECRET` — JWT signing key
- `STRIPE_KEY` — Stripe API key (if payments used)

Architecture & Key Files :

- Backend :
  - [backend/server.js](backend/server.js): Express app entry
  - [backend/routes](backend/routes): API route definitions
  - [backend/controllers](backend/controllers): controller logic (e.g., `orderController.js`)
  - [backend/models](backend/models): Mongoose models (e.g., `Product.js`, `order.js`, `User.js`)
  - [backend/services](backend/services) and [backend/utils](backend/utils): helpers and business logic

- Frontend :
  - [frontend/src](frontend/src): React source code
  - [frontend/src/components](frontend/src/components): reusable UI components (e.g., `ProductRecommendations.js`, `RentalAgreementDialog.js`)
  - [frontend/src/pages](frontend/src/pages): page views (Home, Cart, Checkout)

Deployment :

- Build the frontend for production and serve statics from a CDN or your backend:

```bash
cd frontend
npm run build
```

- Serve the `frontend/build` folder or integrate it into the Express static middleware.

Contributing :

- Open issues to describe bugs or feature requests.
- For code contributions, create a branch, add a clear PR description, and include tests or manual verification steps.

License :

- MIT License by default. Change or add LICENSE file as desired.

Contact :

- For questions, open an issue in the repository.

---

