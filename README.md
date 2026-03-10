# MeowPaid

A shared expense tracking and settlement application for splitting costs among multiple users. Track shared expenses, categorize them, view statistics, and calculate fair settlements.

## Features

- **Transaction Management** — Create, edit, and delete shared expenses with shop, payee, category, and itemized payment breakdowns
- **Statistics Dashboard** — View current month totals with category breakdowns and a 6-month trend chart filtered by payment type
- **Settlement Calculator** — Automatically calculates who owes whom based on average cost per user
- **Meta Data Management** — Manage shops (with logos), shop categories, payment types, and payment subtypes
- **Internationalization** — English and Traditional Chinese (繁體中文) support
- **PWA** — Installable as a Progressive Web App

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Routing | TanStack Router |
| Data Fetching | TanStack Query |
| Forms | TanStack Form |
| State Management | Zustand |
| Validation | Zod |
| UI Components | Shadcn + Radix UI |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| i18n | React-i18Next |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Testing | Vitest + React Testing Library |
| Linting | Biome |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/) v10+
- A [Supabase](https://supabase.com/) project

### Installation

```bash
git clone https://github.com/<your-username>/MeowPaid_v2.git
cd MeowPaid_v2
pnpm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-supabase-anon-key>
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Testing

```bash
pnpm test          # Single run
pnpm test:watch    # Watch mode
```

### Code Quality

```bash
pnpm check         # Biome check with auto-fix
pnpm lint          # Lint only
pnpm format        # Format only
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI primitives
│   ├── transactions/    # Transaction list & form components
│   ├── statistics/      # Charts and stat cards
│   └── meta/            # Meta data management components
├── pages/
│   ├── login-page.tsx
│   ├── main-page.tsx    # Protected layout shell
│   ├── create-transaction-page.tsx
│   ├── edit-transaction-page.tsx
│   └── tabs/            # Tab content (transactions, statistics, transfer, meta)
├── hooks/               # TanStack Query hooks for data fetching
├── store/               # Zustand stores (auth, meta, transaction, transfer)
├── schemas/             # Zod validation schemas
├── types/               # TypeScript type definitions
├── i18n/                # i18next config and locale files (en, zh)
└── lib/                 # Supabase client and utilities
```

## Deployment

The app deploys to **GitHub Pages** via GitHub Actions on push to `main`. The workflow runs tests, builds the app, and deploys automatically.

Required GitHub environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## License

Private project.
