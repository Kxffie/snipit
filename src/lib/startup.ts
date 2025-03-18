import { os, fs, path } from "@tauri-apps/api";
import { useQuery } from "@tanstack/react-query";
import {
  getCollections,
  addCollection,
  Collection,
} from "@/lib/CollectionsService";
import { checkOllamaInstalled } from "@/lib/modelService";

export type DeviceInfo = {
  platform: string;
  version: string;
  arch: string;
  osDetails: string;
};

export async function getDeviceInfo(): Promise<DeviceInfo> {
  console.log("Starting device info check...");
  try {
    const platform = await os.platform();
    const version = await os.version();
    const arch = await os.arch();

    let osDetails = "";
    if (platform === "darwin") {
      osDetails = `macOS ${version}`;
    } else if (platform === "win32") {
      osDetails = `Windows ${version}`;
    } else if (platform === "linux") {
      osDetails = `Linux ${version}`;
    } else {
      osDetails = `Unknown OS: ${platform} ${version}`;
    }

    // Verify if Ollama is installed
    const isOllamaInstalled = await checkOllamaInstalled();
    if (!isOllamaInstalled) {
      console.warn("Ollama is not installed. Some features may not work properly.");
    } else {
      console.log("Ollama is installed.");
    }

    const snipitDir = await checkAndCreateDirectory();
    await initializeSettings(snipitDir, osDetails);

    console.log("Device info check completed successfully.");
    return { platform, version, arch, osDetails };
  } catch (error) {
    console.error("Device info check failed:", error);
    throw error;
  }
}

async function checkAndCreateDirectory(): Promise<string> {
  console.log("Checking for 'com.snipit.dev' directory...");
  try {
    let baseDir = await path.appDataDir();
    baseDir = baseDir.replace(/[\\/]+$/, "");
    console.log("Tauri appDataDir() returned:", baseDir);

    const lastSegment = baseDir.split(/[/\\]+/).pop()?.toLowerCase();
    let snipitDir: string;
    if (lastSegment !== "com.snipit.dev") {
      snipitDir = await path.join(baseDir, "com.snipit.dev");
    } else {
      snipitDir = baseDir;
    }

    console.log("Using SnipIt Directory Path:", snipitDir);
    const existsFlag = await fs.exists(snipitDir);
    if (!existsFlag) {
      console.log("'com.snipit.dev' directory not found. Creating it now...");
      await fs.createDir(snipitDir, { recursive: true });
      console.log("'com.snipit.dev' directory created successfully.");
    } else {
      console.log("'com.snipit.dev' directory already exists.");
    }
    return snipitDir;
  } catch (error) {
    console.error("Error checking/creating 'com.snipit.dev' directory:", error);
    throw error;
  }
}

async function initializeSettings(snipitDir: string, osDetails: string): Promise<void> {
  console.log("Initializing settings.json...");
  const settingsPath = await path.join(snipitDir, "settings.json");
  const defaultCollectionPath = await path.join(snipitDir, "snippets");

  try {
    const settingsExists = await fs.exists(settingsPath);
    let existingSettings: any = {};

    if (settingsExists) {
      try {
        existingSettings = JSON.parse(await fs.readTextFile(settingsPath));
      } catch (error) {
        console.error("Error parsing settings.json. Resetting file.");
        existingSettings = {};
      }
    }

    let updated = false;

    // Ensure required fields exist
    if (!existingSettings.os) {
      existingSettings.os = osDetails;
      console.log("Added missing 'os' field.");
      updated = true;
    }
    if (!existingSettings.firstStartup) {
      existingSettings.firstStartup = new Date().toISOString();
      console.log("Added missing 'firstStartup' field.");
      updated = true;
    }
    if (!existingSettings.collectionPath) {
      existingSettings.collectionPath = defaultCollectionPath;
      console.log("Added default collectionPath.");
      updated = true;
    }
    if (!existingSettings.selectedModel) {
      existingSettings.selectedModel = "deepseek-r1:7b"; // Default model
      console.log("Added default selected model.");
      updated = true;
    }
    if (!existingSettings.telemetry) {
      existingSettings.telemetry = { usage: true, errorReports: false };
      console.log("Added default telemetry settings.");
      updated = true;
    }
    if (!Array.isArray(existingSettings.collections)) {
      existingSettings.collections = [];
      console.log("Reset collections to an empty array.");
      updated = true;
    }

    // Ensure the default collection exists
    const defaultCollection: Collection = {
      id: "default",
      path: defaultCollectionPath,
      name: "Default Collection",
    };
    if (!existingSettings.collections.some((col: Collection) => col.id === defaultCollection.id)) {
      console.log("Default collection not found. Adding...");
      await fs.createDir(defaultCollectionPath, { recursive: true });
      existingSettings.collections.push(defaultCollection);
      updated = true;
    }

    if (updated) {
      await fs.writeTextFile(settingsPath, JSON.stringify(existingSettings, null, 2));
      console.log("Updated settings.json with missing fields.");
    } else {
      console.log("settings.json is already up to date.");
    }

    console.log("Settings initialization complete.");
  } catch (error) {
    console.error("Error initializing settings.json:", error);
    throw error;
  }
}


export function useDeviceInfo() {
  return useQuery<DeviceInfo>({
    queryKey: ["deviceInfo"],
    queryFn: getDeviceInfo,
  });
}
