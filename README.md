# ChordJS

## Overview

ChordJS is a framework built on top of Discord.js. This framework was created with the goal of making Discord bot development easier and more structured. Adapting an opinionated coding style and convention system, ChordJS enforces consistency in how commands, events, and configurations are written. By doing so, it reduces ambiguity, improves readability, and helps developers focus more on functionality rather than boilerplate.

## Installation

- Direct from GitHub

  ```js
  npm i https://github.com/Danang-Bahtiar/ChordJS.git
  ```

- From NPM Registry

  ```js
  npm i chordjs
  ```

## Usage

1. Create `chordjs.config.js` in the project root:

   ```js
   // example chordjs.config.js
   import { defineConfig } from "chordjs";
   import { GatewayIntentBits } from "discord.js";

   const config = defineConfig({
        core: {
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
            clientId: "your-client-id",
            discordToken: "your-discord-token",
            ownerId: "your-bot-owner-id-or-your-user-id"
        },
        development: {
            developmentMode: true;
            developmentGuildId?: "your-guild-id";
        },
        slashCommand: {
            useDefaultHandler: true,
            customDirPath: "./src/slashCommands",
            guilds: ["guild-id-1", "guild-id-2"]
        },
        event: {
            useDefaultHandler: true,
            customDirPath: "./src/events"
        },
        custom: {
            useDefaultInteractionEvent: true,
        },
    });

   export default config;
   ```

2. `index.js`

   ```js
   import { ChordJS } from "chordjs";

   const bot = ChordJS.create();
   bot.login();
   ```

3. Registering SlashCommand (if didn't provide guildId)

   ```js
   // call the following if you didnt provide guildId in the config.
   // if you didnt call this, your bot have no slashCommand.
   bot.useHandler("slashCommand", "registerCommands");
   ```

4. Creating SlashCommand

   ```js
   // src/command/ping.js
   import { ChordJS } from "chordjs";
   import { SlashCommandBuilder } from "discord.js";

   export default ChordJS.SlashCommand({
     data: new SlashCommandBuilder().setName("ping").setDescription("Pong!!"),
     execute: async (client, interaction) => {
       //your logic here
     },
   });
   ```
