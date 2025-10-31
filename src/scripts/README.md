# Scripts

This directory contains standalone scripts for development and testing purposes.

## list-sessions.ts

List all sessions in the database with their details.

### Usage

```bash
npm run list-sessions
```

### Output

Displays a formatted list of all sessions including:
- Session ID
- Session name
- Status (with colored emoji indicator)
- Date and timezone
- Campaign name
- Party size
- Party members with their roles

This is useful for finding session IDs to use with the `generate-image` script.

## generate-session-image.ts

Generate a session image without starting the Discord bot.

### Usage

```bash
npm run generate-image <sessionId>
```

### Example

```bash
# Generate image for session with ID 1234567890
npm run generate-image 1234567890
```

### Requirements

- Database must be running and accessible
- Session must exist in the database with at least a Game Master
- All required resources (fonts, backdrop image) must be in place

### Output

The script generates a session image at:
```
resources/temp/current-session.png
```

### What it does

1. Connects to the database
2. Fetches session data by ID
3. Fetches all party members for the session
4. Validates that a Game Master exists
5. Generates the session image with:
   - Session name
   - Session date and timezone
   - Party member avatars
   - Role icons
   - Status-colored border (green=scheduled, gold=active, blue=completed, red=canceled)

### Notes

- The script uses mock Discord avatars since it doesn't connect to Discord API
- Avatar URLs are generated based on Discord's default avatar system
- The script will exit with an error if the session doesn't exist or has no Game Master

### Development

You can also run directly with tsx:

```bash
tsx src/scripts/generate-session-image.ts <sessionId>
```
