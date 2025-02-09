import { os, fs, path } from '@tauri-apps/api';
import { useToast } from "@/hooks/use-toast"; // Import ShadCN's toast

export async function getDeviceInfo() {
  const { toast } = useToast();
  console.log("Starting device info check...");

  try {
    const platform = await os.platform();
    const version = await os.version();
    const arch = await os.arch();

    console.log(`Platform detected: ${platform}`);
    console.log(`Version: ${version}`);
    console.log(`Architecture: ${arch}`);

    let osDetails = '';
    if (platform === 'darwin') {
      osDetails = `macOS ${version}`;
    } else if (platform === 'win32') {
      osDetails = `Windows ${version}`;
    } else if (platform === 'linux') {
      osDetails = `Linux ${version}`;
    } else {
      osDetails = `Unknown OS: ${platform} ${version}`;
    }

    console.log(`OS Details: ${osDetails}`);

    // Check and create the necessary directory
    const snipitDir = await checkAndCreateDirectory(toast);

    // Initialize settings.json
    await initializeSettings(snipitDir, osDetails, toast);

    toast({
      title: "Success",
      description: "Device info check completed successfully.",
    });

    return {
      platform,
      version,
      arch,
      osDetails,
    };
  } catch (error) {
    console.error("Device info check failed:", error);
    toast({
      title: "Error",
      description: "Device info check failed.",
      variant: "destructive",
    });
    throw error;
  }
}

async function checkAndCreateDirectory(toast: any) {
  console.log("Checking for 'com.snipit.dev' directory...");

  try {
    const appDataDir = await path.appDataDir();
    const snipitDir = `${appDataDir}`;

    const exists = await fs.exists(snipitDir);

    if (!exists) {
      console.log("'com.snipit.dev' directory not found. Creating it now...");
      await fs.createDir(snipitDir, { recursive: true });
      console.log("'com.snipit.dev' directory created successfully.");
      toast({
        title: "Directory Created",
        description: "'com.snipit.dev' directory has been created.",
      });
    } else {
      console.log("'com.snipit.dev' directory already exists.");
    }

    return snipitDir;
  } catch (error) {
    console.error("Error while checking/creating 'com.snipit.dev' directory:", error);
    toast({
      title: "Error",
      description: "Failed to create 'com.snipit.dev' directory.",
      variant: "destructive",
    });
    throw error;
  }
}

async function initializeSettings(snipitDir: string, osDetails: string, toast: any) {
  console.log("Initializing settings.json...");

  const settingsPath = `${snipitDir}settings.json`;
  const snippetsPath = `${snipitDir}snippets`;

  try {
    const settingsExists = await fs.exists(settingsPath);

    if (!settingsExists) {
      console.log("settings.json not found. Creating with default values...");

      const initialSettings = {
        os: osDetails,
        firstStartup: new Date().toISOString(),
        collectionPath: snippetsPath,
      };

      await fs.writeTextFile(settingsPath, JSON.stringify(initialSettings, null, 2));
      await fs.createDir(snippetsPath, { recursive: true }); // Ensure the snippets folder exists
      console.log("settings.json created successfully.");

      toast({
        title: "Settings Initialized",
        description: "settings.json has been created with default values.",
      });
    } else {
      console.log("settings.json found. Reading settings...");

      const settingsContent = await fs.readTextFile(settingsPath);
      const settings = JSON.parse(settingsContent);

      if (settings.collectionPath === null) {
        console.log("collectionPath is null. Setting to 'snippets' directory...");
        settings.collectionPath = snippetsPath;

        await fs.createDir(snippetsPath, { recursive: true }); // Ensure the snippets folder exists
        await fs.writeTextFile(settingsPath, JSON.stringify(settings, null, 2));
        console.log("collectionPath updated successfully.");

        toast({
          title: "Settings Updated",
          description: "collectionPath has been set to the snippets directory.",
        });
      } else {
        console.log(`collectionPath is set to: ${settings.collectionPath}`);
      }
    }
  } catch (error) {
    console.error("Error initializing settings.json:", error);
    toast({
      title: "Error",
      description: "Failed to initialize settings.json.",
      variant: "destructive",
    });
    throw error;
  }
}
