import { readTextFile, writeTextFile, exists, createDir } from "@tauri-apps/api/fs";
import { join, appDataDir  } from "@tauri-apps/api/path";

const SETTINGS_FILE = "settings.json";
const SNIPPET_FILE = `snippets/snippets.json`;


async function getSettingsFilePath() {
    const appDir = await appDataDir();
    const settingsPath = await join(appDir, SETTINGS_FILE);
  
    if (!(await exists(settingsPath))) {
      console.log("Creating settings.json...");
      await writeTextFile(settingsPath, JSON.stringify({ collectionPath: null }, null, 2));
    }
  
    return settingsPath;
  }

async function getDbFilePath() {
    const appDir = await appDataDir();
    const dbPath = await join(appDir, SNIPPET_FILE);
  
    const dirExists = await exists(appDir);
    if (!dirExists) {
      console.log(`Creating AppData directory: ${appDir}`);
      await createDir(appDir, { recursive: true });
    }
  
    return dbPath;
  }

  export async function loadSettings() {
    try {
      const path = await getSettingsFilePath();
      const data = await readTextFile(path);
      return JSON.parse(data);
    } catch (error) {
      console.error("❌ Error loading settings:", error);
      return { collectionPath: null };
    }
  }
  
  export async function saveSettings(settings: any) {
    try {
      const path = await getSettingsFilePath();
      await writeTextFile(path, JSON.stringify(settings, null, 2));
      console.log("✅ Settings saved to:", path);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
    }
  }

export async function loadSnippets() {
    try {
      const path = await getDbFilePath();
      console.log("Checking for snippets file at:", path);
  
      if (!(await exists(path))) {
        console.log("No snippets file found, creating an empty one...");
        await writeTextFile(path, "[]");
        return [];
      }
  
      const data = await readTextFile(path);
      console.log("Snippets loaded successfully:", data);
      return JSON.parse(data);
    } catch (error) {
      console.error("❌ Error loading snippets:", error);
      return [];
    }
  }

export async function saveSnippets(snippets: any[]) {
    try {
      const path = await getDbFilePath();
      console.log("Saving snippets to:", path);
      await writeTextFile(path, JSON.stringify(snippets, null, 2));
      console.log("✅ Snippets saved successfully!");
    } catch (error) {
      console.error("❌ Error saving snippets:", error);
    }
  }

  