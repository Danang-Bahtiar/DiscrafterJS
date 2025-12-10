import { Client, Interaction } from "discord.js";
import { AxiosResult } from "./Rheos.types.js";

export interface ExtendedClient extends Client {
    dispatchHelper?: (helperName: string, interaction: Interaction, ...args:[any]) => Promise<any>;
    executeBulkAxiosCalls?: (priority: number) => Promise<Map<string, any> | null>;
    executeSingleAxiosCall?: (name: string) => Promise<AxiosResult>;
    getRheosApp?: () => any;
}