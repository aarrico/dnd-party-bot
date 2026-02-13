# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord bot for managing D&D session scheduling and party composition. Built with TypeScript, discord.js v14, Prisma ORM, and PostgreSQL. Runs on Node.js 24+ using ES Modules.

## Common Commands

```bash
# Development
npm run dev              # Local dev with hot reload (tsx)
npm run dev:docker       # Docker dev with volume mounts
npm run dev:fresh        # Fresh Docker dev environment

# Build
npm run build            # Full build: prisma generate → tsc → tsc-alias → copy resources

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier formatting
npm run format:check     # Check Prettier compliance

# Database
npm run db:start         # Start PostgreSQL container
npm run db:stop          # Stop PostgreSQL container

# Production
npm run start            # Start with Docker
npm run stop             # Stop production
```

## Architecture

### Module Structure

Each domain feature follows a layered pattern under `src/modules/`:

- **controller/** — Business logic orchestration
- **repository/** — Database access via Prisma
- **domain/** — TypeScript types and domain utilities
- **presentation/** — Discord message/embed formatting
- **services/** — Specialized service classes

Modules: `session`, `party`, `user`, `role`, `campaign`

### Command & Event System

- Slash commands live in `src/commands/` with `data` (SlashCommandBuilder) and `execute` properties, typed as `DiscordCommand`
- Events in `src/events/` extend `Event<Key>` and use `createSafeExecutor()` for error-wrapped async handling
- `ExtendedClient` (`src/shared/discord/ExtendedClient.ts`) dynamically loads commands and events from the filesystem

### Bootstrap Flow (src/index.ts)

Prisma client init → role cache load → Discord client creation → command/event loading → bot login → session scheduler init → graceful shutdown handlers

### Session Scheduler (src/services/sessionScheduler.ts)

Singleton that creates three cron jobs per session: reminder (1hr before), cancellation check (5min before), and auto-complete (5hr after).

### Database

Prisma with PostgreSQL. Key models: `Campaign` (discord channel), `Session` (scheduled game), `User` (discord user with timezone), `PartyMember` (join table with role), `Role` (party role definitions). Session status flows: SCHEDULED → FULL → ACTIVE → COMPLETED/CANCELED.

## Conventions

- **Imports**: Always use path aliases (`#app/*`, `#modules/*`, `#shared/*`, `#commands/*`, `#events/*`, `#services/*`, `#generated/*`) — never relative paths
- **Logging**: Use `createScopedLogger('context-name')` from `#shared/logging/logger.ts`
- **File naming**: kebab-case for files, PascalCase for classes, camelCase for functions/variables
- **Async**: All async code must be wrapped in try/catch; event handlers use the safe executor pattern
- **TypeScript config**: Located at `config/tsconfig.json`; ESLint at `config/eslint.config.js`; Prettier at `config/.prettierrc`
- **Dev testing**: Set `GUILD_ID` env var to register commands to a single guild for faster iteration
