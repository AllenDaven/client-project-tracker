# Client Project Tracker

A Laravel and React application for digital agencies to track client projects, delivery dates, progress, and priority.

## Setup Instructions

### Prerequisites

- PHP 8.3 or later
- Composer
- Node.js 18 or later with npm

### Install and run

1. Install the backend and frontend dependencies:

   ```bash
   composer install
   npm install
   ```

2. Create the local environment file and application key:

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

   In Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

3. The project uses SQLite. Create the database file if it is not already present, then run the migrations:

   ```bash
   # Windows PowerShell
   New-Item database/database.sqlite -ItemType File -Force

   php artisan migrate
   ```

4. Start Laravel and the Vite development server in separate terminals:

   ```bash
   php artisan serve
   npm run dev
   ```

For a production frontend bundle, run:

```bash
npm run build
```

### Run tests

```bash
php artisan test
```

## Features Implemented

### Project management

- Create, view, edit, and delete client projects.
- Track client name, project name, description, status, priority, start date, and due date.
- Display a concise project dashboard with counts for active, upcoming, and high-priority work.

### REST API

- `GET /api/projects` — list projects.
- `GET /api/projects/{id}` — view a project.
- `POST /api/projects` — create a project.
- `PUT /api/projects/{id}` — update a project.
- `DELETE /api/projects/{id}` — delete a project.
- Optional `search`, `status`, `priority`, and `sort` query parameters for the project list.

### Validation and quality

- Required client and project names.
- Status limited to Planning, In Progress, On Hold, or Completed.
- Priority limited to Low, Medium, or High.
- Due date must be on or after the start date.
- Clear API validation errors shown directly in the React form.
- Responsive React interface with search, filters, sorting, loading states, and success/error feedback.
- Feature tests covering project CRUD, filtering, and validation.

## Assumptions Made

- Authentication and user roles are outside the scope of this assessment; all visitors can manage projects.
- SQLite is appropriate for local assessment use. The application can be moved to another Laravel-supported database by changing the environment configuration.
- A `PUT` request represents a complete project update, so all required project fields must be included.
- Dates are calendar dates without time-zone or time-of-day requirements.
- The tracker intentionally starts empty; projects are added through the interface or API rather than seeded automatically.
- Search matches client and project names. List filtering and sorting are included as optional assessment enhancements, without pagination for this small-project scope.
