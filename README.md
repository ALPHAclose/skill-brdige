# SkillBridge

SkillBridge is a full-stack learning platform demo built with a small microservice architecture. It includes authentication, role-based access, course management, enrollment, analytics, reports, real-time notifications, and online presence.

## Main Features

- Next.js frontend with login, registration, dashboard, courses, and reports pages.
- API Gateway that protects private routes, verifies JWT access tokens, applies rate limiting, and forwards requests to internal services.
- Server1 auth service for users, JWT login, refresh-token rotation, notifications, Swagger docs, and Socket.IO events.
- Server2 course service with FastAPI, Strawberry GraphQL, courses, enrollments, analytics, and reports.
- PostgreSQL databases separated by domain: one for auth/users/notifications and one for courses/analytics/reports.
- Redis for token storage, pub/sub events, real-time notifications, and online-user presence.
- Docker Compose setup so the whole project can run with one stack.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, TanStack Query, Zustand, Socket.IO Client
- Gateway: Node.js, Express, TypeScript, http-proxy-middleware, JWT, Helmet, CORS, rate limiting
- Server1: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Socket.IO, Swagger
- Server2: Python, FastAPI, Strawberry GraphQL, SQLAlchemy, PostgreSQL, Redis
- Infrastructure: Docker Compose, PostgreSQL, Redis

## Project Structure

```text
SkillBridge/
  frontend/        Next.js user interface
  gateway/         Express API gateway and WebSocket proxy
  server1/         Auth, users, notifications, Socket.IO
  server2/         Courses, enrollments, analytics, reports GraphQL API
  scripts/         PostgreSQL initialization scripts
  docker-compose.yml
  .env.example
```

## Download and Run with Docker

### Requirements

- Git
- Docker Desktop or Docker Engine with Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/ALPHAclose/skill-brdige.git
cd skill-brdige
```

### 2. Create the environment file

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

The example values are enough for local development. For production, change passwords, JWT secrets, and trusted gateway secrets.

### 3. Start all services

```bash
docker compose --profile app up -d --build
```

### 4. Apply the Prisma migration for Server1

Server2 creates its tables automatically on startup. Server1 uses Prisma migrations, so run:

```bash
docker compose --profile app exec server1 npx prisma migrate deploy
```

### 5. Open the app

- Frontend: http://localhost:3000
- Gateway health check: http://localhost:4000/health
- Server1 Swagger docs are available inside the Docker network at `/docs` on Server1.
- GraphQL requests go through the gateway at http://localhost:4000/graphql

Register a user from the frontend. You can choose either `Student` or `Instructor` on the registration page. Instructors can create and publish courses. Students can enroll in published courses.

### Useful Docker Commands

```bash
docker compose --profile app ps
docker compose --profile app logs -f
docker compose --profile app down
docker compose --profile app down -v
```

Use `down -v` only when you also want to remove local database and Redis data.

## Local Ports

| Service | URL/Port | Purpose |
| --- | --- | --- |
| Frontend | http://localhost:3000 | Browser app |
| Gateway | http://localhost:4000 | Public API and Socket.IO entry point |
| Server1 | 5001 inside Docker network | Auth, users, notifications |
| Server2 | 5002 inside Docker network | Courses GraphQL API |
| Redis | localhost:6379 | Cache, tokens, pub/sub |
| Auth PostgreSQL | localhost:5432 | Users and notifications |
| Courses PostgreSQL | localhost:5433 | Courses, enrollments, analytics, reports |

## How the Logic Works

### Request Flow

```text
Browser
  |
  | REST, GraphQL, Socket.IO
  v
Gateway :4000
  |
  | /auth, /users, /notifications
  v
Server1 :5001 ---- PostgreSQL auth DB
  |
  | Socket.IO and Redis pub/sub
  v
Redis

Gateway :4000
  |
  | /graphql
  v
Server2 :5002 ---- PostgreSQL courses DB
```

The frontend never calls Server1 or Server2 directly. It calls the gateway at `NEXT_PUBLIC_API_URL`. The gateway decides whether the request is public or private. Public auth routes like `/auth/login`, `/auth/register`, and `/auth/refresh` are allowed without an access token. Private routes require a Bearer JWT.

### Authentication

1. A user registers or logs in from the frontend.
2. Server1 hashes passwords with bcrypt and stores users in the auth PostgreSQL database.
3. Server1 returns an access token and refresh token.
4. The frontend stores the session in Zustand local storage.
5. For private requests, the frontend sends `Authorization: Bearer <accessToken>`.
6. The gateway verifies the token and attaches trusted internal identity headers.
7. Internal services trust those identity headers only when the gateway secret header is present.
8. When an access token expires, the frontend calls `/auth/refresh` and Server1 rotates the refresh token.

### Gateway Logic

The gateway is the public backend entry point. It:

- Adds request IDs and logs requests.
- Applies Helmet, CORS, and rate limiting.
- Removes client-sent identity headers so users cannot spoof another user.
- Verifies JWT access tokens on protected routes.
- Proxies `/auth`, `/users`, and `/notifications` to Server1.
- Proxies `/graphql` to Server2.
- Proxies `/socket.io` WebSocket traffic to Server1.

### Server1 Logic

Server1 owns user-related features:

- Auth routes: register, login, refresh, logout, and current-user lookup.
- User routes: paginated user listing with role/search filters.
- Notification routes: list, mark as read, and delete notifications.
- Socket.IO: authenticated real-time connections, online count, notification events, and course enrollment events.
- Prisma models: `User` and `Notification`.

Server1 also listens to Redis pub/sub messages. For example, when Server2 publishes a `notification:send` message, Server1 saves that notification in PostgreSQL and pushes it to the correct connected user over Socket.IO.

### Server2 Logic

Server2 owns course-related features through GraphQL:

- Queries: all visible courses, a single course, my courses, course analytics, reports, and one report.
- Mutations: create, update, delete, publish course, enroll in course, track analytics event, generate report, and delete report.
- SQLAlchemy models: `Course`, `Enrollment`, `Analytics`, and `Report`.

Role rules are handled in the GraphQL resolvers:

- Admins can see and manage all courses and reports.
- Instructors can create courses, publish their own courses, and generate reports for their own courses.
- Students can see published courses and enroll in them.

### Real-Time Notifications

When a student enrolls in a course:

1. The frontend sends an `enrollCourse` GraphQL mutation through the gateway.
2. Server2 creates the enrollment in the courses database.
3. Server2 publishes a `course:enrolled` event to Redis.
4. Server2 also publishes a `notification:send` event for the course instructor.
5. Server1 receives the Redis message, saves the notification, and emits it to the instructor with Socket.IO.
6. Connected frontend clients update the dashboard and notification state in real time.

### Reports and Analytics

The frontend can track course events such as `course_viewed`. Server2 stores those events in the `analytics` table. Instructors and admins can generate reports. A report stores a JSON snapshot containing the course title, enrollment count, total analytics events, and generation metadata.

## Manual Development without Docker

Docker is the easiest way to run the whole system because it provides PostgreSQL and Redis. If you run services manually, install Node.js 20+, Python 3.11+, PostgreSQL, and Redis, then configure matching environment variables from `.env.example`.

Typical service commands:

```bash
cd gateway
npm install
npm run dev
```

```bash
cd server1
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

```bash
cd server2
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5002
```

```bash
cd frontend
npm install
npm run dev
```

## Notes for Review

- Commit `.env.example`, but never commit the real `.env`.
- `node_modules`, build output, Python caches, and local environment files are intentionally ignored.
- The Docker Compose setup uses the `app` profile for application services, so include `--profile app` when starting the stack.
