# DiscrafterJS
[![npm version](https://img.shields.io/npm/v/@dan_koyuki/discrafterjs.svg)](https://www.npmjs.com/package/@dan_koyuki/discrafterjs)
[![GitHub stars](https://img.shields.io/github/stars/Danang-Bahtiar/DiscrafterJS.svg?style=social)](https://github.com/Danang-Bahtiar/DiscrafterJS)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


## Overview

DiscrafterJS is a framework built on top of Discord.js. This framework was created with the goal of making Discord bot development easier and more structured. Adapting an opinionated coding style and convention system, DiscrafterJS enforces consistency in how commands, events, and configurations are written. By doing so, it reduces ambiguity, improves readability, and helps developers focus more on functionality rather than boilerplate.

## Features
- 🔧 Opinionated structure for commands, events, and helpers
- ⚡ CLI scaffolder via `npx create-discrafter-bot`
- 📦 TypeScript support out of the box (but feels like JS)
- 🔌 Easy to extend with your own handlers
- 🛠️ Default helpers dispatcher (optional)


## Installation

- Direct from GitHub

  ```js
  npm i https://github.com/Danang-Bahtiar/DiscrafterJS.git
  ```

- From NPM Registry

  ```js
  npm i @dan_koyuki/discrafterjs
  ```

- Using Scaffolder

  ```js
  npx create-discrafter-bot
  ```

## Usage

1. Create `discrafter.config.js` in the project root:

   ```js
   // example discrafter.config.js
   import { defineConfig } from "@dan_koyuki/discrafterjs";
   import { GatewayIntentBits } from "discord.js";
   
   const config = defineConfig({
    core: {
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      clientId: "your-client-id",
      discordToken: "your-discord-token",
      ownerId: "your-bot-owner-id-or-your-user-id"
    },
    development: {
      developmentMode: true,
      developmentGuildId: "your-guild-id",
    },
    slashCommand: {
       useDefaultHandler: true,
       // the default handler of slashCommand will search and load file from customDirPath if given.
       customDirPath: "./src/slashCommands",
       globalRegister: false
       guilds: ["guild-id-1", "guild-id-2"]},
    event: {
       useDefaultHandler: true,
       // the default handler of event will search and load file from customDirPath if given.
       customDirPath: "./src/events"
    },
    helper: {
       useDefaultHandler: true,
       // the default handler of helperFunction will search and load file from customDirPath if given.
       customDirPath: "./src/helpers"
    },
    custom: {
       useDefaultInteractionEvent: true,
    },
   });

   export default config;
   ```

2. `index.js`

   ```js
   import { Discrafter } from "@dan_koyuki/discrafterjs";

   const bot = Discrafter.create();
   bot.login();

   export default bot;
   ```

3. Creating SlashCommand files

   ```js
   // src/command/ping.js
   import { Discrafter } from "@dan_koyuki/discrafterjs";
   import { SlashCommandBuilder } from "discord.js";
   import {bot} from "./index.js"

   export default Discrafter.SlashCommand({
     data: new SlashCommandBuilder().setName("register").setDescription("Register a player!!"),
     execute: async (client, interaction) => {
       //your logic here
      bot.dispatchHelper("register", interaction);
     },
   });
   ```

4. Creating Event files

    ```js
    // src/events/clientReady.js
    import { Discrafter } from "@dan_koyuki/discrafterjs"

    export default Discrafter.Event({
      name: "clientReady",
      once: true,
      execute: async () => {
        console.log(`Bot logged in successfully as ${this.client.user?.tag}.`);
      }
    })
    ```

5. Creating Helper Function files

    ```js
    // src/helpers/register.js

    import {Discrafter} from "@dan_koyuki/discrafterjs"

    export default Discrafter.Helper({
      name: "register",
      type: "Interaction",
      execute: async (interaction) => {
        console.log("Hello, im here to help abstracting register function");
      }
    })
    ```

## FAQ
1. I want to add my own handlers, how do i do that?
    ```js
    "As for current version, the framework doesnt handle the case. However, you can simply turn off the useDefaultHandler on any handler you dont want and call your own handler after creating the bot."
    ```
   
## Roadmap
- v0.3: Documentation & helper skeleton
- v0.3.5: Colorized logging (might or might not be skipped or moved)
- v0.4: MongoDB Configuration Support
- v0.5: Plugin/extension support (e.g., RPGTamerDiscrafter)
  
## Contributing
Contributions, issues, and feature requests are welcome!  
Feel free to open an issue or PR on [GitHub](https://github.com/Danang-Bahtiar/DiscrafterJS).

## License
MIT © [Dan](https://github.com/Danang-Bahtiar)