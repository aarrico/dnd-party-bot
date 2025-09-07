# Configuration Files

This directory contains all configuration files for the project:

## Development Tools

- `eslint.config.js` - ESLint configuration for code linting
- `.prettierrc` - Prettier configuration for code formatting  
- `tsconfig.json` - TypeScript compiler configuration

## Usage Notes

### ESLint
Configuration is automatically picked up by editors and can be run via:
```bash
npx eslint src/
```

### Prettier
Formatting configuration used by editors and CLI:
```bash
npx prettier --write src/
```

### TypeScript
Compiler configuration used for builds and IDE support:
```bash
npx tsc --project config/tsconfig.json
```
