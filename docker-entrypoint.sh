#!/bin/sh

# Ensure the data directory exists for SQLite
mkdir -p /app/data

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
node server.js
