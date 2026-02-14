# Implementation Plan: Staff Management Module

**Branch**: `001-staff-management` | **Date**: 2025-02-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-staff-management/spec.md`

## Summary

The Staff Management Module is a mobile-first web application for managing catering service staff. It provides full CRUD operations (Create, Read, Update, Delete) for staff records, role-based access control (Manager vs Staff), and responsive design optimized for phones, tablets, and desktop. The system enables managers to efficiently manage staff information including names, contact details, per-event salaries, and employment status, while staff members can view their own profile information.

**Technical Approach**: Next.js 14 full-stack framework with App Router, PostgreSQL database with Prisma ORM, Clerk authentication for role-based access control, shadcn/ui components for mobile-responsive interface, and TanStack Query for optimized data fetching with real-time updates.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14.x (React 18)  
**Primary Dependencies**: Next.js (full-stack framework), Prisma (ORM), Clerk (authentication), shadcn/ui (UI components), TanStack Query (data fetching), React Hook Form (forms), Zod (validation), Tailwind CSS (styling)  
**Storage**: PostgreSQL 15+ with Prisma ORM  
**Testing**: Vitest (unit tests), Playwright (E2E tests), Testing Library (component tests)  
**Target Platform**: Web browsers (Chrome, Firefox, Safari) on desktop, tablet, and mobile devices  
**Project Type**: Web application (full-stack with Next.js App Router)  
**Performance Goals**: <2s page load time, <300ms search response, 60fps scrolling on mobile devices  
**Constraints**: <200KB initial JavaScript bundle, mobile-first responsive design (375px-1024px+ widths), touch-friendly UI (48x48px minimum tap targets), offline graceful degradation  
**Scale/Scope**: 500 staff members, 50 concurrent users, 2-3 user roles (Manager, Staff), 5 core CRUD operations, single-page application architecture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: The project constitution template is not yet populated with specific organizational principles. This section will be updated when `.specify/memory/constitution.md` contains the project's architectural standards and development practices.

**General Compliance Checks**:
- ✅ **Simplicity**: Single Next.js application instead of separate frontend/backend reduces complexity
- ✅ **Standard Patterns**: Using established patterns (REST API, CRUD operations, RBAC)
- ✅ **Technology Choices**: Modern, well-supported stack with active communities
- ✅ **Testing Strategy**: Three-layer testing approach (unit, integration, E2E)
- ✅ **Documentation**: Comprehensive spec, research, data model, API contracts, and quickstart
- ✅ **Mobile-First**: Responsive design requirement addressed from ground up

**Potential Areas for Review** (when constitution is established):
- Full-stack framework choice (Next.js) vs microservices architecture
- Client-side filtering (Fuse.js) vs server-side search with database
- Third-party authentication (Clerk) vs custom auth implementation
- Monorepo structure vs polyrepo for future services

## Project Structure

### Documentation (this feature)

```text
specs/001-staff-management/
├── spec.md              # Feature specification with user stories
├── plan.md              # This file (implementation plan)
├── research.md          # Technology decisions and architecture patterns
├── data-model.md        # Database schema and entity definitions
├── quickstart.md        # Developer onboarding guide
└── contracts/           # API contracts
    ├── api-contracts.md # REST API documentation
    └── openapi.yaml     # OpenAPI 3.0 specification
```

### Source Code (repository root)

```text
duotify-membership-v1/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/              # Protected application routes
│   │   ├── layout.tsx            # Dashboard layout with navigation
│   │   ├── staff/                # Staff management module
│   │   │   ├── page.tsx          # Staff list view (Server Component)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Staff detail/edit page
│   │   │   └── new/
│   │   │       └── page.tsx      # Add new staff page
│   │   └── profile/
│   │       └── page.tsx          # Staff member's own profile
│   ├── api/                      # API routes
│   │   └── v1/
│   │       └── staff/
│   │           ├── route.ts      # GET (list), POST (create)
│   │           ├── [id]/
│   │           │   └── route.ts  # GET, PUT, DELETE by ID
│   │           └── me/
│   │               └── route.ts  # GET own profile
│   ├── layout.tsx                # Root layout (Clerk provider)
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   └── ...
│   ├── staff/                    # Staff-specific components
│   │   ├── staff-table.tsx       # Desktop table view
│   │   ├── staff-card.tsx        # Mobile card view
│   │   ├── staff-form.tsx        # Add/edit form
│   │   ├── staff-filters.tsx     # Search and filter UI
│   │   └── staff-delete-dialog.tsx
│   └── layout/                   # Layout components
│       ├── header.tsx
│       ├── nav.tsx
│       └── footer.tsx
├── lib/                          # Shared utilities
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Auth helper functions
│   ├── validations/              # Zod schemas
│   │   └── staff.ts              # Staff validation schemas
│   ├── api-client.ts             # API client utilities
│   └── utils.ts                  # General utilities
├── prisma/                       # Database
│   ├── schema.prisma             # Prisma schema
│   ├── migrations/               # Migration history
│   │   └── [timestamp]_init/
│   │       └── migration.sql
│   └── seed.ts                   # Seed data script
├── public/                       # Static assets
│   └── images/
├── tests/                        # Test files
│   ├── unit/                     # Unit tests (Vitest)
│   │   ├── validations.test.ts
│   │   └── utils.test.ts
│   ├── integration/              # API integration tests
│   │   └── api/
│   │       └── staff.test.ts
│   └── e2e/                      # End-to-end tests (Playwright)
│       ├── auth.spec.ts
│       ├── staff-crud.spec.ts
│       └── mobile.spec.ts
├── .env.local                    # Local environment variables
├── .env.example                  # Environment template
├── middleware.ts                 # Auth middleware (Clerk)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

**Structure Decision**: We've chosen **Option 2: Web application** structure using Next.js 14 App Router. This provides a unified full-stack architecture where:

1. **Backend and Frontend Colocated**: App Router combines server and client components in a single directory structure, eliminating the need for separate backend/frontend folders
2. **API Routes**: RESTful API endpoints live in `app/api/` alongside page routes
3. **Server Components**: Default to server-side rendering for performance, with selective client components for interactivity
4. **Route Groups**: `(auth)` and `(dashboard)` organize routes without affecting URL structure
5. **File-Based Routing**: Next.js convention eliminates routing configuration

This structure is optimal for our use case because:
- Small-to-medium application scope (single module)
- Tight coupling between UI and API beneficial for rapid development
- Simplified deployment (single application)
- Shared TypeScript types between client and server
- Built-in optimizations for mobile performance

## Complexity Tracking

> **No violations identified** - This implementation follows standard web application patterns and maintains simplicity through:
> 
> 1. **Single Application**: Next.js full-stack approach vs separate frontend/backend services
> 2. **Established Patterns**: REST API, CRUD operations, role-based access control
> 3. **Minimal Dependencies**: Core stack of 7 primary dependencies, all industry-standard
> 4. **Progressive Enhancement**: Start with core functionality, future features isolated
> 5. **Standard Database Design**: Normalized schema with clear relationships
> 
> If constitution principles are established later that conflict with these choices, revisit this section.
