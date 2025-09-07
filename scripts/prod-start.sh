#!/bin/bash

# Production Docker Environment Setup Script
# Builds and starts the production environment

set -e

echo "🚀 Starting DND Party Bot Production Environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Required for production deployment."
    echo "   Required variables: DB_USER, DB_NAME, DB_PASSWORD, DB_PORT, PORT"
    exit 1
fi

# Build and start production containers
echo "🔨 Building production containers..."
docker compose -f docker/docker-compose.prod.yml build

echo "▶️  Starting production environment..."
docker compose -f docker/docker-compose.prod.yml up -d

echo "✅ Production environment started!"
echo "📝 Your app should be running at http://localhost:${PORT:-3000}"
echo "📊 Check logs with: docker compose -f docker/docker-compose.prod.yml logs -f"
