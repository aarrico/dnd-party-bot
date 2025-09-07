#!/bin/bash

# Fresh Production Environment Script
# Completely wipes all Docker data and starts fresh production environment

set -e

echo "🧹 Starting FRESH production environment (wiping all data)..."

# Stop and remove all containers, volumes, and networks
echo "🛑 Stopping all containers..."
docker compose -f docker/docker-compose.prod.yml down --volumes --remove-orphans

# Remove specific project volumes
echo "🗑️  Removing project volumes..."
docker volume rm postgres-data 2>/dev/null || echo "Volume may not exist"

# Remove any orphaned containers
echo "🧽 Cleaning up orphaned containers..."
docker container prune -f

# Remove unused volumes
echo "🗂️  Cleaning up unused volumes..."
docker volume prune -f

# Remove unused networks
echo "🌐 Cleaning up unused networks..."
docker network prune -f

# Optional: Remove all images to force fresh builds
read -p "🤔 Do you want to remove Docker images for fresh builds? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🖼️  Removing Docker images..."
    docker image prune -a -f
    # Remove specific images
    docker rmi $(docker images "dnd-party-bot*" -q) 2>/dev/null || echo "No project images to remove"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Required for production deployment."
    echo "   Required variables: DB_USER, DB_NAME, DB_PASSWORD, DB_PORT, PORT"
    exit 1
fi

# Build and start fresh containers
echo "🔨 Building fresh production containers..."
docker compose -f docker/docker-compose.prod.yml build --no-cache

echo "▶️  Starting fresh production environment..."
docker compose -f docker/docker-compose.prod.yml up -d

echo "✅ Fresh production environment started!"
echo "📝 Your app should be running at http://localhost:${PORT:-3000}"
echo "📊 Check logs with: docker compose -f docker/docker-compose.prod.yml logs -f"
