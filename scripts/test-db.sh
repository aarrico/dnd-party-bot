#!/bin/bash

# Database Connection Test Script
# Tests if the database is accessible from the application

set -e

echo "🔍 Testing database connection..."

# Load environment variables
source .env

# Test local connection (for development)
echo "📍 Testing local database connection..."
if command -v psql &> /dev/null; then
    echo "  Using psql to test connection..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✅ Local database connection successful!"
    else
        echo "  ❌ Local database connection failed!"
        echo "  Check your .env file and make sure the database is running."
        exit 1
    fi
else
    echo "  ⚠️  psql not found, skipping direct connection test"
fi

# Test using Docker
echo "📦 Testing database connection via Docker..."
docker run --rm --network host postgres:16-alpine pg_isready -h localhost -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "  ✅ Docker database connection successful!"
else
    echo "  ❌ Docker database connection failed!"
    echo "  Make sure the database container is running:"
    echo "  docker compose -f docker/docker-compose.dev.yml up db -d"
    exit 1
fi

echo "🎉 All database connection tests passed!"
echo "💡 You can now run: npm run dev:docker"
