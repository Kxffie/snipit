import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug, Palette, Clipboard, Container, FolderOpen, Library, Folder } from "lucide-react";
import { loadSettings, saveSettings } from "@/db/db";
import { invoke } from "@tauri-apps/api/tauri";
import { dialog } from "@tauri-apps/api";
import { path as tauriPath } from "@tauri-apps/api";

const settingsOptions = [
  { name: "Themes", icon: <Palette className="w-4 h-4" /> },
  { name: "Connections", icon: <Plug className="w-4 h-4" /> },
  { name: "Collections", icon: <Container className="w-4 h-4" /> },
  { name: "About", icon: <Library className="w-4 h-4" /> },
  { name: "Test", icon: <Clipboard className="w-4 h-4" /> },
];

export default function Settings() {
  const [collectionPath, setCollectionPath] = useState<string | null>(null);
  const [appDirectory, setAppDirectory] = useState<string>("");
  const [activeSection, setActiveSection] = useState("Themes");
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<{ os: string; firstStartup: string; collectionPath: string } | null>(null);

  useEffect(() => {
    loadSettings().then((settings) => {
      setSettings(settings);
      if (settings.collectionPath) {
        setCollectionPath(settings.collectionPath);
      }
    });

    // Fetch the App Directory
    tauriPath.appDataDir().then((dir) => {
      setAppDirectory(dir);
    });
  }, []);

  const handleFolderOpen = async (path: string) => {
    try {
      await invoke("open_folder", { path });  // Calling the Rust command
    } catch (error) {
      console.error("Failed to open folder:", error);
    }
  };
  

  const handleChangeCollectionPath = async () => {
    try {
      const selected = await dialog.open({ directory: true });
      if (selected && typeof selected === "string") {
        const updatedSettings = { ...settings, collectionPath: selected };
        await saveSettings(updatedSettings);
        setSettings(updatedSettings);
        setCollectionPath(selected);
      }
    } catch (error) {
      console.error("Failed to change collection path:", error);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "Themes":
        return (
          <Section title="Themes" description="Customize your theme and appearance settings.">
            <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">☀️ Light</SelectItem>
                <SelectItem value="dark">🌙 Dark</SelectItem>
                <SelectItem value="system">🖥 System</SelectItem>
              </SelectContent>
            </Select>
          </Section>
        );
      case "Connections":
        return <Section title="Connections" description="Manage API integrations, database connections, and more." />;
      case "Collections":
        return (
          <Section title="Collections" description="Select a folder to store your collections.">
            <div className="relative w-96 flex items-center space-x-2">
              <Button variant="outline" onClick={handleChangeCollectionPath}>
                <FolderOpen className="w-4 h-4 mr-1" /> Choose Folder
              </Button>
              <Input type="text" className="flex-1" placeholder="No folder selected" value={collectionPath || ""} readOnly />
            </div>
          </Section>
        );
      case "About":
        return (
          <Section title="About" description="Information about the app and your device.">
            <div className="relative w-96 space-y-2">
              {settings ? (
                <>
                  <p><strong>OS:</strong> {settings.os}</p>
                  <p><strong>First Startup:</strong> {new Date(settings.firstStartup).toLocaleString()}</p>
                  <div className="flex items-center space-x-2">
                    <p><strong>Collection Directory:</strong> {settings.collectionPath}</p>
                    <Button size="sm" variant="outline" onClick={() => handleFolderOpen(settings.collectionPath)}>
                      <Folder className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p><strong>App Directory:</strong> {appDirectory}</p>
                    <Button size="sm" variant="outline" onClick={() => handleFolderOpen(appDirectory)}>
                      <Folder className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <p>Loading settings information...</p>
              )}
            </div>
          </Section>
        );
      case "Test":
        return <Section title="Test" description="Basically a boilerplate for me." />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-64 p-4 border-r">
        <h2 className="text-lg font-bold mb-4">Settings</h2>
        <div className="space-y-2">
          {settingsOptions.map(({ name, icon }) => (
            <Button
              key={name}
              variant={activeSection === name ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection(name)}
            >
              {icon}
              <span className="ml-2">{name}</span>
            </Button>
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6">{renderSection()}</main>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mb-4">{description}</p>
      {children}
    </div>
  );
}
