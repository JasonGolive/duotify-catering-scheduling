# API Contracts: Staff Management Module

**Feature**: 001-staff-management  
**Date**: 2025-02-14  
**API Version**: v1  
**Base URL**: `/api/v1`

## Overview

This document defines the RESTful API contracts for the Staff Management module. All endpoints follow REST conventions and return JSON responses.

---

## Authentication

All API endpoints require authentication via Clerk session tokens.

**Headers**:
```
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

## Authorization

Access control is role-based:
- **Manager**: Full access to all endpoints
- **Staff**: Limited to own profile (GET /api/v1/staff/me)

**Error Response** (403 Forbidden):
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

---

## Endpoints Summary

| Method | Endpoint | Description | Authorization |
|--------|----------|-------------|---------------|
| GET | `/api/v1/staff` | List all staff | Manager |
| GET | `/api/v1/staff/:id` | Get staff by ID | Manager |
| GET | `/api/v1/staff/me` | Get own profile | Staff |
| POST | `/api/v1/staff` | Create new staff | Manager |
| PUT | `/api/v1/staff/:id` | Update staff | Manager |
| DELETE | `/api/v1/staff/:id` | Delete staff | Manager |

---

## Detailed Endpoint Specifications

### 1. List All Staff

**GET /api/v1/staff**

Retrieve a list of all staff members with optional filtering.

**Query Parameters**:
- `status` (optional): Filter by `ACTIVE` or `INACTIVE`
- `search` (optional): Search term for name filtering (client-side)
- `limit` (optional): Max results (default: 500, max: 500)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "clx1234567890",
      "name": "John Smith",
      "phone": "555-123-4567",
      "perEventSalary": 150.00,
      "notes": "Experienced server",
      "status": "ACTIVE",
      "user": {
        "id": "user_abc123",
        "email": "john@example.com"
      },
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-02-10T14:20:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 500
  }
}
```

---

### 2. Get Staff by ID

**GET /api/v1/staff/:id**

Retrieve detailed information for a specific staff member.

**Response** (200 OK):
```json
{
  "data": {
    "id": "clx1234567890",
    "name": "John Smith",
    "phone": "555-123-4567",
    "perEventSalary": 150.00,
    "notes": "Experienced server",
    "status": "ACTIVE",
    "user": {
      "id": "user_abc123",
      "email": "john@example.com"
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-02-10T14:20:00.000Z"
  }
}
```

---

### 3. Get Own Profile

**GET /api/v1/staff/me**

Staff member retrieves their own profile information.

**Response** (200 OK):
```json
{
  "data": {
    "id": "clx1234567890",
    "name": "John Smith",
    "phone": "555-123-4567",
    "perEventSalary": 150.00,
    "notes": "Experienced server",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-02-10T14:20:00.000Z"
  }
}
```

---

### 4. Create Staff

**POST /api/v1/staff**

Add a new staff member to the system.

**Request Body**:
```json
{
  "name": "Alice Johnson",
  "phone": "555-234-5678",
  "perEventSalary": 175.00,
  "notes": "New hire",
  "status": "ACTIVE"
}
```

**Validation Rules**:
- `name`: Required, 1-100 chars, letters/spaces/hyphens/apostrophes
- `phone`: Required, 10+ chars, digits with optional formatting (unique)
- `perEventSalary`: Required, positive number, max 100,000
- `notes`: Optional, unlimited length
- `status`: Optional, `ACTIVE` or `INACTIVE` (default: `ACTIVE`)

**Response** (201 Created):
```json
{
  "data": {
    "id": "clx2345678901",
    "name": "Alice Johnson",
    "phone": "555-234-5678",
    "perEventSalary": 175.00,
    "notes": "New hire",
    "status": "ACTIVE",
    "user": null,
    "createdAt": "2025-02-14T16:45:00.000Z",
    "updatedAt": "2025-02-14T16:45:00.000Z"
  },
  "message": "Staff member created successfully"
}
```

**Error** (409 Conflict - Duplicate Phone):
```json
{
  "error": "Conflict",
  "message": "A staff member with this phone number already exists"
}
```

---

### 5. Update Staff

**PUT /api/v1/staff/:id**

Update an existing staff member's information (partial updates supported).

**Request Body** (all fields optional):
```json
{
  "name": "John Smith Jr.",
  "perEventSalary": 200.00,
  "notes": "Promoted to senior server"
}
```

**Optimistic Locking** (optional header):
```
If-Match: "2025-02-10T14:20:00.000Z"
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "clx1234567890",
    "name": "John Smith Jr.",
    "phone": "555-123-4567",
    "perEventSalary": 200.00,
    "notes": "Promoted to senior server",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-02-14T17:00:00.000Z"
  },
  "message": "Staff member updated successfully"
}
```

**Error** (412 Precondition Failed):
```json
{
  "error": "Precondition Failed",
  "message": "Record was modified by another user. Please refresh and try again."
}
```

---

### 6. Delete Staff

**DELETE /api/v1/staff/:id**

Permanently delete a staff member from the system.

**Response** (200 OK):
```json
{
  "message": "Staff member deleted successfully",
  "deletedId": "clx1234567890"
}
```

**Error** (409 Conflict - Has Dependencies):
```json
{
  "error": "Conflict",
  "message": "Cannot delete staff member with existing event assignments. Consider marking inactive instead."
}
```

---

## Data Types

### Staff
```typescript
interface Staff {
  id: string;
  name: string;
  phone: string;
  perEventSalary: number;
  notes: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  user: User | null;
  createdAt: string;
  updatedAt: string;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}
```

---

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate phone, concurrent edit |
| 412 | Precondition Failed | Optimistic locking failure |
| 500 | Internal Server Error | Unexpected error |

---

**Complete OpenAPI 3.0 specification available in `openapi.yaml`**
