# Bank Payout Management System

Production-grade full-stack payout operations app built with Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn-style UI, Prisma, PostgreSQL, ExcelJS, xlsx, Recharts, Zustand, React Hook Form, Zod, and TanStack Table.

## Features

- Monthly Excel upload validation and import
- Dynamic column aliases, including `Appl Ref No`, `Application NO`, and `Ref No`
- Duplicate application number prevention
- Bank-specific formula architecture
- Bank-wise, DSE-wise, user-wise, monthly, and profit reports
- Excel, CSV, and PDF export endpoints
- Analytics dashboard with KPI cards and Recharts visualizations
- Admin pages for settings, bank rules, and users
- Prisma schema for `users`, `uploads`, `applications`, `bank_rules`, `reports`, `audit_logs`, and column mappings
- Rate limiting, file validation, input validation, sanitization, and Prisma SQL injection protection
- Multi-tenant-ready schema and service signatures

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Start PostgreSQL with Docker:

```bash
docker compose up -d postgres
```

4. Run migrations and seed data:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Default login:

- Email: `admin@bankpayout.local`
- Password: `Admin@12345`

## Docker

Run the full stack:

```bash
docker compose up --build
```

The app runs on `http://localhost:3000`, PostgreSQL on `localhost:5432`.

## Excel Template

Download the sample master sheet from:

```text
/api/template
```

Required master columns:

- `Month`
- `Appl Ref No`
- `Cust Name`
- `Bank`
- `96%`
- `GIVEN`

Optional columns:

- `DSA`
- `Card Type`
- `USER NAME`
- `DSE Name`

Aliases are configurable in **Settings**.

## Architecture

```text
app/                 Next.js App Router pages and API routes
components/          Reusable UI, layout, charts, and tables
lib/repositories/    Database access layer
lib/services/        Business logic for uploads, reports, templates, formulas
lib/validators/      Zod schemas
lib/security/        Rate limiting and API guard helpers
lib/export/          Excel, CSV, PDF export utilities
prisma/              Prisma schema and seed data
types/               Domain types
```

## Future Extension Points

- RBAC enforcement and maker-checker approval flows
- Tenant-aware auth middleware
- AI analytics service fed from `reports` and `applications`
- WhatsApp and email report delivery jobs
- Mobile API clients using the existing service layer
