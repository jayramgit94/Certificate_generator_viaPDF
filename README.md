# CertifyPro

CertifyPro is a full-stack web app to create, generate, send, and verify digital certificates.

## What It Does

- Create certificate templates (PDF/image based)
- Upload recipients in bulk (CSV/XLSX/JSON)
- Generate personalized PDF certificates with unique IDs and QR verification links
- Send certificates by email in batches
- Verify certificate authenticity on a public verification page

## How It Works

1. Admin uploads a template and configures fields (name, email, event, date, etc.)
2. Admin uploads recipient data
3. Backend merges template + recipient data and generates certificate PDFs
4. Files are stored in MongoDB GridFS and served through API file endpoints
5. Certificates can be emailed and verified publicly using certificate ID/QR

## Tech Overview

- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express
- Database: MongoDB (with GridFS for files)
- Auth: JWT access/refresh tokens
- PDF/Email: pdf-lib + Nodemailer

## Key Limits

- Max templates per user: 5
- MongoDB project storage cap: 200MB

## Run Locally (Quick)

```bash
npm run install:all
cp server/.env.example server/.env
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health: http://localhost:5000/api/health

## License

ISC

