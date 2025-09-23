import { Collection } from "discord.js";
import { glob } from "glob";
import path from "path";
import { helperTemplate } from "../template/helper.template.js";

class HelperManager {
  private helperCollection = new Collection<string, helperTemplate>();

  public init = async (helperDirPath: string) => {
    const helperDir = path
      .join(helperDirPath, "/**/*.{ts,js}")
      .replace(/\\/g, "/");
    const files = await glob(helperDir);

    for (const file of files) {
      const filePath = `file://${file.replace(/\\/g, "/")}`;
      const helperModule = await import(`${filePath}?update=${Date.now()}`);
      const helper = helperModule.default;

      if (!helper?.name || typeof helper?.execute !== "function") {
        console.warn(`[WARN] Skipping invalid helper file: ${file}`);
        continue;
      }

      this.helperCollection.set(helper.name, helper);
      console.log(`[HELPER] Loaded helper: ${helper.name}`);
    }
  };

  public getHelper = (helperName: string): helperTemplate | undefined => {
    return this.helperCollection.get(helperName);
  };
}

export default HelperManager;
