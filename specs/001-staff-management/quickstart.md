# Quickstart Guide: Staff Management Module

**Feature**: 001-staff-management  
**Last Updated**: 2025-02-14  
**Estimated Setup Time**: 15-20 minutes

## Overview

This guide will help you set up and run the Staff Management module locally. By the end, you'll have a fully functional mobile-responsive web application for managing catering service staff.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js**: v18.17+ or v20.3+ ([Download](https://nodejs.org/))
- **npm**: v9+ (comes with Node.js)
- **PostgreSQL**: v15+ ([Download](https://www.postgresql.org/download/) or use [Neon](https://neon.tech) for cloud)
- **Git**: For version control
- **Code Editor**: VS Code recommended with Prisma extension

**Optional**:
- **Clerk Account**: For authentication (free tier available at [clerk.com](https://clerk.com))

---

## Step 1: Clone and Install

```bash
# Navigate to project directory
cd duotify-membership-v1

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

**Expected dependencies**:
- `next@14.x` - Full-stack framework
- `@prisma/client` - Database ORM
- `@clerk/nextjs` - Authentication
- `react-hook-form` - Form management
- `zod` - Validation
- `@tanstack/react-query` - Data fetching
- `tailwindcss` - Styling

---

## Step 2: Environment Setup

Create a `.env.local` file in the project root:

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

**Required environment variables**:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/staff_management"

# Clerk Authentication (get from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Get Clerk Keys

1. Go to [clerk.com](https://clerk.com) and sign up (free)
2. Create new application: "Staff Management"
3. Copy API keys from dashboard → API Keys
4. Paste into `.env.local`

### Set Up Database

**Option A: Local PostgreSQL**
```bash
# Create database
createdb staff_management

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://localhost:5432/staff_management"
```

**Option B: Cloud Database (Neon)**
```bash
# Sign up at neon.tech (free tier)
# Create new project
# Copy connection string to .env.local
DATABASE_URL="postgresql://username:password@hostname/database"
```

---

## Step 3: Database Migration

Initialize the database schema:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed sample data (optional)
npx prisma db seed
```

**Verify database**:
```bash
# Open Prisma Studio to view data
npx prisma studio

# Opens browser at http://localhost:5555
# You should see 'staff' and 'users' tables
```

---

## Step 4: Configure Clerk Roles

Set up role-based access control in Clerk dashboard:

1. **Go to**: Clerk Dashboard → User & Authentication → Metadata
2. **Add custom field**: `role` (type: text)
3. **Create test users**:
   
   **Manager User**:
   - Email: `manager@test.com`
   - Password: Set a test password
   - Metadata: `{ "role": "manager" }`
   
   **Staff User**:
   - Email: `staff@test.com`
   - Password: Set a test password
   - Metadata: `{ "role": "staff" }`

4. **Configure middleware**: Already set up in `middleware.ts`

---

## Step 5: Run Development Server

```bash
# Start Next.js dev server
npm run dev

# Server runs at http://localhost:3000
```

**Open in browser**:
```
http://localhost:3000
```

You should see the sign-in page.

---

## Step 6: Test the Application

### Test as Manager

1. **Sign in** with manager credentials
2. **Navigate to** `/staff` (staff management page)
3. **Add new staff**:
   - Click "Add Staff" button
   - Fill in: Name, Phone, Salary
   - Submit form
4. **Verify**: New staff appears in list
5. **Edit staff**:
   - Click on staff row
   - Update information
   - Save changes
6. **Filter**:
   - Use search bar to find staff by name
   - Use status filter (Active/Inactive)
7. **Delete**:
   - Click delete button
   - Confirm deletion

### Test as Staff

1. **Sign out** and sign in with staff credentials
2. **Navigate to** `/profile`
3. **Verify**: Can only see own profile (read-only)
4. **Try to access** `/staff` → Should redirect (forbidden)

### Test Mobile Responsiveness

1. **Open DevTools**: F12 or Right-click → Inspect
2. **Toggle device toolbar**: Ctrl+Shift+M (Windows) or Cmd+Shift+M (Mac)
3. **Test devices**:
   - iPhone 12 Pro (390x844)
   - iPad Air (820x1180)
   - Galaxy S21 (360x800)
4. **Verify**:
   - Forms are touch-friendly
   - Tables stack on mobile
   - Navigation adapts
   - No horizontal scroll

---

## Project Structure

```
duotify-membership-v1/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes
│   │   ├── sign-in/              # Sign in page
│   │   └── sign-up/              # Sign up page
│   ├── (dashboard)/              # Protected routes
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── staff/                # Staff management
│   │   │   ├── page.tsx          # Staff list
│   │   │   ├── [id]/page.tsx    # Staff detail/edit
│   │   │   └── new/page.tsx     # Add new staff
│   │   └── profile/page.tsx     # Staff profile
│   ├── api/                      # API routes
│   │   └── v1/
│   │       └── staff/
│   │           ├── route.ts      # GET, POST /api/v1/staff
│   │           ├── [id]/route.ts # GET, PUT, DELETE
│   │           └── me/route.ts   # GET own profile
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── staff/                    # Staff-specific components
│   │   ├── staff-table.tsx       # Desktop table view
│   │   ├── staff-card.tsx        # Mobile card view
│   │   ├── staff-form.tsx        # Add/edit form
│   │   └── staff-filters.tsx     # Search/filter UI
│   └── layout/                   # Navigation, headers
├── lib/                          # Utilities
│   ├── db.ts                     # Prisma client
│   ├── auth.ts                   # Auth helpers
│   ├── validations/              # Zod schemas
│   │   └── staff.ts              # Staff validation
│   └── utils.ts                  # Helper functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # DB migrations
│   └── seed.ts                   # Seed data
├── public/                       # Static assets
├── specs/                        # Feature specifications
│   └── 001-staff-management/
│       ├── spec.md               # Feature spec
│       ├── plan.md               # Implementation plan
│       ├── research.md           # Tech decisions
│       ├── data-model.md         # Database design
│       ├── quickstart.md         # This file
│       └── contracts/            # API contracts
├── .env.local                    # Environment variables
├── middleware.ts                 # Auth middleware
├── next.config.js                # Next.js config
├── tailwind.config.ts            # Tailwind config
└── package.json                  # Dependencies
```

---

## Key Commands

### Development
```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Database
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name <migration_name>

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed
```

### Testing
```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Analyze bundle
npm run analyze
```

---

## Common Issues & Solutions

### Issue: Prisma Client Error

**Error**: `PrismaClient is unable to connect to the database`

**Solution**:
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Regenerate Prisma client
npx prisma generate

# Test connection
npx prisma db pull
```

---

### Issue: Clerk Authentication Not Working

**Error**: `Clerk: Missing publishable key`

**Solution**:
```bash
# Verify Clerk keys in .env.local
cat .env.local | grep CLERK

# Ensure keys start with pk_test_ and sk_test_
# Restart dev server after updating .env.local
```

---

### Issue: Build Fails

**Error**: Type errors during build

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Type check
npm run type-check

# Rebuild
npm run build
```

---

### Issue: Mobile Layout Broken

**Error**: Horizontal scroll on mobile

**Solution**:
```bash
# Check Tailwind CSS is properly configured
# Verify no fixed widths without responsive variants
# Use: w-full md:w-1/2 instead of w-[500px]

# Rebuild CSS
npm run dev
```

---

### Issue: Database Migration Failed

**Error**: `Migration failed to apply`

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually fix:
# 1. Drop database: dropdb staff_management
# 2. Recreate: createdb staff_management
# 3. Run migrations: npx prisma migrate deploy
```

---

## API Testing with cURL

### Create Staff
```bash
curl -X POST http://localhost:3000/api/v1/staff \
  -H "Authorization: Bearer <clerk_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "555-000-0001",
    "perEventSalary": 150.00,
    "status": "ACTIVE"
  }'
```

### Get All Staff
```bash
curl -X GET http://localhost:3000/api/v1/staff \
  -H "Authorization: Bearer <clerk_token>"
```

### Update Staff
```bash
curl -X PUT http://localhost:3000/api/v1/staff/<staff_id> \
  -H "Authorization: Bearer <clerk_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "perEventSalary": 200.00
  }'
```

### Delete Staff
```bash
curl -X DELETE http://localhost:3000/api/v1/staff/<staff_id> \
  -H "Authorization: Bearer <clerk_token>"
```

---

## Browser Testing Checklist

### Desktop Testing (Chrome/Firefox/Safari)
- [ ] Sign in/sign out works
- [ ] Manager can view all staff
- [ ] Manager can add new staff
- [ ] Manager can edit staff
- [ ] Manager can delete staff
- [ ] Search filters staff by name
- [ ] Status filter works
- [ ] Form validation shows errors
- [ ] Staff can view own profile only

### Mobile Testing (Real Devices)
- [ ] Forms are easy to fill on phone
- [ ] Numeric keyboard shows for phone/salary fields
- [ ] Tables/lists are readable
- [ ] Buttons are easy to tap (not too small)
- [ ] No horizontal scrolling
- [ ] Navigation works in portrait/landscape
- [ ] Search bar is accessible
- [ ] Modals/sheets fit screen

### Performance Testing
- [ ] Page loads in <2 seconds
- [ ] Search filters in <300ms
- [ ] Form submission completes in <1 second
- [ ] No console errors
- [ ] No memory leaks (check DevTools)

---

## Next Steps

After completing the quickstart:

1. **Read the API Contracts**: `contracts/api-contracts.md`
2. **Review Data Model**: `data-model.md`
3. **Explore Research Decisions**: `research.md`
4. **Write Tests**: Start with E2E tests for critical flows
5. **Customize UI**: Adjust Tailwind theme in `tailwind.config.ts`
6. **Deploy to Production**: See deployment guide below

---

## Deployment Guide (Vercel)

### Prerequisites
- Vercel account (free tier)
- GitHub repository

### Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial staff management module"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub
   - Select `duotify-membership-v1` repository

3. **Configure Environment Variables**:
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
   - Update Clerk redirect URLs in Clerk dashboard

4. **Add Production Database**:
   - Option A: Vercel Postgres (built-in)
   - Option B: Neon/Supabase (external)
   - Update `DATABASE_URL` in Vercel environment variables

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Visit your live URL

6. **Run Production Migrations**:
   ```bash
   # SSH into Vercel (or use Vercel CLI)
   npx prisma migrate deploy
   ```

---

## Additional Resources

### Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Clerk Docs](https://clerk.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)

### Tutorials
- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)
- [Clerk + Next.js Guide](https://clerk.com/docs/quickstarts/nextjs)

### Tools
- [Prisma Studio](https://www.prisma.io/studio) - Visual DB editor
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - Component debugging

---

## Support & Feedback

**Issues**: Create an issue in GitHub repository  
**Questions**: Contact development team  
**Feature Requests**: Add to project backlog

---

## Success Criteria Checklist

Before considering the module complete, verify:

- [x] All dependencies installed
- [x] Database connected and migrated
- [x] Authentication working (Clerk)
- [x] Manager can perform all CRUD operations
- [x] Staff can view own profile only
- [x] Mobile responsive on phone and tablet
- [x] Forms validate input properly
- [x] Search and filter work correctly
- [x] No console errors in browser
- [x] API endpoints return correct responses
- [x] Page load time <2 seconds
- [x] Tests pass (when written)

**Time Investment**:
- Initial setup: 15-20 minutes
- Testing: 30 minutes
- Customization: 1-2 hours
- Deployment: 10 minutes

**Total**: ~2-3 hours from zero to production

---

Happy coding! 🚀
