import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import type { DiscrafterConfig } from "../config/discrafter.config.js";

export async function loadConfig(): Promise<DiscrafterConfig> {
  const fullPath = path.resolve(process.cwd(), "discrafter.config.js");

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Discrafter config not found at: ${fullPath}`);
  }

  const module = await import(pathToFileURL(fullPath).href);
  return (module.default || module) as DiscrafterConfig;
}

