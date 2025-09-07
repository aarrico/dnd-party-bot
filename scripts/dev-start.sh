#!/bin/bash

# Development Docker Environment Setup Script
# Builds and starts the development environment with hot reloading

set -e

echo "🚀 Starting DND Party Bot Development Environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Make sure to create one with required environment variables."
    echo "   Required variables: DB_USER, DB_NAME, DB_PASSWORD, DB_PORT, PORT"
fi

# Build and start development containers
echo "🔨 Building development containers..."
docker compose -f docker/docker-compose.dev.yml build

echo "▶️  Starting development environment..."
docker compose -f docker/docker-compose.dev.yml up -d

echo "✅ Development environment started!"
echo "📝 Your app should be running at http://localhost:${PORT:-3000}"
echo "🔄 File changes will trigger automatic reloads"
