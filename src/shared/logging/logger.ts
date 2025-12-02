import { createLogger, format, transports } from 'winston';

const { combine, colorize, errors, printf, splat, timestamp } = format;

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug');

export const logger = createLogger({
  level: logLevel,
  defaultMeta: { service: process.env.APP_NAME ?? 'dnd-party-bot' },
  transports: [
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp(),
        errors({ stack: true }),
        splat(),
        printf(({ timestamp: ts, level, message, stack, context, _service, ...meta }) => {
          void _service; // Intentionally unused in console output
          const ctx = typeof context === 'string' && context ? `[${context}] ` : '';
          const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
          return `${ts as string} [${level}] ${ctx}${String(stack ?? message)}${metaString}`;
        }),
      ),
    }),
  ],
});

export const createScopedLogger = (context: string, meta: Record<string, unknown> = {}) =>
  logger.child({ context, ...meta });
