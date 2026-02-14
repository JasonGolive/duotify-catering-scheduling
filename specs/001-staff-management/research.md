# Research Document: Staff Management Module

**Feature**: 001-staff-management  
**Date**: 2025-02-14  
**Status**: Complete

## Executive Summary

This document captures technology decisions and architectural patterns for the Staff Management module - a mobile-first web application for managing catering service staff with CRUD operations, role-based access control, and responsive design.

## Technology Stack Decisions

### 1. Full Stack Framework

**Decision**: Next.js 14+ with TypeScript and App Router

**Rationale**:
- **Unified Development**: Single framework for frontend and backend reduces complexity
- **Performance**: React Server Components reduce client-side JavaScript, critical for mobile
- **Mobile Optimization**: Built-in image optimization, font optimization, and responsive design patterns
- **Developer Experience**: Hot module reload, TypeScript support, file-based routing
- **Production Ready**: Proven at scale, extensive ecosystem for scheduling applications
- **Deployment**: One-click deployment to Vercel with automatic scaling and edge caching
- **SEO & Accessibility**: Server-side rendering by default, better for web app discoverability

**Alternatives Considered**:
- **Vue 3 + Nuxt**: Excellent DX but smaller ecosystem for catering/scheduling features
- **SvelteKit**: Best performance but smaller talent pool and fewer third-party libraries
- **Separate React SPA + Node.js API**: Added complexity of managing two deployments

**Impact on Architecture**:
- Monorepo structure with backend and frontend in single codebase
- API routes co-located with pages for better maintainability
- Server components for data fetching, client components only where interactivity needed

---

### 2. Database

**Decision**: PostgreSQL 15+ with Prisma ORM

**Rationale**:
- **Relational Model**: Staff management requires structured data with relationships (staff ↔ user accounts)
- **Data Integrity**: ACID compliance ensures no data loss (critical per spec requirement FR-018)
- **Scalability**: Handles 50 concurrent users requirement (SC-010) with room to grow
- **Prisma Benefits**:
  - Type-safe database client auto-generated from schema
  - Effortless migrations with Prisma Migrate
  - Built-in connection pooling for performance
  - Excellent Next.js integration
- **Production Hosting**: Wide support across platforms (Vercel Postgres, Supabase, Railway, Neon)

**Alternatives Considered**:
- **MongoDB**: Schema flexibility unnecessary for well-defined staff entity structure
- **SQLite**: Not suitable for concurrent access requirement (SC-010: 50 concurrent users)
- **MySQL**: PostgreSQL has better JSON support and more advanced features for future expansion

**Schema Highlights**:
```prisma
model Staff {
  id            String   @id @default(cuid())
  name          String
  phone         String   @unique
  perEventSalary Decimal  @db.Decimal(10, 2)
  notes         String?
  status        Status   @default(ACTIVE)
  userId        String?  @unique
  user          User?    @relation(fields: [userId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Status {
  ACTIVE
  INACTIVE
}
```

---

### 3. Authentication & Authorization

**Decision**: Clerk for authentication with role-based access control (RBAC)

**Rationale**:
- **Fast Implementation**: 2-3 lines of code vs weeks of custom auth
- **Production Security**: Built-in security best practices, SOC 2 Type II compliant
- **Mobile-Optimized**: Responsive auth UI works seamlessly on phone/iPad
- **Role Management**: Custom user metadata supports Manager vs Staff roles (per spec)
- **Developer Experience**: 
  - Automatic session management
  - Built-in Next.js middleware support
  - Excellent TypeScript support
  - Webhook support for user lifecycle events
- **Cost Effective**: Free tier covers MVP needs (up to 10k monthly active users)

**Alternatives Considered**:
- **NextAuth.js v5**: More configuration required, self-hosted complexity
- **Auth0**: Slower cold starts, more expensive, overkill for our scale
- **Custom JWT auth**: Security risk, significant development time (2-3 weeks)

**Implementation Pattern**:
```typescript
// Server-side protection (middleware.ts)
export async function middleware(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const userRole = sessionClaims?.role as "manager" | "staff";
  
  // Manager-only routes
  if (pathname.startsWith("/staff") && userRole !== "manager") {
    return NextResponse.redirect("/unauthorized");
  }
}

// API route protection
export async function POST() {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.role !== "manager") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  // ... manager-only logic
}
```

**Role Structure**:
- **Manager**: Full CRUD access to all staff records (FR-001 to FR-004)
- **Staff**: Read-only access to own profile (FR-005)

---

### 4. UI Component Library

**Decision**: shadcn/ui + Tailwind CSS

**Rationale**:
- **Mobile-First**: Components designed for touch interfaces with proper tap targets (44x44px minimum)
- **Accessible**: Built on Radix UI primitives, meets WCAG 2.1 AA standards
- **Customizable**: Copy-paste components into codebase, full control without framework lock-in
- **Performance**: Zero bundle size overhead, only import what you use
- **Modern Stack**: Perfect integration with Next.js 14 and Tailwind CSS 3.4
- **Developer Experience**:
  - CLI installation: `npx shadcn-ui@latest add [component]`
  - Pre-built responsive patterns
  - Dark mode support built-in
  - TypeScript first
- **Production Ready**: Used by Vercel, Cal.com, and many production apps

**Alternatives Considered**:
- **Chakra UI**: Heavier bundle size, less control over styling
- **Material UI**: Not mobile-first, larger bundle, more opinionated
- **Ant Design**: Desktop-focused, difficult to customize for mobile

**Key Components for Staff Management**:
| Component | Purpose | Mobile Optimization |
|-----------|---------|---------------------|
| **Table** | Staff directory listing | Responsive stacking, horizontal scroll with sticky columns |
| **Form** | Add/edit staff | Large inputs (48px height), native mobile keyboards |
| **Dialog/Sheet** | Mobile-friendly modals | Bottom sheet on mobile, modal on desktop |
| **Command** | Search/filter UI | Keyboard navigation + touch-optimized overlay |
| **Toast** | Success/error feedback | Non-blocking, auto-dismiss, touch-dismissible |
| **Select** | Status filter | Native select on mobile, custom dropdown on desktop |

**Responsive Patterns**:
```typescript
// Desktop table → Mobile cards
<div className="hidden md:block">
  <Table>...</Table>
</div>
<div className="md:hidden space-y-4">
  {staff.map(s => <StaffCard {...s} />)}
</div>
```

---

### 5. Data Fetching & State Management

**Decision**: TanStack Query (React Query) v5

**Rationale**:
- **Performance**: Automatic caching reduces server load and improves mobile UX
- **Optimistic Updates**: Instant feedback for user actions (add/edit/delete)
- **Real-time**: Background refetching keeps data fresh without user intervention
- **Mobile Network**: Intelligent retry logic handles spotty mobile connections
- **Server Components Integration**: Works seamlessly with Next.js 14 server components
- **Requirements Coverage**:
  - SC-002: Fast loading times via caching
  - SC-003: Real-time search filtering
  - FR-017: Handles concurrent edits gracefully
  - Edge case: Offline operation handling

**Alternatives Considered**:
- **SWR**: Similar but less feature-complete, no built-in mutations
- **Redux/Zustand**: Overkill for simple CRUD operations
- **Plain fetch**: No caching, retry logic, or optimistic updates

**Implementation Pattern**:
```typescript
// Automatic caching and revalidation
const { data: staff, isLoading } = useQuery({
  queryKey: ['staff'],
  queryFn: fetchStaff,
  staleTime: 60000, // 1 minute cache
  refetchOnWindowFocus: true // Refresh on tab focus
});

// Optimistic updates for instant feedback
const mutation = useMutation({
  mutationFn: updateStaff,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['staff'] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['staff']);
    
    // Optimistically update
    queryClient.setQueryData(['staff'], (old) => ({
      ...old,
      ...newData
    }));
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['staff'], context.previous);
  }
});
```

---

### 6. Form Management

**Decision**: React Hook Form + Zod validation

**Rationale**:
- **Performance**: Minimal re-renders, critical for mobile performance
- **Type Safety**: Zod schemas provide TypeScript types and runtime validation
- **Mobile UX**: Native HTML5 validation with custom error messages
- **Integration**: Perfect shadcn/ui integration via `useForm` hook
- **Requirements Coverage**:
  - FR-006 to FR-008: Field validation (name, phone, salary)
  - FR-014: Optimized keyboard types on mobile
  - FR-015: Clear error messages
  - SC-001: Fast form submission (under 1 minute)

**Alternatives Considered**:
- **Formik**: More boilerplate, heavier bundle
- **Plain controlled inputs**: No validation, more code

**Validation Schema Example**:
```typescript
const staffSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s-']+$/, "Invalid characters in name"),
  
  phone: z.string()
    .regex(/^[\d\s\-+()]+$/, "Invalid phone format")
    .min(10, "Phone number too short"),
  
  perEventSalary: z.number()
    .positive("Salary must be positive")
    .max(100000, "Salary unrealistic"),
  
  notes: z.string().optional(),
  
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

// Usage
const form = useForm<z.infer<typeof staffSchema>>({
  resolver: zodResolver(staffSchema),
  defaultValues: { status: "ACTIVE" }
});
```

**Mobile Keyboard Optimization**:
```tsx
<input
  type="tel"           // Numeric keyboard for phone
  inputMode="numeric"  // iOS fallback
  pattern="[0-9]*"     // Android numeric
/>

<input
  type="number"        // Numeric keyboard for salary
  inputMode="decimal"  // Allow decimals
  step="0.01"          // Precision
/>
```

---

### 7. Search & Filter Implementation

**Decision**: Client-side filtering with Fuse.js for fuzzy search

**Rationale**:
- **Performance**: SC-003 requires <300ms response for 500 staff
- **Mobile UX**: Instant feedback without network latency
- **Fuzzy Matching**: Handles typos and partial matches naturally
- **Offline Capable**: Works without network connection
- **Implementation**: Pre-load all staff data (small dataset), filter client-side

**Alternatives Considered**:
- **Server-side search**: Adds latency (network round-trip), unnecessary for 500 records
- **Database full-text search**: Overkill for simple name search

**Implementation**:
```typescript
const fuse = new Fuse(staff, {
  keys: ['name', 'phone'],
  threshold: 0.3,        // Fuzzy match tolerance
  ignoreLocation: true,  // Match anywhere in string
  minMatchCharLength: 2  // Minimum search term length
});

// Real-time filtering
const filteredStaff = useMemo(() => {
  let results = staff;
  
  if (searchTerm) {
    results = fuse.search(searchTerm).map(r => r.item);
  }
  
  if (statusFilter) {
    results = results.filter(s => s.status === statusFilter);
  }
  
  return results;
}, [staff, searchTerm, statusFilter]);
```

---

## Architecture Patterns

### 1. Project Structure

```
duotify-membership-v1/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (sign-in, sign-up)
│   ├── (dashboard)/              # Protected routes
│   │   ├── layout.tsx            # Dashboard layout with nav
│   │   ├── staff/                # Staff management
│   │   │   ├── page.tsx          # Staff list (Server Component)
│   │   │   ├── [id]/page.tsx    # Staff detail/edit
│   │   │   └── new/page.tsx     # Add new staff
│   │   └── profile/page.tsx     # Staff member's own profile
│   ├── api/                      # API routes
│   │   └── staff/
│   │       ├── route.ts          # GET, POST /api/staff
│   │       └── [id]/route.ts    # GET, PUT, DELETE /api/staff/:id
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── staff/                    # Staff-specific components
│   │   ├── staff-table.tsx
│   │   ├── staff-form.tsx
│   │   └── staff-card.tsx       # Mobile view
│   └── layout/                   # Navigation, headers
├── lib/                          # Utilities
│   ├── db.ts                     # Prisma client
│   ├── validations/              # Zod schemas
│   └── utils.ts                  # Helpers
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # DB migrations
└── middleware.ts                 # Auth + RBAC middleware
```

### 2. Data Flow Pattern

```
User Action (Mobile/Desktop)
    ↓
Client Component (staff-form.tsx)
    ↓
React Hook Form + Zod Validation
    ↓
TanStack Query Mutation
    ↓
Next.js API Route (/api/staff)
    ↓
Auth Check (Clerk middleware)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Response → Cache Update → UI Update (Optimistic)
```

### 3. Responsive Design Strategy

**Mobile First Approach**:
1. **Breakpoints**:
   - `sm`: 640px (large phones)
   - `md`: 768px (tablets/iPad)
   - `lg`: 1024px (desktop)

2. **Layout Patterns**:
   - **Lists**: Single column cards on mobile → Table on desktop
   - **Forms**: Full-width stacked fields → Multi-column on desktop
   - **Navigation**: Bottom tab bar on mobile → Sidebar on desktop
   - **Actions**: Bottom sheet menu on mobile → Dropdown on desktop

3. **Touch Optimization**:
   - Minimum 48x48px tap targets
   - 16px spacing between interactive elements
   - Swipe gestures for delete actions
   - Pull-to-refresh for list updates

---

## Performance Considerations

### 1. Bundle Size Optimization
- **Target**: <200KB initial JavaScript load
- **Strategies**:
  - Server Components for non-interactive content
  - Dynamic imports for modals/sheets: `const Dialog = dynamic(() => import('./dialog'))`
  - Tree-shaking via ES modules
  - Remove unused Tailwind classes with PurgeCSS

### 2. Mobile Performance
- **Target**: 60fps scrolling, <2s initial load (SC-002)
- **Strategies**:
  - Virtual scrolling for large lists (react-window)
  - Lazy load images with Next.js Image component
  - Debounce search input (300ms)
  - Optimize fonts with next/font

### 3. Database Performance
- **Target**: <100ms query response
- **Strategies**:
  - Index on `phone` (unique constraint)
  - Index on `status` for filtering
  - Connection pooling via Prisma
  - Limit query results (pagination)

---

## Security Considerations

### 1. Authentication
- ✅ Server-side session validation on every request
- ✅ HTTPS only in production
- ✅ CSRF protection via SameSite cookies
- ✅ Session timeout (configurable)

### 2. Authorization
- ✅ Role checks on middleware layer
- ✅ API route role validation
- ✅ Database-level user isolation (staff can only see own data)
- ✅ Audit logs for sensitive operations (delete)

### 3. Input Validation
- ✅ Client-side validation (UX)
- ✅ Server-side validation (security)
- ✅ Sanitize inputs to prevent XSS
- ✅ Parameterized queries via Prisma (SQL injection prevention)

### 4. Data Privacy
- ✅ Phone numbers are sensitive PII → encrypt at rest (if required by regulations)
- ✅ GDPR compliance: ability to delete user data (FR-004)
- ✅ Role-based data visibility (managers see all, staff see own)

---

## Testing Strategy

### 1. Unit Tests
- **Tool**: Vitest (faster than Jest)
- **Coverage**: Validation schemas, utility functions
- **Example**: Zod schema tests for phone number validation

### 2. Integration Tests
- **Tool**: Playwright
- **Coverage**: API routes, database operations
- **Example**: POST /api/staff → verify database insert

### 3. E2E Tests
- **Tool**: Playwright
- **Coverage**: Critical user flows
- **Priority Tests** (per spec):
  - Manager can add new staff (US-002)
  - Manager can edit staff info (US-003)
  - Staff can view own profile (US-001)
  - Search returns correct results (US-004)
  - Delete with confirmation (US-005)

### 4. Mobile Testing
- **Tools**: BrowserStack, real devices
- **Coverage**:
  - Touch interactions
  - Keyboard types
  - Orientation changes
  - Network throttling (3G simulation)

---

## Deployment & DevOps

### 1. Hosting
- **Platform**: Vercel (recommended)
  - Zero-config Next.js deployment
  - Automatic HTTPS and CDN
  - Edge caching for static assets
  - Preview deployments for PRs

**Alternative**: Railway, Render, AWS Amplify

### 2. Database Hosting
- **Platform**: Vercel Postgres or Supabase
  - Managed PostgreSQL
  - Automatic backups
  - Connection pooling
  - Free tier sufficient for MVP

### 3. CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
on: [push, pull_request]

jobs:
  test:
    - Run Vitest unit tests
    - Run Playwright E2E tests
    - Type check with TypeScript
    - Lint with ESLint
  
  deploy:
    - Deploy to Vercel preview (PRs)
    - Deploy to production (main branch)
```

### 4. Monitoring
- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics (built-in)
- **Performance**: Vercel Speed Insights
- **Uptime**: BetterStack or Uptime Robot

---

## Migration Path (Future Considerations)

### Phase 2 Features (Out of Current Scope)
1. **Staff Scheduling**: Integrate with calendar library (react-big-calendar)
2. **Payroll**: Calculate earnings based on events attended
3. **Notifications**: Email/SMS for shift reminders (Twilio, SendGrid)
4. **Bulk Operations**: Import/export CSV (Papa Parse)
5. **Advanced Filters**: Multiple criteria, saved filters
6. **Audit Logs**: Track all changes to staff records

### Scalability Considerations
- **Current**: Handles 500 staff, 50 concurrent users
- **Next**: If >5000 staff → implement pagination + server-side search
- **Future**: If >10000 staff → consider read replicas, Redis caching

---

## References & Resources

### Documentation
- [Next.js 14 App Router](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [Clerk Authentication](https://clerk.com/docs/nextjs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TanStack Query Guide](https://tanstack.com/query/latest)

### Code Examples
- [Next.js Staff Management Example](https://github.com/vercel/next.js/tree/canary/examples/with-clerk)
- [shadcn/ui Templates](https://ui.shadcn.com/examples)

### Mobile Best Practices
- [Google Mobile UX Guidelines](https://developers.google.com/web/fundamentals/design-and-ux/principles)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)

---

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-02-14 | Next.js 14 full-stack | Unified development, mobile optimization | Monorepo structure |
| 2025-02-14 | PostgreSQL + Prisma | Data integrity, type safety | Schema-first development |
| 2025-02-14 | Clerk authentication | Fast implementation, production security | Reduced auth complexity |
| 2025-02-14 | shadcn/ui components | Mobile-first, customizable | Copy-paste components |
| 2025-02-14 | TanStack Query | Caching, optimistic updates | Real-time UX |
| 2025-02-14 | Client-side search | Performance for 500 staff | Instant filtering |

---

**Next Steps**: Proceed to Phase 1 - Design & Contracts
- Create data-model.md
- Generate API contracts (OpenAPI schema)
- Write quickstart.md for developer onboarding
