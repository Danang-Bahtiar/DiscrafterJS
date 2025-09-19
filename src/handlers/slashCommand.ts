import {
  Client,
  Collection,
  Interaction,
  REST,
  RESTGetAPIApplicationCommandsResult,
  RESTGetAPIApplicationGuildCommandsResult,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import path from "path";
import { slashCommandTemplate } from "../template/slashCommand.template.js";
import { glob } from "glob";
import { fileURLToPath } from "url";

/**
 * @internal
 * Utility versions of __dirname and __filename for ESM compatibility.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Manager for handling Discord slash commands.
 * Supports loading, registering, retrieving, updating, and executing commands.
 * @template T - Type extending the slashCommandTemplate interface.
 * @property {string} slashCommandDirPath - Filesystem path to load command files from.
 * @property {Collection<string, T>} cacheCommand - Cache of loaded commands.
 * @property {REST} rest - REST client for Discord API interactions.
 * @property {string} clientId - Discord application client ID.
 * @property {Collection<string, any>} cacheGlobalCommands - Cache for global commands.
 * @property {Collection<string, Collection<string, any>>} cacheGuildCommands - Cache for guild-specific commands.
 * @function loadCommands - Loads command files from the specified path.
 * @function registerCommands - Registers commands globally or for a specific guild.
 * @function getCommands - Retrieves a commands, either global or guild-specific using discord API.
 * @function getOneCommand - Retrieves a single command by name, either global or guild-specific uisng discord API.
 * @function updateCommand - Updates an existing command with new data.
 * @function useCommand - Executes a command based on interaction and client context.
 * @function getCommandData - Retrieves a command's data by name from the cache.
 */
class SlashCommandManager<
  T extends slashCommandTemplate = slashCommandTemplate
> {
  private cacheCommand: Collection<string, T>;
  private rest!: REST;
  private clientId!: string;
  private slashCommandDirPath!: string;

  constructor() {
    this.cacheCommand = new Collection();
  }

  public init = async (
    slashCommandDirPath: string,
    clientId: string,
    discordToken: string
  ) => {
    // REST client setup
    this.rest = new REST({ version: "10" }).setToken(discordToken);

    // Client ID setup
    this.clientId = clientId;

    // slash command loaders
    this.slashCommandDirPath = path
      .join(slashCommandDirPath, "/**/*.{ts,js}")
      .replace(/\\/g, "/");
    await this.loadCommands();
  };

  public loadCommands = async () => {
    const files = await glob(this.slashCommandDirPath);

    console.log(files);

    for (const file of files) {
      const fileUrl = `file://${file.replace(/\\/g, "/")}`;
      const commandModule = await import(`${fileUrl}?update=${Date.now()}`);
      const command: T = commandModule.default;

      if (!command.data.name || typeof command.execute !== "function") {
        console.warn(
          `Invalid command structure in file: ${file}. Skipping this command.`
        );
        continue;
      }

      this.cacheCommand.set(command.data.name, command);
      console.log(`[CMD] Loaded slash command: ${command.data.name}`);
    }
  };

  public registerGuildCommands = async (guildIds: string[] | string) => {
    const ids = Array.isArray(guildIds) ? guildIds : [guildIds];

    for (const guildId of ids) {
      await this.rest.put(
        Routes.applicationGuildCommands(this.clientId, guildId),
        {
          body: this.cacheCommand.map((cmd) => cmd.data.toJSON()),
        }
      );
      console.log(
        `Registered ${this.cacheCommand.size} commands for guild ${guildId}`
      );
    }
  };

  public registerGlobalCommands = async () => {
    await this.rest.put(Routes.applicationCommands(this.clientId), {
      body: this.cacheCommand.map((cmd) => cmd.data.toJSON()),
    });
  };

  public getCommands = (commandName: string) => {
    const commands = this.cacheCommand.get(commandName);
    if (!commands) {
      throw new Error(`Command with name ${commandName} not found in cache.`);
    }
    return commands;
  };

  public listCommands = () => {
    return this.cacheCommand.map((cmd) => cmd.data.name);
  };
}

export default SlashCommandManager;
