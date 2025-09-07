# Scripts Directory

This directory contains utility scripts for managing the DND Party Bot development and production environments.

## 🧹 Fresh Start Scripts

### `fresh-dev.sh`
Completely wipes all Docker data and starts a fresh development environment.
- Stops all containers
- Removes volumes (postgres-data, node_modules_dev)
- Cleans up orphaned containers and networks
- Optionally removes images for fresh builds
- Starts development environment with hot reloading

**Usage:**
```bash
./scripts/fresh-dev.sh
# or
npm run dev:fresh
```

### `fresh-prod.sh`
Completely wipes all Docker data and starts a fresh production environment.
- Stops all containers
- Removes volumes (postgres-data)
- Cleans up orphaned containers and networks
- Optionally removes images for fresh builds
- Starts production environment in detached mode

**Usage:**
```bash
./scripts/fresh-prod.sh
# or
npm run start:fresh
```

### `nuclear-clean.sh`
⚠️ **EXTREME CAUTION** ⚠️ - Removes ALL Docker data on your system!
- Stops and removes ALL containers
- Removes ALL volumes
- Removes ALL networks
- Removes ALL images
- Clears ALL build cache

**Usage:**
```bash
./scripts/nuclear-clean.sh
# or
npm run docker:reset
```

## 🚀 Standard Scripts

### `dev-start.sh`
Starts development environment (without wiping data).

**Usage:**
```bash
./scripts/dev-start.sh
# or
npm run dev:start
```

### `prod-start.sh`
Starts production environment (without wiping data).

**Usage:**
```bash
./scripts/prod-start.sh
# or
npm run start:prod
```

## 📋 Quick Commands via NPM

| Command | Description |
|---------|-------------|
| `npm run dev:fresh` | Fresh development start (wipes data) |
| `npm run start:fresh` | Fresh production start (wipes data) |
| `npm run stop:clean` | Stop production with volume cleanup |
| `npm run stop:dev:clean` | Stop development with volume cleanup |
| `npm run docker:reset` | Nuclear option - wipe everything! |

## 🔧 Manual Docker Commands

If you prefer manual control:

### Fresh Development Start
```bash
# Stop and clean
docker compose -f docker/docker-compose.dev.yml down --volumes --remove-orphans

# Remove volumes
docker volume rm postgres-data node_modules_dev

# Fresh build and start
docker compose -f docker/docker-compose.dev.yml up --build
```

### Fresh Production Start
```bash
# Stop and clean
docker compose -f docker/docker-compose.prod.yml down --volumes --remove-orphans

# Remove volumes
docker volume rm postgres-data

# Fresh build and start
docker compose -f docker/docker-compose.prod.yml up --build -d
```

### Complete System Clean
```bash
# Stop everything
docker stop $(docker ps -q)

# Remove everything
docker system prune -a -f --volumes

# Remove all images
docker rmi $(docker images -q) -f
```
