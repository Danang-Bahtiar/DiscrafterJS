import { Client, Interaction } from "discord.js";

export interface ExtendedClient extends Client {
    dispatchHelper?: (helperName: string, interaction: Interaction, ...args:[any]) => Promise<any>;
}