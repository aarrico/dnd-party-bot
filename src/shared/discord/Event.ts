import { ClientEvents } from 'discord.js';

export class Event<Key extends keyof ClientEvents> {
  constructor(
    public name: Key,
    public execute: (...args: ClientEvents[Key]) => void | Promise<void>
  ) {}

  /**
   * Wraps the execute function with error handling
   * Returns a new function that catches and logs errors without crashing the bot
   */
  public createSafeExecutor(logger: {
    error: (msg: string, meta?: Record<string, unknown>) => void;
  }): (...args: ClientEvents[Key]) => Promise<void> {
    return async (...args: ClientEvents[Key]): Promise<void> => {
      try {
        await this.execute(...args);
      } catch (error) {
        logger.error(`Unhandled error in event handler: ${this.name}`, {
          event: this.name,
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                }
              : error,
        });
      }
    };
  }
}
