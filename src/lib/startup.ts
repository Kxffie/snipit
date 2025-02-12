import { os, fs, path } from "@tauri-apps/api";
import { CollectionsService, Collection } from "@/lib/CollectionsService";

export async function getDeviceInfo() {
  console.log("🔹 Starting device info check...");

  try {
    const platform = await os.platform();
    const version = await os.version();
    const arch = await os.arch();

    console.log(`✅ Platform detected: ${platform}`);
    console.log(`✅ OS Version: ${version}`);
    console.log(`✅ Architecture: ${arch}`);

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

    console.log(`📌 OS Details: ${osDetails}`);

    // Ensure the correct directory
    const snipitDir = await checkAndCreateDirectory();

    // Initialize settings
    await initializeSettings(snipitDir, osDetails);

    console.log("✅ Device info check completed successfully.");

    return {
      platform,
      version,
      arch,
      osDetails,
    };
  } catch (error) {
    console.error("❌ Device info check failed:", error);
    throw error;
  }
}

async function checkAndCreateDirectory() {
  console.log("🔹 Checking for 'com.snipit.dev' directory...");

  try {
    let baseDir = await path.appDataDir();
    // Remove any trailing slash, just in case
    baseDir = baseDir.replace(/[\\/]+$/, "");

    // Log to see exactly what Tauri returns
    console.log("📌 Tauri appDataDir() returned:", baseDir);

    // Grab the last segment of that path
    const lastSegment = baseDir.split(/[/\\]+/).pop()?.toLowerCase();

    // If the last folder name is NOT "com.snipit.dev", then append it
    let snipitDir: string;
    if (lastSegment !== "com.snipit.dev") {
      snipitDir = await path.join(baseDir, "com.snipit.dev");
    } else {
      // It's already the correct folder
      snipitDir = baseDir;
    }

    console.log("📌 Using SnipIt Directory Path:", snipitDir);

    const exists = await fs.exists(snipitDir);
    if (!exists) {
      console.log("⚠️ 'com.snipit.dev' directory not found. Creating it now...");
      await fs.createDir(snipitDir, { recursive: true });
      console.log("✅ 'com.snipit.dev' directory created successfully.");
    } else {
      console.log("✅ 'com.snipit.dev' directory already exists.");
    }

    return snipitDir;
  } catch (error) {
    console.error("❌ Error while checking/creating 'com.snipit.dev' directory:", error);
    throw error;
  }
}

async function initializeSettings(snipitDir: string, osDetails: string) {
  console.log("🔹 Initializing settings.json...");

  const settingsPath = await path.join(snipitDir, "settings.json");
  const defaultCollectionPath = await path.join(snipitDir, "snippets");

  try {
    const settingsExists = await fs.exists(settingsPath);
    if (!settingsExists) {
      console.log("⚠️ settings.json not found. Creating with default values...");
    
      const initialSettings = {
        os: osDetails,
        firstStartup: new Date().toISOString(),
        collections: [],
        telemetry: {
          usage: true,
          errorReports: false,
          // add more toggles heres
        },
      };
      await fs.writeTextFile(settingsPath, JSON.stringify(initialSettings, null, 2));
      console.log("✅ settings.json created successfully.");
    } else {
      // If settings.json exists, ensure telemetry is not missing
      const existingSettings = JSON.parse(await fs.readTextFile(settingsPath));
      if (!("telemetry" in existingSettings)) {
        existingSettings.telemetry = {
          usage: true,
          errorReports: false,
        };
        await fs.writeTextFile(settingsPath, JSON.stringify(existingSettings, null, 2));
        console.log("✅ Added default telemetry settings.");
      }
    }

    // Ensure collections exist in settings
    await CollectionsService.ensureCollectionsExist();
    let collections = await CollectionsService.getCollections();

    if (!Array.isArray(collections)) {
      console.warn("⚠️ collections is not an array. Resetting to an empty array.");
      collections = [];
    }

    // Ensure the default "snippets" collection exists
    const defaultCollection: Collection = {
      id: "default",
      path: defaultCollectionPath,
      name: "Default Collection",
    };

    if (!collections.some((col) => col.id === defaultCollection.id)) {
      console.log("⚠️ Default collection not found. Adding...");
      await fs.createDir(defaultCollectionPath, { recursive: true });
      await CollectionsService.addCollection(defaultCollection);
      console.log("✅ Default collection added successfully.");
    } else {
      console.log("✅ Default collection already exists.");
    }

    console.log("✅ Settings initialization complete.");
  } catch (error) {
    console.error("❌ Error initializing settings.json:", error);
    throw error;
  }

  
}
