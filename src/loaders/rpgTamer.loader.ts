import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";

export const rpgTamerLoader = async () => {
    const fullPath = path.resolve(process.cwd(), "rpgTamer.config.js");

    if (!fs.existsSync(fullPath)) {
        throw new Error(`RPG Tamer plugin config not found at: ${fullPath}`);
    }

    const module = await import(pathToFileURL(fullPath).href);
    return (module.default || module);
}