import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";
import { ExtendedClient } from "../config/client.type.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🎨 Visual Styling Helpers
const style = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

/**
 * Manager for handling Discord events.
 * Supports loading and registering event handlers.
 */
class EventManager {
  /**
   * Initializes the event manager by loading event files from the specified directory.
   */
  public init = async (eventDirPath: string, client: ExtendedClient) => {
    // Normalize path
    const eventDir = path
      .join(eventDirPath, "/**/*.{ts,js}")
      .replace(/\\/g, "/");
    
    const files = await glob(eventDir);

    if (files.length === 0) {
        console.log(`${style.yellow}[EVT] [WARN] No event files found in directory.${style.reset}`);
        return;
    }

    let loadedCount = 0;

    for (const file of files) {
      const filePath = `file://${file.replace(/\\/g, "/")}`;

      try {
        const eventModule = await import(`${filePath}?update=${Date.now()}`);
        const event = eventModule.default;

        if (!event?.name || typeof event?.execute !== "function") {
          console.warn(
            `${style.yellow}[EVT] [SKIP] Invalid event structure: ${path.basename(file)}${style.reset}`
          );
          continue;
        }

        // Hook logic
        const handler = (...args: any[]) => event.execute(client, ...args);
        
        if (event.once) {
            client.once(event.name, handler);
        } else {
            client.on(event.name, handler);
        }

        console.log(
            `${style.green}[EVT] Registered: ${style.reset}${event.name} ${style.dim}(${event.once ? 'ONCE' : 'ON'}) from ${path.basename(file)}${style.reset}`
        );
        loadedCount++;

      } catch (error) {
        console.error(
            `${style.red}[EVT] [ERR] Failed to load event ${path.basename(file)}: ${error}${style.reset}`
        );
      }
    }
    
    // Optional summary log
    // console.log(`${style.cyan}[EVT] Total events active: ${loadedCount}${style.reset}`);
  };
}

export default EventManager;