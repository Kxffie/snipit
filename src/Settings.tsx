import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug, Palette, Clipboard, Container, FolderOpen } from "lucide-react";
import { loadSettings, saveSettings } from "@/db/db";

const settingsOptions = [
  { name: "Themes", icon: <Palette className="w-4 h-4" /> },
  { name: "Connections", icon: <Plug className="w-4 h-4" /> },
  { name: "Collections", icon: <Container className="w-4 h-4" /> },
  { name: "Test", icon: <Clipboard className="w-4 h-4" /> },
];

export default function Settings() {
  const [collectionPath, setCollectionPath] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("Themes");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadSettings().then((settings) => settings.collectionPath && setCollectionPath(settings.collectionPath));
  }, []);

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
            <div className="relative w-96">
              <Button variant="outline" className="absolute left-0 h-full px-3 w-26 rounded-r-none">
                <FolderOpen className="w-4 h-4 mr-1" /> Choose
              </Button>
              <Input type="text" className="pl-28" placeholder="No folder selected" value={collectionPath || ""} readOnly />
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