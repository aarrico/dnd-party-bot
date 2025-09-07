# 🎲 DND Party Bot

A Discord bot for managing D&D sessions and party members.

## 📁 Project Structure

```
├── 📁 config/          # Configuration files
│   ├── eslint.config.js    # ESLint configuration
│   ├── .prettierrc        # Prettier formatting rules
│   └── tsconfig.json      # TypeScript compiler settings
├── 📁 docker/          # Docker configuration
│   ├── Dockerfile.dev      # Development container
│   ├── Dockerfile.prod     # Production container
│   ├── docker-compose.dev.yml   # Dev environment
│   └── docker-compose.prod.yml  # Prod environment
├── 📁 scripts/         # Utility scripts
│   ├── fresh-dev.sh       # Fresh development start
│   ├── fresh-prod.sh      # Fresh production start
│   ├── nuclear-clean.sh   # Complete Docker cleanup
│   ├── dev-start.sh       # Standard dev start
│   └── prod-start.sh      # Standard prod start
├── 📁 src/             # Source code
├── 📁 prisma/          # Database schema & migrations
└── 📁 resources/       # Static resources (fonts, images)
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 24+ (for local development)
- `.env` file with required variables

### Fresh Development Start
```bash
npm run dev:fresh
```

### Fresh Production Start
```bash
npm run start:fresh
```

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development (no Docker) |
| `npm run dev:docker` | Development with Docker |
| `npm run dev:fresh` | Fresh Docker dev environment |
| `npm run dev:start` | Standard Docker dev start |

## 🚀 Production Commands

| Command | Description |
|---------|-------------|
| `npm run start` | Production with Docker |
| `npm run start:fresh` | Fresh Docker prod environment |
| `npm run start:prod` | Standard Docker prod start |
| `npm run stop` | Stop production environment |

## 🧹 Cleanup Commands

| Command | Description |
|---------|-------------|
| `npm run stop:clean` | Stop prod with volume cleanup |
| `npm run stop:dev:clean` | Stop dev with volume cleanup |
| `npm run docker:reset` | ⚠️ Nuclear option - wipe everything! |

## 🔧 Build & Quality Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build TypeScript |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |

## 📋 Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Discord Bot Configuration
TOKEN=your_discord_bot_token_here
GUILD_ID=your_discord_guild_id
CLIENT_ID=your_discord_client_id
SESSION_CHANNEL_ID=your_session_channel_id
SESSION_CATEGORY_CHANNEL_ID=your_category_channel_id

# Application
PORT=3000

# Database Configuration
HOST=localhost
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=5432

# Database URL (IMPORTANT: Use actual values, not variables)
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database?schema=public
```

**⚠️ Important**: The `DATABASE_URL` must contain actual values, not variable references like `${DB_USER}`. This is required for Prisma to work correctly.

## 🐳 Docker Information

### Development Environment
- **Hot reloading**: File changes trigger automatic restarts
- **Volume mounts**: Source code mounted for live updates
- **Database**: PostgreSQL with persistent volume

### Production Environment
- **Multi-stage build**: Optimized for production
- **Security**: Non-root user, minimal attack surface
- **Health checks**: Built-in health monitoring
- **Persistence**: Database data persisted in volumes

## 🆘 Troubleshooting

### Start Fresh (Recommended for issues)
```bash
# For development
npm run dev:fresh

# For production  
npm run start:fresh
```

### Complete Reset (Nuclear option)
```bash
npm run docker:reset
```

### Manual Database Reset
```bash
# Remove just the database volume
docker volume rm postgres-data

# Restart your environment
npm run dev:docker  # or npm run start
```

### View Logs
```bash
# Development
docker compose -f docker/docker-compose.dev.yml logs -f

# Production
docker compose -f docker/docker-compose.prod.yml logs -f
```

## 📖 Documentation

- **Scripts**: See `scripts/README.md` for detailed script documentation
- **Docker**: See `docker/README.md` for Docker configuration details
- **Config**: See `config/README.md` for configuration file information

## 🤝 Contributing

1. Use `npm run dev:fresh` for a clean development environment
2. Follow the code style with `npm run lint:fix` and `npm run format`
3. Test your changes in both development and production environments
4. Update documentation when adding new features
