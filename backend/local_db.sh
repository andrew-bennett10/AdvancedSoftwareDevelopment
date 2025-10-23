#!/bin/bash

# This file starts a local PostgreSQL database using Docker
# and automatically creates & seeds the database.

# Stop and remove any existing container
docker stop local-postgres >/dev/null 2>&1 || true
docker rm local-postgres >/dev/null 2>&1 || true

# Start a new PostgreSQL container
echo " Starting local Postgres container..."
docker run --name local-postgres \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  -d postgres:13

# Wait a few seconds for Postgres to start
echo " Waiting for Postgres to initialize..."
sleep 5

# Apply migrations (create tables)
echo " Applying schema..."
docker exec -i local-postgres psql -U testuser -d testdb -v ON_ERROR_STOP=1 \
  < DB/migrations/001_create_cards.sql

# Seed data (insert cards)
echo " Seeding data..."
docker exec -i local-postgres psql -U testuser -d testdb -v ON_ERROR_STOP=1 \
  < DB/seeds/seed_cards.sql

echo " Database is ready!"
echo "Container: local-postgres  |  Port: 5432"
echo "User: testuser  |  Password: testpassword  |  DB: testdb"
