import { Client, Collection } from "discord.js";
import { DiscrafterConfig } from "../config/discrafter.config.js";
import { loadConfig } from "../loaders/config.loader.js";
import { eventTemplate } from "../template/event.template.js";
import { slashCommandTemplate } from "../template/slashCommand.template.js";
import SlashCommandManager from "../handlers/slashCommand.js";
import EventManager from "../handlers/event.js";
import path from "path";

/**
 * Main Discrafter class for managing Discord bot functionalities.
 * @class Discrafter
 * @property {Client} client - Discord.js Client instance.
 * @property {string} discordToken - Token for authenticating the bot with Discord.
 * @property {Collection<string, any>} HandlerCollection - Collection of various handlers (e.g., slash commands, events).
 * @method static create - Creates and initializes a Discrafter instance based on the provided configuration.
 * @method static SlashCommand - Defines a slash command configuration.
 * @method static Event - Defines an event configuration.
 * @method getClient - Retrieves the Discord.js Client instance.
 * @method login - Logs the bot into Discord using the provided token.
 *
 */
class Discrafter {
  private client!: Client;
  private discordToken!: string;
  private HandlerCollection: Collection<string, any> = new Collection();

  //============================= Static Methods ==============================//

  /**
   * Creates and initializes a Discrafter instance based on the provided configuration.
   * @returns A promise that resolves to an instance of Discrafter after loading the configuration and setting up handlers.
   * @example
   * ```ts
   * import { Discrafter } from "discrafter";
   * const bot = await Discrafter.create();
   * ```
   */
  static async create() {
    const config: DiscrafterConfig = await loadConfig();
    const instance = new Discrafter();

    instance.configResolver(config);

    await instance.setup(config);

    return instance;
  }

  /**
   * Defines and returns an event configuration object.
   * @param config - Configuration object for defining an event.
   * @returns
   */
  static Event(config: eventTemplate): eventTemplate {
    if (!config.name || !config.execute) {
      throw new Error("Event must have 'name' and 'execute' fields.");
    }
    return config;
  }

  /**
   * Defines and returns a slash command configuration object.
   * @param config - Configuration object for defining a slash command.
   * @returns
   */
  static SlashCommand<T extends slashCommandTemplate>(config: T): T {
    if (!config.data || !config.execute) {
      throw new Error("SlashCommand must have 'data' and 'execute' fields.");
    }
    return config;
  }

  //============================= Private Methods ==============================//

  private configResolver(config: DiscrafterConfig) {
    this.client = new Client({ intents: config.core.intents });
    this.discordToken = config.core.discordToken;
  }

  private async setup(config: DiscrafterConfig) {
    // SlashCommand
    if (config.slashCommand.useDefaultHandler) {
      const slashCommandManager = new SlashCommandManager();
      const commandsPath = path.resolve(
        process.cwd(),
        config.slashCommand.customDirPath ?? "./src/commands"
      );

      await slashCommandManager.init(
        commandsPath,
        config.core.clientId,
        config.core.discordToken
      );

      this.HandlerCollection.set("slashCommand", slashCommandManager);

      console.log("[HND] Loaded handler: slashCommand");
    }

    if (config.development?.developmentMode) {
      console.log("Running in development mode.");

      const slashCommandManager = this.HandlerCollection.get("slashCommand");

      if (config.development?.developmentGuildId) {
        console.log(
          `[DEV] Registering commands to guild: ${config.development.developmentGuildId}`
        );
        await slashCommandManager.registerGuildCommands(
          config.development.developmentGuildId
        );
      }

      // Extra dev utilities
      console.log("[DEV] Commands loaded:", slashCommandManager.listCommands());

      process.on("uncaughtException", (err) => {
        console.error("[DEV] Uncaught exception:", err);
      });

      process.on("unhandledRejection", (reason) => {
        console.error("[DEV] Unhandled rejection:", reason);
      });
    }

    if (config.slashCommand.globalRegister ?? false) {
      const slashCommandManager = this.HandlerCollection.get("slashCommand");
      if (slashCommandManager) {
        await slashCommandManager.registerGlobalCommands();
        console.log("Registered global slash commands.");
      }
    }

    if (config.custom?.useDefaultInteractionEvent ?? false) {
      const slashHandler = this.HandlerCollection.get("slashCommand");
      this.client.on("interactionCreate", async (interaction) => {
        if ("commandName" in interaction) {
          if (interaction.isAutocomplete()) {
            const command = interaction.commandName;
            return slashHandler
              .getCommands(command)
              .autocomplete(interaction, this.client);
          }

          if (interaction.isChatInputCommand()) {
            const command = interaction.commandName;
            return slashHandler
              .getCommands(command)
              .execute(interaction, this.client);
          }
        } else if ("customId" in interaction) {
          const [command, action] = interaction.customId.split("-");
          if (!command) return; // ignore malformed customId

          const cmd = slashHandler.getCommands(command);
          if (cmd && typeof cmd[action] === "function") {
            return cmd[action](interaction, this.client);
          }
        }
      });
    }

    if (config.event.useDefaultHandler) {
      const eventManager = new EventManager();
      const eventsPath = path.resolve(
        process.cwd(),
        config.event.customDirPath ?? "./src/events"
      );
      await eventManager.init(eventsPath, this.client);
      this.HandlerCollection.set("event", eventManager);
      console.log("[HND] Loaded handler: event");
    }
  }

  //============================= Public Methods ==============================//

  /**
   * Retrieves the Discord.js Client instance.
   * @returns The Discord.js Client instance.
   */
  public getClient() {
    return this.client;
  }

  /**
   * Logs the bot into Discord using the provided token.
   * Use after setting up the Discrafter instance using `Discrafter.create()`.
   */
  public login() {
    try {
      this.client.login(this.discordToken);
      this.client.once("clientReady", () => {
        console.log(`Bot logged in successfully as ${this.client.user?.tag}.`);
      });
    } catch (error) {
      console.error("Error logging in:", error);
    }
  }
}

export default Discrafter;
