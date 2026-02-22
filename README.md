# CertifyPro — Enterprise Certificate Management SaaS

A full-stack, deployment-ready platform to design, generate, email, and verify PDF certificates at scale.

---

## Features

- **Visual Template Editor** — Drag-and-drop fields, custom backgrounds, live preview
- **Bulk Recipient Import** — CSV, XLSX, JSON upload with validation
- **PDF Generation Engine** — Built on pdf-lib with embedded QR codes for verification
- **Email Automation** — Batch send certificates via SMTP with customizable email templates
- **Public Verification** — QR/URL-based certificate authenticity checks
- **Analytics Dashboard** — Charts for generation trends, email delivery, template usage
- **Role-Based Access** — Super Admin, Admin, Viewer roles with JWT auth + token rotation
- **Background Jobs** — BullMQ + Redis for async certificate/email processing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TailwindCSS 3.4, Recharts, Framer Motion |
| Backend | Node.js, Express 4.18, Mongoose 8 |
| Database | MongoDB 7, Redis 7 |
| Auth | JWT (access + refresh tokens), bcryptjs |
| PDF | pdf-lib, QR code embedding |
| Email | Nodemailer, Handlebars templates |
| Jobs | BullMQ workers |
| DevOps | Docker, docker-compose |

---

## Project Structure

```
├── client/               # React SPA
│   ├── src/
│   │   ├── components/   # UI, layout, auth
│   │   ├── pages/        # All page views
│   │   ├── context/      # AuthContext
│   │   └── lib/          # API client, utils
│   └── package.json
├── server/               # Express API
│   ├── src/
│   │   ├── config/       # DB, Redis, CORS, email
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/    # Auth, validation, upload, rate-limit
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Business logic
│   │   ├── validators/   # Zod schemas
│   │   ├── jobs/         # BullMQ workers
│   │   ├── utils/        # Logger, errors, tokens
│   │   └── scripts/      # Seed script
│   └── package.json
├── docker-compose.yml    # Full production stack
├── docker-compose.dev.yml # Local Mongo + Redis only
├── Dockerfile            # Multi-stage production build
└── package.json          # Root workspace scripts
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — jobs degrade gracefully)

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
# Edit server/.env with your Mongo URI, JWT secrets, SMTP credentials
```

### 3. Start Development Services (Docker)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Seed the Database

```bash
npm run seed
```

Default login: `admin@certifypro.com` / `Admin@123456`

### 5. Run Development Servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

---

## Docker Production Deployment

```bash
# Build and start entire stack
docker-compose up -d --build

# View logs
docker-compose logs -f app
```

The production build serves the React SPA from the Express server on port 5000.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register admin |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |
| POST | `/api/recipients/upload` | Upload CSV/XLSX/JSON |
| GET | `/api/recipients/batches` | List batches |
| POST | `/api/certificates/generate` | Generate certificates |
| GET | `/api/certificates` | List certificates |
| GET | `/api/certificates/:id/download` | Download PDF |
| POST | `/api/emails/send` | Batch send emails |
| GET | `/api/emails/logs` | Email delivery logs |
| GET | `/api/verify/:certificateId` | Public verification |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/health` | Health check |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/certifypro` | MongoDB connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `JWT_SECRET` | — | Access token secret |
| `JWT_REFRESH_SECRET` | — | Refresh token secret |
| `SMTP_HOST` | — | SMTP server host |
| `SMTP_PORT` | 587 | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `FROM_EMAIL` | `noreply@certifypro.com` | Sender email |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed origins |

---

## License

ISC

