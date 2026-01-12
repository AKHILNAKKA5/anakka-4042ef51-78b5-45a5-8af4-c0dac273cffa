# Secure Task Management System

## Project Overview

This is a secure task management system built as an Nx monorepo. The application enables organizations to manage tasks with granular role-based access control (RBAC) across a hierarchical organization structure. The system implements JWT authentication, organization-scoped permissions, and supports a two-level organization hierarchy (parent and child organizations).

The backend is built with NestJS and TypeORM, while the frontend uses Angular. The monorepo architecture promotes code reusability through shared libraries for authentication and data models.

## Setup Instructions

### Prerequisites

- Node.js (v22.x or higher)
- npm (v10.x or higher)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

### Running the Application

**Backend (NestJS API):**

```bash
npx nx serve api
```

The API will be available at `http://localhost:3000/api`

**Frontend (Angular Dashboard):**

```bash
npx nx serve dashboard
```

The dashboard will be available at `http://localhost:4200`

### Default Test Credentials

- Email: `admin@test.com`
- Password: `password123`
- Role: Owner

## Environment Variables (.env Setup)

Environment variables are used to externalize configuration, making the application more secure and portable across different environments. Sensitive values like JWT secrets should never be hardcoded or committed to version control.

Create a `.env` file in `apps/api/` with the following content:

```env
PORT=3000
JWT_SECRET=super-secret-dev-key
DB_TYPE=sqlite
DB_NAME=database.sqlite
```

**Note:** The `.env` file is gitignored to prevent accidental exposure of secrets. For production deployments, use environment-specific secrets management.

## Architecture Overview

This project uses Nx to manage a monorepo architecture, enabling code sharing and consistent tooling across multiple applications and libraries.

### Monorepo Structure

```
apps/
  api/              # NestJS backend application
  dashboard/        # Angular frontend application

libs/
  auth/            # Shared authentication library (JWT, guards, decorators)
```

### Key Directories

- **apps/api**: NestJS REST API handling authentication, authorization, and business logic. Implements TypeORM for data persistence with SQLite.

- **apps/dashboard**: Angular single-page application providing the user interface for task management with login, task creation, and task viewing.

- **libs/auth**: Reusable authentication library containing JWT strategies, auth guards (JwtAuthGuard, RolesGuard), role decorators, and RBAC utilities. This library is consumed by the API.

### Why Nx?

Nx provides:
- **Code Sharing**: Common authentication and data logic is centralized in libraries
- **Dependency Graph**: Nx understands project dependencies and builds only what's affected
- **Consistent Tooling**: Unified commands for building, testing, and serving applications
- **Scalability**: Easy to add new applications or libraries as the system grows

## Data Model Explanation

The system uses four core entities to model users, organizations, tasks, and permissions.

### Entities

**User**
- Represents a system user with authentication credentials
- Fields: `id`, `email`, `passwordHash`, `role` (Owner/Admin/Viewer), `organization`, `createdAt`, `updatedAt`
- Each user belongs to one organization and has one role

**Organization**
- Represents a hierarchical organization unit (supports 2-level hierarchy)
- Fields: `id`, `name`, `parent`, `children`, `users`, `createdAt`, `updatedAt`
- A parent organization can have multiple child organizations
- A child organization has one parent (nullable)

**Task**
- Represents a work item within an organization
- Fields: `id`, `title`, `description`, `category`, `completed`, `owner`, `organization`, `createdAt`, `updatedAt`
- Each task is owned by a user and scoped to an organization

**Permission** (future use)
- Fields: `id`, `name`, `description`

### Entity Relationships

```
┌─────────────────┐         ┌──────────────────┐
│  Organization   │         │       User       │
│─────────────────│         │──────────────────│
│ id (PK)         │◄────┐   │ id (PK)          │
│ name            │     │   │ email (unique)   │
│ parent (FK)     │─┐   └───│ organization(FK) │
│ children        │◄┘       │ role (enum)      │
│ users           │         │ passwordHash     │
└─────────────────┘         └──────────────────┘
        △                           │
        │                           │
        │                           ▼
        │                   ┌──────────────────┐
        │                   │       Task       │
        │                   │──────────────────│
        └───────────────────│ organization(FK) │
                            │ owner (FK)       │
                            │ title            │
                            │ description      │
                            │ completed        │
                            └──────────────────┘
```

**Key Relationships:**
- User **belongs to** one Organization (ManyToOne)
- Organization **has many** Users (OneToMany)
- Organization **has one** parent Organization (ManyToOne, nullable)
- Organization **has many** child Organizations (OneToMany)
- Task **belongs to** one User (owner, ManyToOne)
- Task **belongs to** one Organization (ManyToOne)

## Access Control Implementation

The system implements role-based access control (RBAC) with organization-level scoping.

### Roles and Hierarchy

Three roles exist with hierarchical permissions:

1. **Owner** - Full access to own organization and all child organizations
2. **Admin** - Full access to own organization only
3. **Viewer** - Read-only access to own tasks within organization

**Role Inheritance:**
- Owner can access all endpoints available to Admin and Viewer
- Admin can access all endpoints available to Viewer
- Viewer has limited, read-only access

### Organization-Scoped Access

Access is restricted by both role and organization:

- **Same Organization**: Users can only access resources within their organization
- **Parent-Child Hierarchy**: Owners can access resources in child organizations
- **Two-Level Limit**: The system enforces a maximum hierarchy depth of 2 levels

### JWT Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Backend validates credentials using bcrypt password comparison
3. JWT token is generated containing `userId`, `email`, and `role`
4. Token is returned to client and stored in localStorage
5. Client includes token in `Authorization: Bearer <token>` header for subsequent requests
6. `JwtAuthGuard` validates token and extracts user information
7. `RolesGuard` checks if user's role satisfies endpoint requirements

### Guard Implementation

**JwtAuthGuard:**
- Passport-based guard using `passport-jwt` strategy
- Validates JWT signature and expiration
- Extracts user payload and attaches to request object as `req.user`
- Returns 401 Unauthorized if token is invalid or missing

**RolesGuard:**
- Custom NestJS guard using Reflector to read `@Roles()` decorator metadata
- Checks if authenticated user's role matches required roles
- Implements role inheritance (Owner > Admin > Viewer)
- Returns 403 Forbidden if user lacks sufficient permissions

### RBAC Enforcement

Endpoints are protected using guard composition:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OWNER)
@Post()
createTask() { ... }
```

Guards execute in order:
1. `JwtAuthGuard` authenticates the user
2. `RolesGuard` authorizes based on role

Service-layer methods additionally enforce organization-scoped access by querying the user's organization and validating ownership before performing operations.

## API Documentation

### Authentication

**Login**

```
POST /api/auth/login
Content-Type: application/json
```

Request:
```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Task Management

All task endpoints require `Authorization: Bearer <token>` header.

**Create Task**

```
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json
Roles: Admin, Owner
```

Request:
```json
{
  "title": "Implement user dashboard",
  "description": "Create the main dashboard view with task summary",
  "category": "Development"
}
```

Response:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Implement user dashboard",
  "description": "Create the main dashboard view with task summary",
  "category": "Development",
  "completed": false,
  "createdAt": "2026-01-12T00:00:00.000Z",
  "updatedAt": "2026-01-12T00:00:00.000Z"
}
```

**List Tasks**

```
GET /api/tasks
Authorization: Bearer <token>
Roles: Viewer
```

Response:
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Implement user dashboard",
    "description": "Create the main dashboard view with task summary",
    "completed": false,
    "owner": {
      "id": "1",
      "email": "admin@test.com"
    },
    "organization": {
      "id": "org-1",
      "name": "Engineering"
    }
  }
]
```

**Update Task**

```
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json
Roles: Viewer (own tasks), Admin (org tasks), Owner (org + children)
```

Request:
```json
{
  "completed": true
}
```

Response: Updated task object

**Delete Task**

```
DELETE /api/tasks/:id
Authorization: Bearer <token>
Roles: Admin, Owner
```

Response:
```json
{
  "message": "Task deleted successfully"
}
```

**View Audit Logs**

```
GET /api/audit-log
Authorization: Bearer <token>
Roles: Admin, Owner
```

Response: Array of audit log entries with userId, action, timestamp, and details.

## Future Considerations

### JWT Refresh Tokens

Implement refresh token mechanism to allow users to obtain new access tokens without re-authenticating. Store refresh tokens securely (HttpOnly cookies or database) with longer expiration times.

### CSRF Protection

Add CSRF tokens for state-changing operations when using cookie-based authentication. Consider implementing double-submit cookie pattern or synchronizer token pattern.

### Advanced Role Delegation

Allow organizations to define custom roles beyond Owner/Admin/Viewer. Implement fine-grained permissions system where roles map to specific actions (e.g., `tasks:create`, `tasks:delete`, `users:invite`).

### Permission Caching

Cache user permissions and role information in Redis or in-memory cache to reduce database queries on every request. Invalidate cache on role/organization changes.

### Scaling RBAC Checks

For large organizations:
- Implement attribute-based access control (ABAC) to handle complex scenarios
- Use policy decision points (PDP) to centralize authorization logic
- Consider external authorization services (e.g., Open Policy Agent)
- Implement lazy-loading for organization hierarchies
- Add database indexes on frequently queried organization relationships
