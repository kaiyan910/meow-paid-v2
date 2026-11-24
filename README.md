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
| Framework | Next.js App Router + React 19 |
| Language | TypeScript |
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

### Supabase setup

Copy `.env.example` to `.env.local` and set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to your project URL and publishable key or legacy anon key. The server also reads the old `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` names for existing local setups.

For an existing database, apply any outstanding [migrations](docs/migrations) through [007](docs/migrations/007-receipt-assistant.sql) before deploying this version. For a new database, apply the migrations in numeric order and set up the public `shop-logos` bucket with authenticated upload permissions.

The browser calls MeowPaid's own API. Supabase Auth sessions are stored in HTTP-only cookies and data requests run under each signed-in user's existing RLS permissions. Existing users sign in once after switching from the Vite app.

### Receipt assistant

Set `OPENROUTER_API_KEY` and `OPENROUTER_RECEIPT_MODEL` on the Next.js server. Use an OpenRouter model that supports image input and tool calling through a provider that supports zero data retention. The OpenRouter key is used only on the server.

From Transactions, open the robot button beside Add and upload one receipt photo. The assistant reads the image and looks up shops and payment subtypes. Review the draft, use the chat or form to correct it, and confirm when the amounts reconcile. A proposed shop is created without a logo in the same operation as the transaction. MeowPaid discards the photo and conversation when you leave the page.

### Development

```bash
pnpm dev
```

### Production build

```bash
pnpm build
pnpm start
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
├── app/                 # Next.js pages, layouts, API routes, and PWA manifest
├── components/          # Shared UI, forms, and charts
├── screens/             # Login, protected shell, and tab views
├── hooks/               # TanStack Query hooks for the app API
├── lib/server/          # Supabase session, database, and storage helpers
├── schemas/             # Zod validation for UI and API contracts
└── i18n/                # English and Traditional Chinese translations
```

## Deployment

GitHub Actions runs lint, tests, and a production build. Deploy the app to a Next.js host or a Node.js server running `pnpm start` behind HTTPS. Configure the Supabase environment variables on that server. The previous GitHub Pages site uses static hosting, so moving `mpv2.crookk.com` to this build requires pointing it at the Node.js deployment.

## License

Private project.
