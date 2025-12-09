import { Collection, REST, Routes } from "discord.js";
import path from "path";
import { slashCommandTemplate } from "../template/slashCommand.template.js";
import { glob } from "glob";

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
 * Manager for handling Discord slash commands.
 * Supports loading, registering, retrieving, updating, and executing commands.
 */
class SlashCommandManager<
  T extends slashCommandTemplate = slashCommandTemplate
> {
  private cacheCommand: Collection<string, T>;
  private manualCommands: Collection<string, T>;

  private rest!: REST;
  private clientId!: string;
  private slashCommandDirPath!: string;

  constructor() {
    this.cacheCommand = new Collection();
    this.manualCommands = new Collection();
  }

  public init = async (
    slashCommandDirPath: string,
    clientId: string,
    discordToken: string
  ) => {
    // REST client setup
    this.rest = new REST({ version: "10" }).setToken(discordToken);
    this.clientId = clientId;

    // Normalize path for glob (Windows compatibility)
    this.slashCommandDirPath = path
      .join(slashCommandDirPath, "/**/*.{ts,js}")
      .replace(/\\/g, "/");

    await this.loadCommands();
  };

  /**
   * 🆕 NEW: Registers a command manually (bypassing the file loader).
   * These persist even after reloadCommands() is called.
   */
  public addManualCommand = (command: T) => {
    this.manualCommands.set(command.data.name, command);
    // Also add to active cache immediately
    this.cacheCommand.set(command.data.name, command);
    console.log(
      `${style.cyan}[CMD] [INTERNAL] Registered internal command: /${command.data.name}${style.reset}`
    );
  };

  public loadCommands = async () => {
    // 1. Clear ONLY the file-based cache logic
    this.cacheCommand.clear();

    // 2. Re-apply Manual Commands first (So they are always present)
    this.manualCommands.forEach((cmd) => {
      this.cacheCommand.set(cmd.data.name, cmd);
    });

    const files = await glob(this.slashCommandDirPath);

    if (files.length === 0) {
      console.log(
        `${style.yellow}[CMD] [WARN] No command files found in: ${this.slashCommandDirPath}${style.reset}`
      );
      return;
    }

    for (const file of files) {
      const fileUrl = `file://${file.replace(/\\/g, "/")}`;

      try {
        // Cache busting for hot-reloading
        const commandModule = await import(`${fileUrl}?update=${Date.now()}`);
        const command: T = commandModule.default;

        if (!command?.data?.name || typeof command.execute !== "function") {
          console.warn(
            `${
              style.yellow
            }[CMD] [SKIP] Invalid command structure: ${path.basename(file)}${
              style.reset
            }`
          );
          continue;
        }

        this.cacheCommand.set(command.data.name, command);
        // Optional: Verbose logging
        // console.log(`[CMD] Loaded: ${command.data.name}`);
      } catch (error) {
        console.error(
          `${style.red}[CMD] [ERR] Failed to load ${path.basename(
            file
          )}: ${error}${style.reset}`
        );
      }
    }
  };

  public registerGuildCommands = async (guildIds: string[] | string) => {
    const ids = Array.isArray(guildIds) ? guildIds : [guildIds];

    for (const guildId of ids) {
      try {
        await this.rest.put(
          Routes.applicationGuildCommands(this.clientId, guildId),
          {
            body: this.cacheCommand.map((cmd) => cmd.data.toJSON()),
          }
        );
        console.log(
          `${style.green}[CMD] Registered ${this.cacheCommand.size} commands for Guild: ${guildId}${style.reset}`
        );
      } catch (error) {
        console.error(
          `${style.red}[CMD] [ERR] Registration failed for Guild ${guildId}: ${error}${style.reset}`
        );
      }
    }
  };

  public registerGlobalCommands = async () => {
    try {
      await this.rest.put(Routes.applicationCommands(this.clientId), {
        body: this.cacheCommand.map((cmd) => cmd.data.toJSON()),
      });
      console.log(
        `${style.green}[CMD] Registered ${this.cacheCommand.size} commands GLOBALLY.${style.reset}`
      );
    } catch (error) {
      console.error(
        `${style.red}[CMD] [ERR] Global registration failed: ${error}${style.reset}`
      );
    }
  };

  /**
   * Retrieves a single command module by name.
   */
  public getCommands = (commandName: string): T => {
    const command = this.cacheCommand.get(commandName);
    if (!command) {
      throw new Error(`Command '${commandName}' not found in cache.`);
    }
    return command;
  };

  public listCommands = () => {
    return this.cacheCommand.map((cmd) => cmd.data.name);
  };

  /**
   * Returns the number of loaded commands.
   * Used by Discrafter to show startup stats.
   */
  public getCommandCount = (): number => {
    return this.cacheCommand.size;
  };

  public reloadCommands = async () => {
    console.log(`${style.cyan}[CMD] Reloading all commands...${style.reset}`);
    await this.loadCommands(); // This now safely keeps manual commands!
    console.log(
      `${style.green}[CMD] Reload complete. Active commands: ${this.cacheCommand.size}${style.reset}`
    );
  };
}

export default SlashCommandManager;
