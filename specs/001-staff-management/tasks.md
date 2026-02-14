# Tasks: Staff Management Module

**Feature**: 001-staff-management  
**Date**: 2025-02-14  
**Input**: Design documents from `/specs/001-staff-management/`

**Organization**: Tasks are grouped by user story (P1, P2, P3) to enable independent implementation and testing of each story.

**Tests**: Not explicitly requested in the specification, so test tasks are omitted. Focus is on implementation.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **Checkbox**: All tasks start with `- [ ]` (markdown checkbox)
- **[ID]**: Sequential task number (T001, T002, etc.)
- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4, US5) - only for user story phases
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Next.js 14 project with TypeScript at repository root using `npx create-next-app@latest duotify-membership-v1 --typescript --tailwind --app --src-dir false`
- [X] T002 Install core dependencies: `prisma`, `@prisma/client`, `@clerk/nextjs`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`
- [X] T003 [P] Install UI dependencies: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `cmdk`, `fuse.js` for search
- [X] T004 [P] Configure ESLint and Prettier in `.eslintrc.json` and `.prettierrc` with Next.js and TypeScript rules
- [X] T005 [P] Create environment configuration files: `.env.example` with placeholders for DATABASE_URL, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [X] T006 [P] Setup Tailwind CSS configuration in `tailwind.config.ts` with mobile-first breakpoints (sm: 640px, md: 768px, lg: 1024px)
- [X] T007 Create project folder structure: `app/`, `components/ui/`, `components/staff/`, `components/layout/`, `lib/`, `lib/validations/`, `prisma/`
- [X] T008 [P] Initialize Git repository and create `.gitignore` with Node.js, Next.js, and environment file exclusions
- [X] T009 [P] Create README.md with project overview, setup instructions, and development commands

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Setup

- [X] T010 Create Prisma schema in `prisma/schema.prisma` with User model (id, email, role, firstName, lastName, imageUrl, createdAt, updatedAt)
- [X] T011 Add Staff model to `prisma/schema.prisma` (id, name, phone unique, perEventSalary decimal, notes text, status enum, userId unique nullable, createdAt, updatedAt)
- [X] T012 [P] Add Status enum (ACTIVE, INACTIVE) and Role enum (MANAGER, STAFF) to `prisma/schema.prisma`
- [X] T013 [P] Add indexes to Staff model: status index, name index for search optimization
- [ ] T014 Create initial database migration using `npx prisma migrate dev --name init`
- [X] T015 Create Prisma client singleton in `lib/db.ts` with connection pooling configuration
- [X] T016 [P] Create seed script in `prisma/seed.ts` with 5-10 sample staff members for development

### Authentication & Authorization

- [X] T017 Configure Clerk authentication by creating `app/layout.tsx` with ClerkProvider wrapper
- [X] T018 Create authentication middleware in `middleware.ts` to protect dashboard routes and enforce role-based access
- [X] T019 [P] Create auth utility functions in `lib/auth.ts` for getting current user, checking roles, and authorization helpers
- [X] T020 [P] Create authentication pages: `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `app/(auth)/sign-up/[[...sign-up]]/page.tsx`

### Validation & Utilities

- [X] T021 Create staff validation schema in `lib/validations/staff.ts` using Zod (name: 1-100 chars, phone: unique format, salary: positive decimal, notes: optional, status: enum)
- [X] T022 [P] Create utility functions in `lib/utils.ts` for phone normalization, currency formatting, and className merging (cn helper)
- [X] T023 [P] Create API client utilities in `lib/api-client.ts` for standardized fetch calls with error handling

### Base UI Components (shadcn/ui)

- [X] T024 Initialize shadcn/ui configuration with `npx shadcn@latest init` and configure theme in `components.json` (style=new-york, baseColor=neutral, cssVariables=true)
- [X] T025 [P] Install shadcn/ui Button component in `components/ui/button.tsx`
- [X] T026 [P] Install shadcn/ui Form components in `components/ui/form.tsx`, `components/ui/input.tsx`, `components/ui/label.tsx`, `components/ui/textarea.tsx`
- [X] T027 [P] Install shadcn/ui Table components in `components/ui/table.tsx` for desktop staff list view
- [X] T028 [P] Install shadcn/ui Card component in `components/ui/card.tsx` for mobile staff card view
- [X] T029 [P] Install shadcn/ui Dialog component in `components/ui/dialog.tsx` for delete confirmations
- [X] T030 [P] Install shadcn/ui Sheet component in `components/ui/sheet.tsx` for mobile bottom sheets
- [X] T031 [P] Install shadcn/ui Toast component (using Sonner alternative) in `components/ui/sonner.tsx` for notifications
- [X] T032 [P] Install shadcn/ui Select component in `components/ui/select.tsx` for status filters
- [X] T033 [P] Install shadcn/ui Badge component in `components/ui/badge.tsx` for status indicators

### Layout Components

- [X] T034 Create dashboard layout in `app/(dashboard)/layout.tsx` with navigation, header, and responsive sidebar
- [X] T035 [P] Create Header component in `components/layout/header.tsx` with user menu and mobile navigation toggle
- [X] T036 [P] Create Navigation component in `components/layout/nav.tsx` with responsive menu (sidebar on desktop, bottom bar on mobile)
- [X] T037 [P] Setup TanStack Query provider in `app/providers.tsx` with QueryClient configuration and wrap in root layout

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Staff Directory (Priority: P1) 🎯 MVP

**Goal**: Managers can view a complete list of all staff members with name, phone, salary, and status. Staff can view their own profile.

**Independent Test**: Create sample staff records via seed script and verify that:
1. Managers can navigate to /staff and see all staff members in a list
2. Staff information displays correctly (name, phone, salary, status)
3. Active and inactive statuses are visually distinguished
4. Interface is responsive and readable on mobile (375px) and tablet (768px)
5. Staff members can view their own profile at /profile

### API Endpoints for User Story 1

- [X] T038 [P] [US1] Create GET all staff API endpoint in `app/api/v1/staff/route.ts` (list with optional status filter, manager role required)
- [X] T039 [P] [US1] Create GET staff by ID API endpoint in `app/api/v1/staff/[id]/route.ts` (single staff detail, manager role required)
- [X] T040 [P] [US1] Create GET own profile API endpoint in `app/api/v1/staff/me/route.ts` (staff member's own data, staff role allowed)

### UI Components for User Story 1

- [X] T041 [P] [US1] Create StaffCard component in `components/staff/staff-card.tsx` for mobile card view with name, phone, salary, status badge
- [X] T042 [P] [US1] Create StaffTable component in `components/staff/staff-table.tsx` for desktop table view with sortable columns
- [X] T043 [P] [US1] Create StaffListView component in `components/staff/staff-list-view.tsx` that switches between table (desktop) and cards (mobile) based on screen size
- [X] T044 [P] [US1] Create StatusBadge component in `components/staff/status-badge.tsx` with color-coded ACTIVE (green) and INACTIVE (gray) variants

### Pages for User Story 1

- [X] T045 [US1] Create staff list page in `app/(dashboard)/staff/page.tsx` as Server Component fetching staff data and rendering StaffListView
- [X] T046 [US1] Create staff profile page in `app/(dashboard)/profile/page.tsx` for staff members to view their own information (read-only)
- [X] T047 [US1] Add staff list data fetching hook in `app/(dashboard)/staff/page.tsx` using TanStack Query with 60-second cache
- [X] T048 [US1] Implement responsive layout in staff list page with mobile-first styling (single column on mobile, table on desktop)

**Checkpoint**: User Story 1 complete - Managers can view all staff, staff can view own profile, works on all devices

---

## Phase 4: User Story 2 - Add New Staff Member (Priority: P1) 🎯 MVP

**Goal**: Managers can add new staff members to the system with name, phone, salary, notes, and status.

**Independent Test**: Manager can:
1. Click "Add New Staff" button on staff list page
2. Fill out form with required fields (name, phone, salary)
3. Submit form and see new staff member appear in the list
4. Validation errors display for invalid inputs
5. Mobile keyboard types optimize for each field (numeric for phone/salary)

### API Endpoints for User Story 2

- [X] T049 [US2] Create POST staff API endpoint in `app/api/v1/staff/route.ts` with validation, duplicate phone check, and return 201 Created (manager role required)

### UI Components for User Story 2

- [X] T050 [US2] Create StaffForm component in `components/staff/staff-form.tsx` using React Hook Form with Zod validation for add/edit operations
- [X] T051 [US2] Configure form inputs in StaffForm with mobile-optimized keyboard types: type="tel" for phone, type="number" for salary, type="text" for name
- [X] T052 [US2] Add real-time validation display in StaffForm showing error messages below each field when validation fails
- [X] T053 [US2] Add loading and disabled states to form submit button to prevent double-submission

### Pages for User Story 2

- [X] T054 [US2] Create add new staff page in `app/(dashboard)/staff/new/page.tsx` with StaffForm component and success toast on creation
- [X] T055 [US2] Add "Add New Staff" button to staff list page header in `app/(dashboard)/staff/page.tsx` linking to /staff/new
- [X] T056 [US2] Implement staff creation mutation in `app/(dashboard)/staff/new/page.tsx` using TanStack Query with optimistic updates
- [X] T057 [US2] Add navigation after successful staff creation: redirect to staff list with success toast message
- [X] T058 [US2] Handle duplicate phone number error with clear message: "A staff member with this phone number already exists"

**Checkpoint**: User Story 2 complete - Managers can add new staff members with full validation

---

## Phase 5: User Story 3 - Edit Staff Information (Priority: P2)

**Goal**: Managers can update staff member information including name, phone, salary, notes, and status.

**Independent Test**: Manager can:
1. Click on a staff member row in the list
2. See edit form pre-populated with current information
3. Modify one or more fields
4. Save changes and see updates reflected in the list
5. Change status from ACTIVE to INACTIVE
6. Cancel changes without saving (confirmation prompt)

### API Endpoints for User Story 3

- [ ] T059 [US3] Create PUT staff API endpoint in `app/api/v1/staff/[id]/route.ts` with partial update support and optimistic locking (manager role required)

### UI Components for User Story 3

- [ ] T060 [US3] Extend StaffForm component in `components/staff/staff-form.tsx` to support edit mode by accepting initialData prop and changing button text to "Update"
- [ ] T061 [US3] Add unsaved changes warning dialog in `components/staff/unsaved-changes-dialog.tsx` triggered when navigating away with dirty form

### Pages for User Story 3

- [ ] T062 [US3] Create staff detail/edit page in `app/(dashboard)/staff/[id]/page.tsx` loading staff data by ID and rendering StaffForm in edit mode
- [ ] T063 [US3] Make staff list table rows clickable in `components/staff/staff-table.tsx` navigating to `/staff/[id]` on row click
- [ ] T064 [US3] Make staff cards clickable in `components/staff/staff-card.tsx` navigating to `/staff/[id]` on card tap (mobile)
- [ ] T065 [US3] Implement staff update mutation in `app/(dashboard)/staff/[id]/page.tsx` using TanStack Query with optimistic UI updates
- [ ] T066 [US3] Add unsaved changes detection in `app/(dashboard)/staff/[id]/page.tsx` using React Hook Form's `formState.isDirty` to trigger warning dialog
- [ ] T067 [US3] Handle concurrent edit conflict error (412 Precondition Failed) with message: "Record was modified by another user. Please refresh and try again."

**Checkpoint**: User Story 3 complete - Managers can edit all staff information with conflict detection

---

## Phase 6: User Story 4 - Search and Filter Staff (Priority: P2)

**Goal**: Managers can search staff by name and filter by status (ACTIVE/INACTIVE) for efficient staff lookup.

**Independent Test**: Manager can:
1. Type in search box and see real-time filtered results by name
2. Apply "Active Only" filter and see only active staff
3. Combine search and filter to narrow results
4. See clear "no results" message when no matches found
5. Use search and filter controls easily on mobile devices

### UI Components for User Story 4

- [ ] T068 [P] [US4] Create StaffFilters component in `components/staff/staff-filters.tsx` with search input and status select dropdown
- [ ] T069 [P] [US4] Create EmptyState component in `components/staff/empty-state.tsx` showing "No staff members match your search" with clear filters button
- [ ] T070 [US4] Implement Fuse.js fuzzy search in StaffListView component with configuration: keys=['name', 'phone'], threshold=0.3, minMatchCharLength=2
- [ ] T071 [US4] Add debounced search input (300ms delay) to prevent excessive filtering on every keystroke

### Pages for User Story 4

- [ ] T072 [US4] Integrate StaffFilters component into staff list page header in `app/(dashboard)/staff/page.tsx`
- [ ] T073 [US4] Implement client-side filtering logic in `app/(dashboard)/staff/page.tsx` combining search term and status filter using useMemo
- [ ] T074 [US4] Add URL query params for search and filter state in `app/(dashboard)/staff/page.tsx` (e.g., ?search=john&status=active) for shareable URLs
- [ ] T075 [US4] Show EmptyState component when filtered results are empty
- [ ] T076 [US4] Display result count in staff list header: "Showing X of Y staff members"

**Checkpoint**: User Story 4 complete - Managers can efficiently find staff with search and filters

---

## Phase 7: User Story 5 - Delete Staff Member (Priority: P3)

**Goal**: Managers can remove staff members with confirmation to prevent accidental deletion.

**Independent Test**: Manager can:
1. Click delete button next to staff member
2. See confirmation dialog with warning "This action cannot be undone"
3. Confirm deletion and see staff removed from list
4. Cancel deletion and see no changes made
5. See warning about associated records if staff has event history (future consideration)

### API Endpoints for User Story 5

- [ ] T077 [US5] Create DELETE staff API endpoint in `app/api/v1/staff/[id]/route.ts` with hard delete and return 200 OK (manager role required)

### UI Components for User Story 5

- [ ] T078 [P] [US5] Create DeleteStaffDialog component in `components/staff/delete-staff-dialog.tsx` with confirmation message and Cancel/Delete buttons
- [ ] T079 [P] [US5] Add delete button to StaffTable rows in `components/staff/staff-table.tsx` (trash icon button in actions column)
- [ ] T080 [P] [US5] Add delete button to StaffCard component in `components/staff/staff-card.tsx` for mobile view
- [ ] T081 [US5] Style delete button with danger variant (red color) and add hover state for clarity

### Pages for User Story 5

- [ ] T082 [US5] Implement staff deletion mutation in staff list page using TanStack Query with optimistic removal from UI
- [ ] T083 [US5] Integrate DeleteStaffDialog component into staff list page, triggered by delete button clicks
- [ ] T084 [US5] Show success toast "Staff member deleted successfully" after successful deletion
- [ ] T085 [US5] Handle deletion error gracefully with toast message showing error details
- [ ] T086 [US5] Add future consideration: Check for associated event records and show warning dialog suggesting to mark inactive instead

**Checkpoint**: User Story 5 complete - Managers can safely delete staff with confirmation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall system quality

### Error Handling & Loading States

- [ ] T087 [P] Create ErrorBoundary component in `components/error-boundary.tsx` to catch React errors and display fallback UI
- [ ] T088 [P] Create LoadingSkeleton component in `components/staff/loading-skeleton.tsx` for staff list loading state
- [ ] T089 [P] Add loading states to all data fetching operations using TanStack Query's isLoading flag
- [ ] T090 [P] Add error states to all API mutations with user-friendly error messages
- [ ] T091 [P] Implement global error handler in API routes for consistent error responses (400, 401, 403, 404, 409, 500)

### Mobile Optimization

- [ ] T092 [P] Add touch-friendly tap targets: ensure all interactive elements are minimum 48x48px per mobile guidelines
- [ ] T093 [P] Implement pull-to-refresh functionality on staff list page using native browser API or library
- [ ] T094 [P] Add swipe gesture for delete action on staff cards (mobile) using touch event handlers
- [ ] T095 [P] Test responsive layout on real devices: iPhone (375px), iPad (768px), desktop (1024px+)
- [ ] T096 [P] Optimize font loading with next/font to reduce layout shift and improve mobile performance
- [ ] T097 [P] Add viewport meta tag configuration in root layout for proper mobile scaling

### Performance Optimization

- [ ] T098 [P] Implement dynamic imports for Dialog and Sheet components to reduce initial bundle size
- [ ] T099 [P] Add React.memo to StaffCard and StaffTable components to prevent unnecessary re-renders
- [ ] T100 [P] Configure Next.js bundle analyzer and ensure JavaScript bundle is under 200KB target
- [ ] T101 [P] Add database query optimization: verify indexes are used for status and name filters using EXPLAIN ANALYZE
- [ ] T102 [P] Implement connection pooling limits in Prisma client (max 10 connections for free tier databases)

### Security & Validation

- [ ] T103 [P] Add rate limiting middleware in `middleware.ts` to prevent abuse (10 requests per minute per IP)
- [ ] T104 [P] Add CORS configuration in API routes for allowed origins only
- [ ] T105 [P] Add input sanitization in API routes to prevent XSS attacks using DOMPurify or similar
- [ ] T106 [P] Add SQL injection prevention verification (should be automatic with Prisma, but audit queries)
- [ ] T107 [P] Enable HTTPS-only in production environment configuration
- [ ] T108 [P] Add security headers in `next.config.js`: X-Frame-Options, X-Content-Type-Options, CSP

### Documentation & Developer Experience

- [ ] T109 [P] Create comprehensive README.md with setup instructions, environment variables, and development workflow
- [ ] T110 [P] Document API endpoints in `docs/api.md` with examples of request/response for each endpoint
- [ ] T111 [P] Create development quickstart guide in `docs/quickstart.md` following the template in specs/001-staff-management/quickstart.md
- [ ] T112 [P] Add JSDoc comments to all public functions and components for better IDE autocomplete
- [ ] T113 [P] Create CONTRIBUTING.md with code style guidelines, commit message format, and PR process

### Accessibility

- [ ] T114 [P] Add ARIA labels to all interactive elements (buttons, inputs, links)
- [ ] T115 [P] Ensure keyboard navigation works for all user flows (Tab, Enter, Escape)
- [ ] T116 [P] Add focus visible styles to all interactive elements for keyboard users
- [ ] T117 [P] Test with screen reader (NVDA/JAWS) to ensure staff list and forms are accessible
- [ ] T118 [P] Verify color contrast ratios meet WCAG 2.1 AA standards (4.5:1 for text)

### Final Validation

- [ ] T119 Run through all user stories end-to-end manually on desktop browser
- [ ] T120 Run through all user stories end-to-end on mobile device (real device or emulator)
- [ ] T121 Verify all success criteria from spec.md are met (SC-001 through SC-010)
- [ ] T122 Verify all functional requirements from spec.md are implemented (FR-001 through FR-020)
- [ ] T123 Run database seed script and verify sample data loads correctly
- [ ] T124 Check all environment variables are documented in .env.example
- [ ] T125 Verify Clerk authentication works for both Manager and Staff roles
- [ ] T126 Validate quickstart.md by having another developer set up the project from scratch

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - can start immediately
2. **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
3. **User Story 1 (Phase 3)**: Depends on Foundational - **MVP foundation**
4. **User Story 2 (Phase 4)**: Depends on Foundational - Can start in parallel with US1 if staffed
5. **User Story 3 (Phase 5)**: Depends on US1 (needs staff list and detail pages) - Wait for US1 completion
6. **User Story 4 (Phase 6)**: Depends on US1 (needs staff list) - Wait for US1 completion
7. **User Story 5 (Phase 7)**: Depends on US1 (needs staff list) - Wait for US1 completion
8. **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2) ─┐
                        ├─→ US1 (View Staff) ─┬─→ US3 (Edit Staff)
                        │                      ├─→ US4 (Search/Filter)
                        │                      └─→ US5 (Delete Staff)
                        │
                        └─→ US2 (Add Staff) ──────→ (Independent)
```

- **US1 (P1)**: Foundation for viewing - must complete first
- **US2 (P1)**: Can start immediately after Foundational (parallel with US1 if staffed)
- **US3 (P2)**: Requires US1 (needs clickable list/cards)
- **US4 (P2)**: Requires US1 (needs staff list to filter)
- **US5 (P3)**: Requires US1 (needs staff list for delete buttons)

### Critical Path (Sequential MVP)

For single developer or sequential implementation:

1. **Phase 1: Setup** (T001-T009) → ~2-4 hours
2. **Phase 2: Foundational** (T010-T037) → ~2-3 days
3. **Phase 3: User Story 1** (T038-T048) → ~2 days
4. **Phase 4: User Story 2** (T049-T058) → ~1.5 days
5. **Phase 5: User Story 3** (T059-T067) → ~1 day
6. **Phase 6: User Story 4** (T068-T076) → ~1 day
7. **Phase 7: User Story 5** (T077-T086) → ~0.5 days
8. **Phase 8: Polish** (T087-T126) → ~2-3 days

**Total Estimated Time**: 10-14 days for complete implementation

### Parallel Opportunities

Tasks marked **[P]** can run in parallel within their phase:

**Phase 1 (Setup)**:
- T003, T004, T005, T006, T008, T009 can all run simultaneously

**Phase 2 (Foundational)**:
- T012, T013, T016 (database) can run in parallel
- T019, T020 (auth pages) can run in parallel  
- T022, T023 (utilities) can run in parallel
- T025-T033 (all shadcn/ui components) can run in parallel
- T035, T036 (layout components) can run in parallel

**Phase 3 (User Story 1)**:
- T038, T039, T040 (all API endpoints) can run in parallel
- T041, T042, T043, T044 (all UI components) can run in parallel

**Phase 4 (User Story 2)**:
- No parallel tasks (each depends on previous)

**Phase 5 (User Story 3)**:
- T063, T064 (make list items clickable) can run in parallel

**Phase 6 (User Story 4)**:
- T068, T069 (filter components) can run in parallel

**Phase 7 (User Story 5)**:
- T078, T079, T080, T081 (all delete UI components) can run in parallel

**Phase 8 (Polish)**:
- Almost all polish tasks (T087-T118) can run in parallel as they affect different areas

---

## Parallel Example: Foundational Phase

If you have 3 developers, Phase 2 can be parallelized:

**Developer A** (Database & API):
```bash
- T010-T015: Database schema and migrations
- T038-T040: API endpoints for US1
```

**Developer B** (Auth & Security):
```bash
- T017-T020: Clerk authentication setup
- T021-T023: Validation schemas and utilities
```

**Developer C** (UI Foundation):
```bash
- T024-T033: Install all shadcn/ui components
- T034-T036: Layout components
- T037: TanStack Query provider
```

---

## Implementation Strategy

### MVP First (Recommended)

**Goal**: Get User Story 1 + 2 working perfectly (view and add staff)

1. ✅ **Phase 1: Setup** (T001-T009) - ~4 hours
2. ✅ **Phase 2: Foundational** (T010-T037) - ~2-3 days  
   - **CHECKPOINT**: Can now start building user stories
3. ✅ **Phase 3: User Story 1** (T038-T048) - ~2 days
   - **CHECKPOINT**: Can view staff list on all devices
4. ✅ **Phase 4: User Story 2** (T049-T058) - ~1.5 days
   - **CHECKPOINT**: Can add new staff members
5. 🚀 **Deploy MVP** - Test with real users

**MVP Deliverable**: Managers can view and add staff. Staff can view their own profile. Works on mobile and desktop. (~5-7 days)

### Incremental Delivery

After MVP is validated:

6. **Phase 5: User Story 3** (Edit) - ~1 day → Deploy
7. **Phase 6: User Story 4** (Search) - ~1 day → Deploy
8. **Phase 7: User Story 5** (Delete) - ~0.5 days → Deploy
9. **Phase 8: Polish** (Quality) - ~2-3 days → Final Release

Each deployment adds value without breaking existing functionality.

### Parallel Team Strategy (3 developers)

With multiple developers, accelerate after Foundational phase:

1. **Together**: Setup + Foundational (Phases 1-2) - ~3-4 days
2. **Parallel User Stories**:
   - Dev A: User Story 1 (View) - T038-T048
   - Dev B: User Story 2 (Add) - T049-T058  
   - Dev C: Start on Polish tasks that don't require user stories
3. **Sequential Completion**:
   - Once US1 done: Dev A → User Story 3 (Edit)
   - Once US2 done: Dev B → User Story 4 (Search)
   - Dev C: User Story 5 (Delete) + continue polish
4. **Final**: All devs collaborate on Phase 8 polish tasks

**Team Estimated Time**: ~6-8 days for complete implementation

---

## Notes

- **[P] marker**: Tasks that can run in parallel (different files, no dependencies)
- **[Story] label**: Maps task to specific user story for traceability (US1, US2, US3, US4, US5)
- **File paths**: All paths are absolute from repository root following Next.js 14 App Router structure
- **Tests**: Not included as they were not explicitly requested in the specification
- **Validation**: Each user story checkpoint ensures independent functionality before proceeding
- **Mobile-first**: All UI tasks prioritize mobile responsiveness (375px-1024px+)
- **Commit strategy**: Commit after each task or logical group for easy rollback
- **Stop points**: After Phase 4 (MVP with US1+US2) is a natural stop point for validation and deployment

---

## Summary

- **Total Tasks**: 126 tasks across 8 phases
- **User Stories**: 5 stories (2 P1, 2 P2, 1 P3)
- **Estimated Time**: 10-14 days (single developer) or 6-8 days (team of 3)
- **Parallel Tasks**: 45 tasks marked [P] for parallel execution
- **MVP Scope**: Phases 1-4 (US1 + US2) = ~5-7 days = View and Add staff functionality
- **Critical Dependencies**: 
  - All user stories BLOCKED by Foundational phase
  - US3, US4, US5 depend on US1 completion
  - US2 is independent and can run parallel to US1

**Success Criteria Coverage**:
- ✅ SC-001: Add staff in under 1 minute (US2)
- ✅ SC-002: List loads under 2 seconds (US1 + Performance tasks)
- ✅ SC-003: Search under 300ms (US4 + Fuse.js client-side)
- ✅ SC-004: 100% field validation (US2 + Zod schemas)
- ✅ SC-005: Mobile responsive 375px-1024px (All UI tasks)
- ✅ SC-006: Touch-friendly tap targets (Mobile optimization tasks)
- ✅ SC-007: 95% can complete CRUD without training (All user stories + Polish)
- ✅ SC-008: Zero data loss (Database setup + Optimistic locking)
- ✅ SC-009: Staff view own profile accurately (US1)
- ✅ SC-010: 50 concurrent users (PostgreSQL + Prisma pooling)
