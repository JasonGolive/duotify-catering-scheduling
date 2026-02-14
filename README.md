# Duotify Membership - Staff Management

A mobile-first staff management system for Duotify catering services built with Next.js 14, PostgreSQL, and Clerk authentication.

## Features

- 📱 Mobile-responsive design (375px - 1024px+)
- 👥 Full CRUD operations for staff management
- 🔐 Role-based access control (Manager/Staff)
- 🔍 Search and filter staff members
- 💰 Track per-event salaries
- ✅ Status management (Active/Inactive)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Clerk account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd duotify-membership-v1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database and Clerk credentials.

4. Set up the database:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npx prisma studio
```

## Project Structure

```
duotify-membership-v1/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── staff/            # Staff-specific components
│   └── layout/           # Layout components
├── lib/                  # Utilities and helpers
│   └── validations/      # Zod schemas
├── prisma/               # Database schema and migrations
└── specs/                # Feature specifications
```

## Documentation

- [Feature Specification](specs/001-staff-management/spec.md)
- [Implementation Plan](specs/001-staff-management/plan.md)
- [Data Model](specs/001-staff-management/data-model.md)
- [API Contracts](specs/001-staff-management/contracts/api-contracts.md)
- [Quickstart Guide](specs/001-staff-management/quickstart.md)

## License

Private - All Rights Reserved
