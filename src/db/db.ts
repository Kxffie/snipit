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
    const appDir = await appDataDir(); // Get the system AppData path
    const dbPath = await join(appDir, SNIPPET_FILE);
  
    // ✅ Ensure directory exists before writing
    const dirExists = await exists(appDir);
    if (!dirExists) {
      console.log(`Creating AppData directory: ${appDir}`);
      await createDir(appDir, { recursive: true });
    }
  
    return dbPath;
  }

// ✅ Ensure `src/db/` directory exists
async function ensureDbExists() {
    const path = await join(await appDataDir(), SNIPPET_FILE);
    if (!(await exists(path))) {
      await writeTextFile(path, "[]"); // Create empty JSON array
    }
    return path;
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
  
  // ✅ Save Settings
  export async function saveSettings(settings: any) {
    try {
      const path = await getSettingsFilePath();
      await writeTextFile(path, JSON.stringify(settings, null, 2));
      console.log("✅ Settings saved to:", path);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
    }
  }

// ✅ Load Snippets from JSON File
export async function loadSnippets() {
    try {
      const path = await getDbFilePath();
      console.log("Checking for snippets file at:", path);
  
      if (!(await exists(path))) {
        console.log("No snippets file found, creating an empty one...");
        await writeTextFile(path, "[]"); // Create an empty JSON array
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

// ✅ Save Snippets to JSON File
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

// ✅ Delete a Snippet
export async function deleteSnippet(id: number) {
  const snippets = await loadSnippets();
  const updatedSnippets = snippets.filter((s) => s.id !== id);
  await saveSnippets(updatedSnippets);
}

// ✅ Update (Edit) a Snippet
export async function updateSnippet(updatedSnippet: any) {
  const snippets = await loadSnippets();
  const index = snippets.findIndex((s) => s.id === updatedSnippet.id);
  if (index !== -1) {
    snippets[index] = updatedSnippet;
    await saveSnippets(snippets);
  }
}

// ✅ Add a New Snippet
export async function addSnippet(newSnippet: any) {
  const snippets = await loadSnippets();
  newSnippet.id = snippets.length ? Math.max(...snippets.map((s) => s.id)) + 1 : 1;
  snippets.push(newSnippet);
  await saveSnippets(snippets);
}
