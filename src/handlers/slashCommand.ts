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
  private cacheGlobalCommands: Collection<string, any> = new Collection();
  private cacheGuildCommands: Collection<string, Collection<string, any>> =
    new Collection();

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
    this.slashCommandDirPath = `${slashCommandDirPath}/**/*.{ts,js}`;
    // This will match files in the slashCommands directory and all its subdirectories
    const files = await glob(
      [
        `${slashCommandDirPath}/*.{ts,js}`, // Matches files directly in the directory
        `${slashCommandDirPath}/*/**/*.{ts,js}`, // Matches files in subdirectories
      ],
      { cwd: path.resolve(__dirname, "..") }
    );
    await this.loadCommands(files);
  };

  public loadCommands = async (files: any) => {
    console.log(
      `Loading slash commands from path: ${this.slashCommandDirPath}`
    );

    console.log(`Found ${files.length} command files.`);
    console.log(files);

    for (const file of files) {
      const filePath = path.resolve(file);
      const fileUrl = `file://${filePath}`;
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

  public registerCommands = async (guildId?: string) => {
    if (guildId) {
      await this.rest.put(
        Routes.applicationGuildCommands(this.clientId, guildId),
        {
          body: this.cacheCommand.map((cmd) => cmd.data.toJSON()),
        }
      );
    } else {
      await this.rest.put(Routes.applicationCommands(this.clientId), {
        body: this.cacheCommand.map((cmd) => cmd.data.toJSON()),
      });
    }
  };

  public getCommands = async (guildId?: string) => {
    if (guildId) {
      // If we don't have the guild's commands cached, fetch them
      if (!this.cacheGuildCommands.has(guildId)) {
        const guildCommands = (await this.rest.get(
          Routes.applicationGuildCommands(this.clientId, guildId)
        )) as RESTGetAPIApplicationGuildCommandsResult;

        // Cache the commands by their ID for quick lookup
        const guildCommandsCollection = new Collection<string, any>();
        guildCommands.forEach((cmd) =>
          guildCommandsCollection.set(cmd.id, cmd)
        );
        this.cacheGuildCommands.set(guildId, guildCommandsCollection);
      }
      return this.cacheGuildCommands.get(guildId);
    } else {
      // If we don't have the global commands cached, fetch them
      if (this.cacheGlobalCommands.size === 0) {
        const globalCommands = (await this.rest.get(
          Routes.applicationCommands(this.clientId)
        )) as RESTGetAPIApplicationCommandsResult;

        globalCommands.forEach((cmd) =>
          this.cacheGlobalCommands.set(cmd.id, cmd)
        );
      }
      return this.cacheGlobalCommands;
    }
  };

  public getOneCommand = async (commandName: string, guildId?: string) => {
    let commands;
    if (guildId) {
      commands = await this.getCommands(guildId);
    } else {
      commands = await this.getCommands();
    }
    return commands?.find((cmd: any) => cmd.name === commandName);
  };

  public updateCommand = async (
    commandName: string,
    newCommand: SlashCommandBuilder,
    guildId?: string
  ) => {
    const command = await this.getOneCommand(commandName, guildId);

    if (!command) {
      throw new Error(`Command with name ${commandName} not found.`);
    }

    await this.rest.patch(
      guildId
        ? Routes.applicationGuildCommand(this.clientId, guildId, command.id)
        : Routes.applicationCommand(this.clientId, command.id),
      { body: newCommand.toJSON() }
    );
  };

  public useCommand = async (
    commandName: string,
    interaction: Interaction,
    client: Client
  ): Promise<void> => {
    const command = this.cacheCommand.get(commandName);
    if (!command) {
      throw new Error(`Command with name ${commandName} not found in cache.`);
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(
        `An error occurred while executing command "${commandName}":`,
        error
      );
      // You could also add logic to send a user-friendly error message back to Discord
    }
  };

  public getCommandData = (commandName: string): T | string => {
    const command = this.cacheCommand.get(commandName);
    if (!command) {
      return `Command with name ${commandName} not found in cache.`;
    }
    return command;
  };
}

export default SlashCommandManager;
