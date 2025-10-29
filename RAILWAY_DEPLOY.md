# Railway Deployment Guide

## Quick Setup (5 minutes)

### 1. Prerequisites
- GitHub account with this repository
- Railway account (sign up at [railway.app](https://railway.app))
- Discord Bot Token and Client ID

### 2. Deploy to Railway

#### Option A: Using Railway Dashboard (Recommended)

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository (`dnd-party-bot`)
5. Railway will detect the Docker configuration automatically

#### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to your project
railway link

# Deploy
railway up
```

### 3. Add PostgreSQL Database

1. In your Railway project dashboard, click "New Service"
2. Select "PostgreSQL"
3. Railway will automatically provision a database
4. The `DATABASE_URL` will be automatically set as an environment variable

### 4. Set Environment Variables

In your Railway project, go to the "Variables" tab and add:

```
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
NODE_ENV=production
PORT=3000
```

**Note**: When you add PostgreSQL via Railway, it automatically provides `DATABASE_URL`. You don't need to set any other database variables - the app uses `DATABASE_URL` directly.

### 5. Deploy

Railway will automatically deploy when you push to your main branch!

## Alternative: Local Docker Compose

If you want to test locally before deploying:

```bash
# Copy the railway compose file
cp docker-compose.railway.yml docker-compose.yml

# Create .env file
cat > .env << EOF
DISCORD_TOKEN=your_token
DISCORD_CLIENT_ID=your_client_id
DATABASE_URL=postgresql://postgres:password@localhost:5432/dnd_party_bot
PORT=3000
# Docker compose needs these for the db service:
DB_USER=postgres
DB_NAME=dnd_party_bot
DB_PASSWORD=password
EOF

# Start services
docker compose up --build
```

## Configuration Files Included

- **docker-compose.railway.yml**: Standalone Docker Compose config (no `extends`)
- **railway.json**: Railway platform configuration
- **docker/Dockerfile.prod**: Production Docker build

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | Yes | - | Your Discord bot token |
| `DISCORD_CLIENT_ID` | Yes | - | Your Discord application client ID |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string (Railway auto-generates this) |
| `PORT` | No | 3000 | Application port |
| `NODE_ENV` | No | production | Node environment |

**Note**: Railway automatically provides `DATABASE_URL` when you add a PostgreSQL service. The app uses this directly via Prisma.

## Troubleshooting

### Build Fails
- Check that all files are committed to git
- Ensure `docker/Dockerfile.prod` exists
- Verify `package.json` and dependencies are correct

### Database Connection Fails
- Verify `DATABASE_URL` is set correctly (Railway auto-generates this)
- Check that PostgreSQL service is running in Railway
- Ensure migrations have run (check deployment logs for "prisma migrate deploy")

### Bot Doesn't Respond
- Verify `DISCORD_TOKEN` is correct
- Check that bot has proper permissions in Discord
- Review application logs in Railway dashboard

## Cost Estimate

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month credit (free to start)
- **Pro Plan**: $20/month credit
- **Usage**: ~$5-10/month for small Discord bot + PostgreSQL

First $5 is free each month, so small bots often run free!

## Support

For Railway-specific issues:
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

For bot issues:
- Check GitHub issues in this repository
