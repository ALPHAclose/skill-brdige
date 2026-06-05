-- Courses database initialization for Server2.
-- SQLAlchemy/Alembic migrations will create application tables later.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

SET timezone = 'UTC';
