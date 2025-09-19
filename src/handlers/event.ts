import { Client } from "discord.js";
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";

/**
 * @internal
 * Utility versions of __dirname and __filename for ESM compatibility.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const eventDir = path
      .join(eventDirPath, "/**/*.{ts,js}")
      .replace(/\\/g, "/");
    const files = await glob(eventDir);

    for (const file of files) {
      const filePath = `file://${file.replace(/\\/g, "/")}`;
      const eventModule = await import(`${filePath}?update=${Date.now()}`); // Removed the extra 'file://'
      const event = eventModule.default;

      if (!event?.name || typeof event?.execute !== "function") {
        console.warn(`[WARN] Skipping invalid event file: ${file}`);
        continue;
      }

      console.log(`[EVENT] Loaded event: ${event.name}`);
      console.log(event);

      const handler = (...args: any[]) => event.execute(client, ...args);
      event.once
        ? client.once(event.name, handler)
        : client.on(event.name, handler);
    }
  };
}

export default EventManager;
