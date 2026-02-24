# Data Model: Staff Management Module

**Feature**: 001-staff-management  
**Date**: 2025-02-14  
**Database**: PostgreSQL 15+ with Prisma ORM

## Entity Relationship Diagram

```
┌─────────────────────┐         ┌─────────────────────┐
│       User          │         │       Staff         │
├─────────────────────┤         ├─────────────────────┤
│ id (PK)             │◄────────│ userId (FK, unique) │
│ email               │         │ id (PK)             │
│ role                │         │ name                │
│ createdAt           │         │ phone (unique)      │
│ updatedAt           │         │ perEventSalary      │
└─────────────────────┘         │ notes               │
                                │ status              │
                                │ createdAt           │
                                │ updatedAt           │
                                └─────────────────────┘

Relationship: One-to-One (optional)
- A User (staff role) MAY have one Staff profile
- A User (manager role) does NOT have a Staff profile
- A Staff record MAY have a linked User account (optional for staff not yet onboarded)
```

---

## Entities

### 1. Staff

**Purpose**: Represents a catering service employee with all employment-related information.

**Table Name**: `staff`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | PRIMARY KEY | Unique identifier for staff member |
| `name` | String | NOT NULL, LENGTH(1-100) | Full name of staff member |
| `phone` | String | NOT NULL, UNIQUE | Contact phone number (serves as natural key) |
| `skill` | Enum | NOT NULL, DEFAULT('FRONT') | Job skill: FRONT (外場), HOT (熱台), or DECK (階可) |
| `perEventSalary` | Decimal(10,2) | NOT NULL, CHECK(>0) | Payment amount per catering event |
| `notes` | Text | NULLABLE | Additional notes/comments about the staff member |
| `status` | Enum | NOT NULL, DEFAULT('ACTIVE') | Employment status: ACTIVE or INACTIVE |
| `userId` | String | FOREIGN KEY, UNIQUE, NULLABLE | Link to User account (for staff login) |
| `createdAt` | DateTime | NOT NULL, DEFAULT(now()) | Record creation timestamp |
| `updatedAt` | DateTime | NOT NULL, AUTO-UPDATE | Last modification timestamp |

**Indexes**:
- Primary key on `id` (clustered index)
- Unique index on `phone` (for duplicate detection)
- Unique index on `userId` (one-to-one relationship)
- Index on `status` (for filtering active/inactive staff)
- Index on `name` (for search operations)
- Index on `skill` (for filtering by job skill)

**Validation Rules** (enforced at application layer):
```typescript
name: 
  - Required (length > 0)
  - Maximum 100 characters
  - Pattern: /^[a-zA-Z\s\-']+$/ (letters, spaces, hyphens, apostrophes only)
  - Examples: "John Smith", "Mary-Jane O'Connor"

phone:
  - Required (length >= 10)
  - Pattern: /^[\d\s\-+()]+$/ (digits with optional formatting)
  - Normalized before storage (remove spaces/dashes)
  - Examples: "123-456-7890", "(555) 123-4567", "+1 555 123 4567"

perEventSalary:
  - Required
  - Must be positive (> 0)
  - Maximum: 100,000.00
  - Precision: 2 decimal places
  - Examples: 150.00, 2500.50

notes:
  - Optional (can be null or empty string)
  - No maximum length (use TEXT type)
  - Stored as-is (no sanitization except XSS prevention on display)

status:
  - Enum: 'ACTIVE' | 'INACTIVE'
  - Default: 'ACTIVE'
  - Cannot be null

skill:
  - Enum: 'FRONT' | 'HOT' | 'DECK'
  - Default: 'FRONT'
  - Cannot be null
  - FRONT = 外場 (Front-of-house service)
  - HOT = 熱台 (Hot station cooking)
  - DECK = 階可 (Deck/prep work)
```

**State Transitions**:
```
     NEW
      ↓
   ACTIVE ←→ INACTIVE
      ↓
   DELETED
```

**Business Rules**:
1. Phone numbers must be unique across all staff (duplicate detection)
2. Inactive staff remain in database (no soft delete)
3. Deleted staff are permanently removed (hard delete)
4. Phone number changes must maintain uniqueness constraint
5. Staff without userId cannot log into the system (manual records only)

---

### 2. User

**Purpose**: Authentication and authorization for system access. Managed by Clerk authentication service.

**Table Name**: `users` (Clerk managed, synchronized to local DB via webhooks)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY | Clerk user ID |
| `email` | String | NOT NULL, UNIQUE | User email address |
| `role` | Enum | NOT NULL | User role: MANAGER or STAFF |
| `firstName` | String | NULLABLE | User's first name |
| `lastName` | String | NULLABLE | User's last name |
| `imageUrl` | String | NULLABLE | Profile picture URL |
| `createdAt` | DateTime | NOT NULL | Account creation timestamp |
| `updatedAt` | DateTime | NOT NULL | Last update timestamp |

**Role Definitions**:
```typescript
enum Role {
  MANAGER  // Full CRUD access to all staff records
  STAFF    // Read-only access to own profile
}
```

**Authorization Matrix**:

| Action | Manager | Staff | Guest |
|--------|---------|-------|-------|
| View all staff | ✅ | ❌ | ❌ |
| View own profile | ✅ | ✅ | ❌ |
| Add staff | ✅ | ❌ | ❌ |
| Edit any staff | ✅ | ❌ | ❌ |
| Edit own profile | ✅ | ❌ | ❌ |
| Delete staff | ✅ | ❌ | ❌ |
| Search/filter staff | ✅ | ❌ | ❌ |
| Change status | ✅ | ❌ | ❌ |

**Synchronization Strategy**:
- Clerk webhooks trigger local DB updates
- User creation → Create User record
- User deletion → Soft delete or cascade handling
- Role changes → Update local User record
- Staff linking → Manual association via userId field

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Staff entity (core business object)
model Staff {
  id             String   @id @default(cuid())
  name           String   @db.VarChar(100)
  phone          String   @unique @db.VarChar(20)
  skill          Skill    @default(FRONT)
  perEventSalary Decimal  @db.Decimal(10, 2)
  notes          String?  @db.Text
  status         Status   @default(ACTIVE)
  
  // Relationship to User (optional - staff may exist before login account created)
  userId         String?  @unique
  user           User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([status])
  @@index([name])
  @@index([skill])
  @@map("staff")
}

// User entity (authentication & authorization)
model User {
  id         String   @id // Clerk user ID
  email      String   @unique
  role       Role
  firstName  String?
  lastName   String?
  imageUrl   String?
  
  // Relationship to Staff (optional - managers don't have staff records)
  staff      Staff?
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("users")
}

// Enums
enum Status {
  ACTIVE
  INACTIVE
}

enum Role {
  MANAGER
  STAFF
}

enum Skill {
  FRONT   // 外場
  HOT     // 熱台
  DECK    // 階可
}
```

---

## Database Operations

### 1. Create Operations

**Add New Staff** (Manager only)
```typescript
// Input validation (Zod schema)
const input = {
  name: "John Smith",
  phone: "555-123-4567",
  perEventSalary: 150.00,
  notes: "Experienced server",
  status: "ACTIVE"
};

// Database operation
const staff = await prisma.staff.create({
  data: {
    name: input.name,
    phone: normalizePhone(input.phone), // "5551234567"
    perEventSalary: input.perEventSalary,
    notes: input.notes,
    status: input.status
  }
});

// Conflict handling
try {
  await prisma.staff.create({ ... });
} catch (error) {
  if (error.code === 'P2002') { // Unique constraint violation
    throw new Error('Phone number already exists');
  }
}
```

**Link Staff to User Account**
```typescript
// When staff member gets login credentials
await prisma.staff.update({
  where: { id: staffId },
  data: { userId: clerkUserId }
});
```

---

### 2. Read Operations

**Get All Staff** (Manager only, with filters)
```typescript
// List all active staff
const activeStaff = await prisma.staff.findMany({
  where: { status: 'ACTIVE' },
  orderBy: { name: 'asc' },
  select: {
    id: true,
    name: true,
    phone: true,
    perEventSalary: true,
    status: true,
    user: {
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    }
  }
});

// Search by name (fuzzy search handled client-side)
const searchResults = await prisma.staff.findMany({
  where: {
    name: {
      contains: searchTerm,
      mode: 'insensitive' // Case-insensitive
    }
  }
});
```

**Get Staff by ID**
```typescript
const staff = await prisma.staff.findUnique({
  where: { id: staffId },
  include: {
    user: true // Include linked user account if exists
  }
});
```

**Get Own Profile** (Staff role)
```typescript
// Staff member viewing their own profile
const myProfile = await prisma.staff.findUnique({
  where: { userId: currentUserId },
  select: {
    name: true,
    phone: true,
    perEventSalary: true,
    notes: true,
    status: true
  }
});
```

**Duplicate Detection**
```typescript
// Check if phone number already exists
const existing = await prisma.staff.findUnique({
  where: { phone: normalizePhone(input.phone) }
});

if (existing) {
  throw new Error('Staff member with this phone number already exists');
}
```

---

### 3. Update Operations

**Update Staff Information** (Manager only)
```typescript
const updated = await prisma.staff.update({
  where: { id: staffId },
  data: {
    name: input.name,
    phone: normalizePhone(input.phone),
    perEventSalary: input.perEventSalary,
    notes: input.notes,
    status: input.status
  }
});

// Optimistic locking (prevent concurrent edit conflicts)
const updated = await prisma.staff.updateMany({
  where: {
    id: staffId,
    updatedAt: lastKnownUpdatedAt // Ensures record hasn't been modified
  },
  data: { ... }
});

if (updated.count === 0) {
  throw new Error('Record was modified by another user. Please refresh and try again.');
}
```

**Change Status** (Activate/Deactivate)
```typescript
await prisma.staff.update({
  where: { id: staffId },
  data: { status: 'INACTIVE' }
});
```

---

### 4. Delete Operations

**Delete Staff** (Manager only, hard delete)
```typescript
// Check for dependencies (future: scheduled events, payroll)
const canDelete = await checkStaffDependencies(staffId);

if (!canDelete) {
  throw new Error('Cannot delete staff with existing event assignments. Consider marking inactive instead.');
}

// Permanent deletion
await prisma.staff.delete({
  where: { id: staffId }
});

// If staff has linked user account, decide whether to:
// Option 1: Keep user account (set userId to null via onDelete: SetNull)
// Option 2: Delete user account too (cascade delete)
```

---

## Data Migration Strategy

### Initial Schema Setup
```bash
# Create initial migration
npx prisma migrate dev --name init

# Generated migration SQL:
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "Role" AS ENUM ('MANAGER', 'STAFF');

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "role" "Role" NOT NULL,
  ...
);

CREATE TABLE "staff" (
  "id" TEXT PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "phone" VARCHAR(20) UNIQUE NOT NULL,
  "perEventSalary" DECIMAL(10,2) NOT NULL CHECK ("perEventSalary" > 0),
  ...
);

CREATE INDEX "staff_status_idx" ON "staff"("status");
CREATE INDEX "staff_name_idx" ON "staff"("name");
```

### Seed Data (Development/Testing)
```typescript
// prisma/seed.ts
const seedData = [
  {
    name: "Alice Johnson",
    phone: "5551234567",
    perEventSalary: 150.00,
    status: "ACTIVE"
  },
  {
    name: "Bob Wilson",
    phone: "5559876543",
    perEventSalary: 200.00,
    status: "ACTIVE"
  },
  {
    name: "Carol Davis",
    phone: "5555555555",
    perEventSalary: 175.00,
    status: "INACTIVE"
  }
];

await prisma.staff.createMany({ data: seedData });
```

---

## Performance Considerations

### Query Optimization
1. **Indexes**:
   - `phone` (unique): O(log n) lookup for duplicate detection
   - `status`: Fast filtering for active/inactive staff
   - `name`: Speeds up search operations

2. **Connection Pooling**:
   ```typescript
   // Prisma automatically manages connection pool
   // Configure in DATABASE_URL:
   // postgresql://user:pass@host:5432/db?connection_limit=10
   ```

3. **Query Limits**:
   ```typescript
   // Prevent unbounded queries
   const MAX_RESULTS = 500;
   
   const staff = await prisma.staff.findMany({
     take: MAX_RESULTS,
     skip: page * MAX_RESULTS
   });
   ```

### Caching Strategy
- **Client-side**: TanStack Query caches staff list for 60 seconds
- **Server-side**: No caching needed for MVP (500 staff = ~50KB JSON)
- **Future**: Add Redis cache if staff count exceeds 5000

---

## Data Integrity Constraints

### Application-Level Validation
```typescript
// Before database operations
const validateStaffInput = (input: StaffInput) => {
  // Name validation
  if (!/^[a-zA-Z\s\-']+$/.test(input.name)) {
    throw new ValidationError('Name contains invalid characters');
  }
  
  // Phone validation
  const normalized = normalizePhone(input.phone);
  if (normalized.length < 10) {
    throw new ValidationError('Phone number too short');
  }
  
  // Salary validation
  if (input.perEventSalary <= 0 || input.perEventSalary > 100000) {
    throw new ValidationError('Invalid salary amount');
  }
};
```

### Database-Level Constraints
- `NOT NULL` constraints on required fields
- `UNIQUE` constraints on phone and userId
- `CHECK` constraint on perEventSalary > 0
- `FOREIGN KEY` constraint on userId → users.id

### Concurrent Access Handling
```typescript
// Optimistic locking pattern
const staff = await prisma.staff.findUnique({ where: { id } });
const originalUpdatedAt = staff.updatedAt;

// User makes changes...

const result = await prisma.staff.updateMany({
  where: {
    id: id,
    updatedAt: originalUpdatedAt // Ensure no changes since fetch
  },
  data: updatedData
});

if (result.count === 0) {
  throw new ConflictError('Data was modified. Please reload and try again.');
}
```

---

## Security Considerations

### Data Access Control
1. **Row-Level Security** (via application logic):
   ```typescript
   // Staff can only see their own record
   if (userRole === 'STAFF') {
     const staff = await prisma.staff.findUnique({
       where: { userId: currentUserId }
     });
   }
   
   // Managers can see all records
   if (userRole === 'MANAGER') {
     const allStaff = await prisma.staff.findMany();
   }
   ```

2. **Field-Level Permissions**:
   - Staff can view: name, phone, salary, notes
   - Staff cannot edit: any fields (read-only)
   - Managers can edit: all fields
   - Managers can delete: all records

### Sensitive Data Handling
- **Phone Numbers**: Considered PII, display with masking option
- **Salaries**: Sensitive, only visible to managers and individual staff
- **Notes**: May contain sensitive info, access controlled by role

### Audit Trail (Future Enhancement)
```typescript
// Log all modifications for compliance
model StaffAuditLog {
  id        String   @id @default(cuid())
  staffId   String
  action    String   // CREATE, UPDATE, DELETE
  changes   Json     // { field: { old, new } }
  userId    String   // Who made the change
  timestamp DateTime @default(now())
}
```

---

## Testing Data

### Unit Test Fixtures
```typescript
const mockStaff = {
  id: 'test-id-123',
  name: 'Test User',
  phone: '5551234567',
  perEventSalary: 150.00,
  notes: 'Test notes',
  status: 'ACTIVE',
  userId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};
```

### Integration Test Database
```bash
# Use separate test database
DATABASE_URL="postgresql://localhost:5432/staff_management_test"

# Reset before each test suite
npx prisma migrate reset --force --skip-seed
npx prisma db push
```

---

## Migration Checklist

- [x] Define core entities (Staff, User)
- [x] Design relationships (one-to-one User ↔ Staff)
- [x] Define validation rules
- [x] Create Prisma schema
- [x] Plan indexes for performance
- [x] Document CRUD operations
- [x] Design authorization matrix
- [x] Plan concurrent access handling
- [ ] Create initial migration
- [ ] Generate Prisma client
- [ ] Write seed script
- [ ] Set up test database

**Next Steps**: Generate API contracts (OpenAPI schema) in Phase 1.
