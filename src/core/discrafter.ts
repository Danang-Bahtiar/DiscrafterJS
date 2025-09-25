import { Client, Collection, Interaction } from "discord.js";
import { DiscrafterConfig } from "../config/discrafter.config.js";
import { loadConfig } from "../loaders/config.loader.js";
import { eventTemplate } from "../template/event.template.js";
import { slashCommandTemplate } from "../template/slashCommand.template.js";
import SlashCommandManager from "../handlers/slashCommand.js";
import EventManager from "../handlers/event.js";
import path from "path";
import HelperManager from "../handlers/helper.js";
import { helperTemplate } from "../template/helper.template.js";
import { ExtendedClient } from "../config/client.type.js";

/**
 * Main Discrafter class for managing Discord bot functionalities.
 * @class Discrafter
 * @property {Client} client - Discord.js Client instance.
 * @property {string} discordToken - Token for authenticating the bot with Discord.
 * @property {Collection<string, any>} HandlerCollection - Collection of various handlers (e.g., slash commands, events). By default has following key [slashCommand, event, helper] depending on which DefaultHandler with value of true in discrafter.config.js.
 * @method static create - Creates and initializes a Discrafter instance based on the provided configuration.
 * @method static SlashCommand - Defines a slash command configuration.
 * @method static Event - Defines an event configuration.
 * @method getClient - Retrieves the Discord.js Client instance.
 * @method login - Logs the bot into Discord using the provided token.
 *
 */
class Discrafter {
  private client!: ExtendedClient;
  private discordToken!: string;
  private HandlerCollection: Collection<string, any> = new Collection();
  private typeMap: Record<string, (...args: any[]) => any[]> = {
      Interaction: (interaction) => [interaction],
      Client: (_, client) => [client],
      Args: (_, __, ...args) => args,
      InteractionClient: (interaction, client) => [interaction, client],
      InteractionArgs: (interaction, __, ...args) => [interaction, ...args],
      ClientArgs: (_, client, ...args) => [client, ...args],
      All: (interaction, client, ...args) => [interaction, client, ...args],
    };

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

  /**
   * Defines and returns a helper function configuration object.
   * @param config - Configuration object for defining a Helper file.
   * @returns 
   */
  static Helper(config: helperTemplate): helperTemplate {
    if (!config.name || !config.execute || !config.type) {
      throw new Error("Helper must have name, type and executable function!");
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

    if (
      config.slashCommand.globalRegister &&
      config.slashCommand.guilds?.length !== 0
    ) {
      const pickGlobal = Math.random() < 0.5;
      if (pickGlobal) config.slashCommand.guilds = [];
      else config.slashCommand.globalRegister = false;
    }

    if (
      config.slashCommand.globalRegister === true &&
      config.slashCommand.guilds?.length === 0 &&
      config.development?.developmentMode !== true
    ) {
      const slashCommandManager = this.HandlerCollection.get("slashCommand");
      if (slashCommandManager) {
        await slashCommandManager.registerGlobalCommands();
        console.log("Registered global slash commands.");
      }
    }

    if (
      config.slashCommand.globalRegister === false &&
      Array.isArray(config.slashCommand.guilds) &&
      config.slashCommand.guilds.length > 0 &&
      config.development?.developmentMode !== true
    ) {
      const slashCommandManager = this.HandlerCollection.get("slashCommand");
      if (slashCommandManager) {
        await slashCommandManager.registerGuildCommands(
          config.slashCommand.guilds
        );
        console.log("Registered guild-specific slash commands.");
      }
    }

    if (config.helper.useDefaultHandler) {
      const helperManager = new HelperManager();
      const helperPath = path.resolve(
        process.cwd(),
        config.helper.customDirPath ?? "./src/helpers"
      );

      await helperManager.init(helperPath);
      this.HandlerCollection.set("helper", helperManager);
      console.log("[HND] Loaded handler: helper");
    }

    this.client.dispatchHelper = this.dispatchHelper;

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

  /**
  * Dispatches a helper function by name.
  *
  * This function looks up a helper in the loaded helper collection
  * and calls its `execute` method with the correct arguments depending on the helper's type.
   * @param helperName 
   * @param interaction 
   * @param args 
   * @returns 
   */
  private dispatchHelper = async (
    helperName: string,
    interaction: Interaction,
    ...args: any[]
  ) => {
    const helperManager = this.HandlerCollection.get("helper");

    const helperModule = helperManager.getHelper(helperName);

    if (!helperModule) {
      console.log(`Unable to find helper function: ${helperName}`);
      return;
    }

    if (typeof helperModule.execute !== "function") {
      console.log(
        `Invalid Helper Function Object. Unable to Execute the function.`
      );
      return;
    }

    const factory = this.typeMap[helperModule.type];
    if (!factory) {
      console.log(`Unknown helper type: ${helperModule.type}`);
      return;
    }

    try {
      return await helperModule.execute(
        ...factory(interaction, this.client, ...args)
      );
    } catch (err) {
      console.error(`[HELPER ERROR] ${helperName}:`, err);
    }
  };

  //============================= Public Methods ==============================//

  /**
   * Logs the bot into Discord using the provided token.
   * Use after setting up the Discrafter instance using `Discrafter.create()`.
   */
  public login = () => {
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
