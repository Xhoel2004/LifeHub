# LifeHub

A personal life-management app — tasks (and later habits, journal, budget) — built as a portfolio project.

## Stack

- **Frontend**: Angular 21 (standalone components)
- **Backend**: Spring Boot 3.5.x (Java 17)
- **Database**: MySQL 8.x, run via Docker Compose
- **Migrations**: Flyway
- **Auth**: JWT (stateless)

## Architecture

Monolith: one Angular SPA talking to one Spring Boot REST API backed by one MySQL database. No microservices. See the full architecture plan for details on layering, entities, endpoints, and auth design.

## Repository layout

```
LifeHub/
├── frontend/          # Angular app
├── backend/           # Spring Boot app
├── docker-compose.yml # MySQL (Docker-only, named volume)
├── .env.example       # copy to .env and fill in DB credentials
└── README.md
```

## Running locally

1. Copy `.env.example` to `.env` and adjust credentials if desired.
2. Start MySQL: `docker compose up -d`
3. Set the `JWT_SECRET` environment variable (see [Authentication](#authentication) below), then start the backend: `cd backend && mvn spring-boot:run` (profile `dev`) — Flyway migrates the schema on startup.
4. Start the frontend: `cd frontend && npm start` — served at `http://localhost:4200`, talking to the backend at `http://localhost:8080/api`.

MySQL runs in Docker only; the frontend and backend run directly on the host during development.

## Authentication

Auth is stateless JWT (HS256), issued on `/api/auth/register` and `/api/auth/login`, verified per-request from the `Authorization: Bearer <token>` header — no server-side sessions. Access tokens expire after 30 minutes.

**`JWT_SECRET` is required** and must be set as an environment variable before starting the backend — there is no default/fallback value in `application.yml`, by design. It must be at least 32 characters (256 bits) for HS256 signing. The app fails fast at startup with a clear error if it's missing or too short. Example (bash):

```bash
export JWT_SECRET=$(openssl rand -base64 48)
```

(PowerShell: `$env:JWT_SECRET = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))`)

**Token storage (Angular side) — deliberate trade-off**: the access token is kept in the browser's `localStorage`, not an `HttpOnly` cookie. This means a successful XSS attack against the frontend could read and exfiltrate the token, which a cookie-based approach would prevent. That hardened alternative requires CSRF protection to compensate (since cookies are sent automatically by the browser), which is real added complexity. For a portfolio-scale project this is an intentional, documented simplification rather than an oversight — short (30-minute) token expiry bounds the exposure window, and this is a known, natural next hardening step rather than a hidden gap.

## Database access

Connect DBeaver to `localhost:3306`, database `lifehub`, using the credentials from `.env`.

## Status

Backend: project skeleton, `User`/`Task` entities, JWT-based register/login/`/api/users/me`, and full ownership-scoped Task CRUD (`/api/tasks`) are implemented. Frontend: Angular skeleton with routing, JWT auth (`AuthService`, `authGuard`, `authInterceptor`, `httpErrorInterceptor` + toast), and working register/login/dashboard pages wired to the real backend. The tasks UI and further domains (habits, journal, budget) are not yet built. See the architecture plan for the full build order.
