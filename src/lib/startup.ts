import { os, fs, path } from "@tauri-apps/api";
import { useQuery } from "@tanstack/react-query";
import { 
  verifyCollectionsExist, 
  getCollections, 
  addCollection, 
  Collection 
} from "@/lib/CollectionsService";

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

    // Verify and create directory
    const snipitDir = await checkAndCreateDirectory();
    // Initialize settings with default values if needed
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
    const exists = await fs.exists(snipitDir);
    if (!exists) {
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
    if (!settingsExists) {
      console.log("settings.json not found. Creating with default values...");
      const initialSettings = {
        os: osDetails,
        firstStartup: new Date().toISOString(),
        collectionPath: defaultCollectionPath, // <-- Set default collection path here!
        collections: [],
        telemetry: {
          usage: true,
          errorReports: false,
        },
      };
      await fs.writeTextFile(settingsPath, JSON.stringify(initialSettings, null, 2));
      console.log("settings.json created successfully.");
    } else {
      const existingSettings = JSON.parse(await fs.readTextFile(settingsPath));
      let updated = false;
      if (!existingSettings.collectionPath) {
        existingSettings.collectionPath = defaultCollectionPath;
        console.log("Added default collectionPath to settings.");
        updated = true;
      }
      if (!("telemetry" in existingSettings)) {
        existingSettings.telemetry = {
          usage: true,
          errorReports: false,
        };
        console.log("Added default telemetry settings.");
        updated = true;
      }
      if (updated) {
        await fs.writeTextFile(settingsPath, JSON.stringify(existingSettings, null, 2));
      }
    }

    // Ensure collections exist in settings.
    await getCollections(); // or your verify function
    let collections = await getCollections();
    if (!Array.isArray(collections)) {
      console.warn("collections is not an array. Resetting to an empty array.");
      collections = [];
    }

    const defaultCollection: Collection = {
      id: "default",
      path: defaultCollectionPath,
      name: "Default Collection",
    };

    if (!collections.some((col: Collection) => col.id === defaultCollection.id)) {
      console.log("Default collection not found. Adding...");
      await fs.createDir(defaultCollectionPath, { recursive: true });
      await addCollection(defaultCollection);
      console.log("Default collection added successfully.");
    } else {
      console.log("Default collection already exists.");
    }

    console.log("Settings initialization complete.");
  } catch (error) {
    console.error("Error initializing settings.json:", error);
    throw error;
  }
}

// TanStack Query hook for device info
export function useDeviceInfo() {
  return useQuery<DeviceInfo>({
    queryKey: ["deviceInfo"],
    queryFn: getDeviceInfo,
  });
}
