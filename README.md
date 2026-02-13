# DND Party Bot

A Discord bot built for a tabletop RPG community to handle session scheduling, party composition, and automated session lifecycle management.

## Tech Stack

- **Runtime**: Node.js 24, TypeScript, ES Modules
- **Framework**: discord.js v14
- **Database**: PostgreSQL with Prisma ORM
- **Infrastructure**: Docker multi-stage builds, deployed on Railway
- **Image Generation**: Sharp + @napi-rs/canvas for dynamic session party images
- **Scheduling**: Cron-based session lifecycle automation

## Architecture

The codebase follows a **modular layered architecture** under `src/modules/`, with each domain feature (`session`, `party`, `user`, `role`, `campaign`) organized into:

- **controller/** — Business logic orchestration
- **repository/** — Database access via Prisma
- **domain/** — TypeScript types and domain utilities
- **presentation/** — Discord message/embed formatting
- **services/** — Specialized service classes (image generation, scheduled events)

### Key Systems

**Command & Event System** — Slash commands and Discord events are auto-discovered from the filesystem by `ExtendedClient`, with error-wrapped async handlers via `createSafeExecutor()`.

**Session Scheduler** — A singleton service that manages three cron jobs per session: reminders (1hr before), cancellation checks (5min before, auto-cancels if party isn't full), and auto-completion (5hr after start). Includes recovery logic for sessions missed during downtime.

**Dynamic Session Images** — Each session generates a composite PNG showing party members, their roles, avatars, and session metadata, re-rendered on every party change.

**Path Aliases** — All imports use subpath imports (`#modules/*`, `#shared/*`, etc.) with conditional resolution for development (`./src/*`) vs production (`./dist/src/*`).

See [`CLAUDE.md`](./CLAUDE.md) for detailed developer documentation.
