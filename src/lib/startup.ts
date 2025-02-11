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

    // Check and create the necessary directories
    const snipitDir = await checkAndCreateDirectory();

    // Initialize settings.json & collections
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
    const appDataDir = await path.appDataDir();
    const snipitDir = `${appDataDir}com.snipit.dev/`;

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

  const settingsPath = `${snipitDir}settings.json`;
  const defaultCollectionPath = `${snipitDir}snippets/`;

  try {
    const settingsExists = await fs.exists(settingsPath);

    if (!settingsExists) {
      console.log("⚠️ settings.json not found. Creating with default values...");

      const initialSettings = {
        os: osDetails,
        firstStartup: new Date().toISOString(),
        collections: [],
      };

      await fs.writeTextFile(settingsPath, JSON.stringify(initialSettings, null, 2));
      console.log("✅ settings.json created successfully.");
    }

    // Ensure collections exist in settings
    await CollectionsService.ensureCollectionsExist();
    let collections = await CollectionsService.getCollections();

    // 🔹 **Fix: Ensure `collections` is always an array**
    if (!Array.isArray(collections)) {
      console.warn("⚠️ `collections` is not an array. Resetting to an empty array.");
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
      await fs.createDir(defaultCollectionPath, { recursive: true }); // Ensure folder exists
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
