# DND Party Bot - Docker Configuration

This directory contains all Docker-related configuration files:

## Files

- `Dockerfile.prod` - Production multi-stage build
- `Dockerfile.dev` - Development build with hot reloading
- `docker-compose.prod.yml` - Production services configuration
- `docker-compose.dev.yml` - Development services with volume mounts
- `.dockerignore` - Files to exclude from Docker build context

## Usage

### Development
```bash
# From project root
npm run dev:docker
# or directly
docker compose -f docker/docker-compose.dev.yml up --build
```

### Production
```bash
# From project root  
npm run start
# or directly
docker compose -f docker/docker-compose.prod.yml up --build --detach
```

## Notes

- Development setup includes hot reloading via volume mounts
- Production build uses multi-stage builds for optimization
- Both setups include health checks and proper restart policies
