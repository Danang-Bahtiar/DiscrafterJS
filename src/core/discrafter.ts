import { Client, Collection, Interaction, SlashCommandBuilder } from "discord.js";
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
 */
class Discrafter {
  private client!: ExtendedClient;
  private discordToken!: string;
  private HandlerCollection: Collection<string, any> = new Collection();

  // Argument parsers for Helper functions
  private typeMap: Record<
    string,
    (i: Interaction, c: Client, ...args: any[]) => any[]
  > = {
    Interaction: (i) => [i],
    Client: (_, c) => [c],
    Args: (_, __, ...args) => args,
    InteractionClient: (i, c) => [i, c],
    InteractionArgs: (i, __, ...args) => [i, ...args],
    ClientArgs: (_, c, ...args) => [c, ...args],
    All: (i, c, ...args) => [i, c, ...args],
  };

  // ============================= Static Methods ============================== //

  static async create() {
    const config: DiscrafterConfig = await loadConfig();
    const instance = new Discrafter();

    instance.configResolver(config);
    await instance.setup(config);

    return instance;
  }

  static Event(config: eventTemplate): eventTemplate {
    if (!config.name || !config.execute) {
      throw new Error("Event must have 'name' and 'execute' fields.");
    }
    return config;
  }

  static SlashCommand<T extends slashCommandTemplate>(config: T): T {
    if (!config.data || !config.execute) {
      throw new Error("SlashCommand must have 'data' and 'execute' fields.");
    }
    return config;
  }

  static Helper(config: helperTemplate): helperTemplate {
    if (!config.name || !config.execute || !config.type) {
      throw new Error("Helper must have name, type and executable function!");
    }
    return config;
  }

  // ============================= Core Setup ============================== //

  private configResolver(config: DiscrafterConfig) {
    this.client = new Client({ intents: config.core.intents });
    this.discordToken = config.core.discordToken;
  }

  private async setup(config: DiscrafterConfig) {
    this.log("SYS", "Initializing Discrafter...");

    // 1. Initialize Handlers
    await this.initializeSlashCommands(config);
    await this.initializeHelpers(config);
    await this.initializeEvents(config);

    // 2. Register Runtime Listeners
    if (config.custom?.useDefaultInteractionEvent) {
      this.registerInteractionListener();
    }

    this.log("SYS", "Initialization Complete.");
  }

  // ============================= Module Initializers ============================== //

  private async initializeSlashCommands(config: DiscrafterConfig) {
    if (!config.slashCommand.useDefaultHandler) return;

    const manager = new SlashCommandManager();
    const cmdPath = path.resolve(
      process.cwd(),
      config.slashCommand.customDirPath ?? "./src/commands"
    );

    // 1. Load Commands from file system
    await manager.init(cmdPath, config.core.clientId, config.core.discordToken);

    if (config.slashCommand.useDefaultReloadCommand) {
      const reloadCommand = {
        data: new SlashCommandBuilder()
          .setName("reload_system")
          .setDescription("♻️ [DEV] Reloads all slash commands and events.")
          .setDefaultMemberPermissions(8), // 8 = ADMINISTRATOR (Safety first!)
        execute: async (interaction: any) => {
          // Type as any or specific Interaction type
          await interaction.deferReply({ ephemeral: true });
          try {
            await manager.reloadCommands();
            await interaction.editReply({
              content:
                "✅ **System Reloaded!** All commands have been refreshed.",
            });
          } catch (e) {
            await interaction.editReply({
              content: `❌ **Reload Failed:** ${e}`,
            });
          }
        },
      };

      // We cast to 'any' here because your template might be strict,
      // but this internal object is valid.
      manager.addManualCommand(reloadCommand as any);
    }

    this.HandlerCollection.set("slashCommand", manager);
    this.log(
      "HND",
      `SlashCommand Handler loaded. (${manager.getCommandCount()} commands found)`
    );

    // 2. Registration Logic (Dev vs Global vs Guild)
    const { development } = config;
    const { globalRegister, guilds } = config.slashCommand;

    // CASE A: Development Mode (Priority)
    if (development?.developmentMode && development.developmentGuildId) {
      this.log(
        "DEV",
        `Running in Development Mode. Registering to: ${development.developmentGuildId}`
      );
      await manager.registerGuildCommands(development.developmentGuildId);

      // Dev Observability
      manager
        .listCommands()
        .forEach((cmd) => this.log("DEV", `Loaded Command: /${cmd}`));
      this.setupDevErrorHandling();
      return;
    }

    // CASE B: Global Registration
    if (globalRegister) {
      this.log("CMD", "Registering commands GLOBALLY...");
      await manager.registerGlobalCommands();
      return;
    }

    // CASE C: Specific Guild Whitelist
    if (Array.isArray(guilds) && guilds.length > 0) {
      this.log(
        "CMD",
        `Registering commands to ${guilds.length} specific guilds...`
      );
      await manager.registerGuildCommands(guilds);
      return;
    }

    this.log("WARN", "No command registration method matched configuration.");
  }

  private async initializeHelpers(config: DiscrafterConfig) {
    if (!config.helper.useDefaultHandler) return;

    const manager = new HelperManager();
    const helperPath = path.resolve(
      process.cwd(),
      config.helper.customDirPath ?? "./src/helpers"
    );

    await manager.init(helperPath);
    this.HandlerCollection.set("helper", manager);
    this.log("HND", "Helper Handler loaded.");

    // Attach dispatch method to client for global access
    this.client.dispatchHelper = this.dispatchHelper;
  }

  private async initializeEvents(config: DiscrafterConfig) {
    if (!config.event.useDefaultHandler) return;

    const manager = new EventManager();
    const eventPath = path.resolve(
      process.cwd(),
      config.event.customDirPath ?? "./src/events"
    );

    await manager.init(eventPath, this.client);
    this.HandlerCollection.set("event", manager);
    this.log("HND", "Event Handler loaded.");
  }

  // ============================= Runtime Logic ============================== //

  private registerInteractionListener() {
    const slashHandler = this.HandlerCollection.get("slashCommand");
    if (!slashHandler) return;

    this.client.on("interactionCreate", async (interaction) => {
      try {
        // Handle Chat Inputs
        if (interaction.isChatInputCommand()) {
          return slashHandler
            .getCommands(interaction.commandName)
            .execute(interaction, this.client);
        }

        // Handle Autocomplete
        if (interaction.isAutocomplete()) {
          return slashHandler
            .getCommands(interaction.commandName)
            .autocomplete(interaction, this.client);
        }

        // Handle Custom ID Interactions (Buttons/Modals: "commandName-action")
        if ("customId" in interaction) {
          const [command, action] = interaction.customId.split("-");
          if (!command || !action) return;

          const cmdModule = slashHandler.getCommands(command);
          if (cmdModule && typeof cmdModule[action] === "function") {
            return cmdModule[action](interaction, this.client);
          }
        }
      } catch (error) {
        console.error("Interaction Error:", error);
      }
    });
  }

  private dispatchHelper = async (
    helperName: string,
    interaction: Interaction,
    ...args: any[]
  ) => {
    const manager = this.HandlerCollection.get("helper");
    const module = manager?.getHelper(helperName);

    if (!module || typeof module.execute !== "function") {
      this.log("ERR", `Helper '${helperName}' not found or invalid.`);
      return;
    }

    const factory = this.typeMap[module.type];
    if (!factory) {
      this.log(
        "ERR",
        `Unknown helper type '${module.type}' for '${helperName}'`
      );
      return;
    }

    try {
      const preparedArgs = factory(interaction, this.client, ...args);
      return await module.execute(...preparedArgs);
    } catch (err) {
      this.log("ERR", `Failed to execute helper '${helperName}': ${err}`);
    }
  };

  // ============================= Utilities ============================== //

  private setupDevErrorHandling() {
    process.on("uncaughtException", (err) =>
      this.log("FATAL", `Uncaught: ${err.message}`)
    );
    process.on("unhandledRejection", (reason) =>
      this.log("FATAL", `Rejection: ${reason}`)
    );
  }

  private log(
    tag: "SYS" | "HND" | "CMD" | "DEV" | "ERR" | "WARN" | "FATAL",
    message: string
  ) {
    const colors = {
      SYS: "\x1b[36m", // Cyan
      HND: "\x1b[35m", // Magenta
      CMD: "\x1b[32m", // Green
      DEV: "\x1b[33m", // Yellow
      ERR: "\x1b[31m", // Red
      WARN: "\x1b[33m", // Yellow
      FATAL: "\x1b[41m", // BgRed
    };
    const reset = "\x1b[0m";
    console.log(`${colors[tag]}[${tag}]${reset} ${message}`);
  }

  public login = () => {
    try {
      this.client.login(this.discordToken);
      this.client.once("clientReady", () => {
        this.log("SYS", `Logged in as ${this.client.user?.tag}`);
      });
    } catch (error) {
      this.log("FATAL", `Login failed: ${error}`);
    }
  };
}

export default Discrafter;
