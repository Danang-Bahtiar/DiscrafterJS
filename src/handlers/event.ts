import { Client } from "discord.js";
import { glob } from "glob";
import path from "path";

/**
 * Manager for handling Discord events.
 * Supports loading and registering event handlers.
 * @function init - Initializes the event manager by loading and registering events.
 */
class EventManager {
  /**
   * Initializes the event manager by loading event files from the specified directory
   * and registering them with the provided Discord client.
   * @param eventDirPath - Directory path to load event files from.
   * @param client - Discord client instance.
   */
  public init = async (eventDirPath: string, client: Client) => {
    const eventDir = `${eventDirPath}/**/*.{ts,js}`;
    const files = await glob(eventDir, { cwd: path.resolve(__dirname, "..") });

    for (const file of files) {
      const filePath = path.resolve(file);
      const eventModule = await import(
        `file://${filePath}?update=${Date.now()}`
      );
      const event = eventModule.default;

      if (!event?.name || typeof event?.execute !== "function") {
        console.warn(`[WARN] Skipping invalid event file: ${file}`);
        continue;
      }

      const handler = (...args: any[]) => event.execute(client, ...args);
      event.once
        ? client.once(event.name, handler)
        : client.on(event.name, handler);
    }
  };
}

export default EventManager;
