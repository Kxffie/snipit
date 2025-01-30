import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug, Palette, Clipboard, Container, FolderOpen } from "lucide-react";

const settingsOptions = [
    { name: "Themes", icon: <Palette className="w-4 h-4" /> },
    { name: "Connections", icon: <Plug className="w-4 h-4" /> },
    { name: "Collections", icon: <Container className="w-4 h-4" /> },
    { name: "Test", icon: <Clipboard className="w-4 h-4" /> },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("Themes");
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-full">
      <aside className="w-64 p-4 border-r">
        <h2 className="text-lg font-bold mb-4">Settings</h2>
        <div className="space-y-2">
          {settingsOptions.map((option) => (
            <Button
              key={option.name}
              variant={activeSection === option.name ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection(option.name)}
            >
              {option.icon}
              <span className="ml-2">{option.name}</span>
            </Button>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-6">
      {activeSection === "Themes" && (
        <div>
            <h1 className="text-2xl font-bold">Themes</h1>
            <p className="mb-4">Customize your theme and appearance settings.</p>

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
        </div>
        )}



        {activeSection === "Connections" && (
          <div>
            <h1 className="text-2xl font-bold">Connections</h1>
            <p>Manage API integrations, database connections, and more.</p>
          </div>
        )}



        {activeSection === "Collections" && (
        <div>
            <h1 className="text-2xl font-bold">Collections</h1>
            <p className="mb-4">Select a folder to store your collections.</p>

            <div className="relative w-96">
            <Button 
                variant="outline"
                className="absolute left-0 h-full px-3 w-26 rounded-r-none"
            >
                <FolderOpen className="w-4 h-4 mr-1" /> Choose
            </Button>

            <Input 
                type="text" 
                className="pl-28"
                placeholder="No folder selected"
                readOnly 
            />
            </div>
        </div>
        )}

        


        {activeSection === "Test" && (
          <div>
            <h1 className="text-2xl font-bold">Test</h1>
            <p>Basically a boilerplate for me.</p>
          </div>
        )}
      </main>
    </div>
  );
}
