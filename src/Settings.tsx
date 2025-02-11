import { useState, useEffect } from "react";
import { CollectionsService, Collection } from "@/lib/CollectionsService";
import { loadSettings } from "./db/db";

import { os, app, dialog, path as tauriPath } from "@tauri-apps/api";

import { Plug, Palette, Clipboard, Container, FolderOpen, Library, Trash, X, Check } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "./components/ui/input";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const settingsOptions = [
  { name: "Themes", icon: <Palette className="w-4 h-4" /> },
  { name: "Connections", icon: <Plug className="w-4 h-4" /> },
  { name: "Collections", icon: <Container className="w-4 h-4" /> },
  { name: "About", icon: <Library className="w-4 h-4" /> },
  { name: "Trash", icon: <Trash className="w-4 h-4" /> },
  { name: "Test", icon: <Clipboard className="w-4 h-4" /> },
];

const trashClearOptions = [
  { label: "Never", value: "never" },
  { label: "Every Hour", value: "1h" },
  { label: "Every 12 Hours", value: "12h" },
  { label: "Every Day", value: "24h" },
  { label: "Every Week", value: "168h" },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("Themes");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [newCollection, setNewCollection] = useState<{ name: string; path: string } | null>(null);
  const { toast } = useToast();

  const [appDirectory, setAppDirectory] = useState<string>("");
  const [osDetails, setOsDetails] = useState<string>("");
  const [arch, setArch] = useState<string>("");
  const [appVersion, setAppVersion] = useState<string>("");
  const [tauriVersion, setTauriVersion] = useState<string>("");
  const [firstStartup, setFirstStartup] = useState<string>("");

  useEffect(() => {
    (async () => {
      setAppDirectory(await tauriPath.appDataDir());

      const platform = await os.platform();
      const version = await os.version();
      const architecture = await os.arch();
      setOsDetails(`${platform} ${version}`);
      setArch(architecture);

      setAppVersion(await app.getVersion());
      setTauriVersion(await app.getTauriVersion());

      const settings = await loadSettings();
      if (settings?.firstStartup) {
        setFirstStartup(new Date(settings.firstStartup).toLocaleString());
      }
    })();
  }, []);

  const handleSelectFolder = async () => {
    const selected = await dialog.open({ directory: true });
    if (selected && typeof selected === "string") {
      setNewCollection((prev) => ({ ...prev!, path: selected }));
    }
  };

  const handleConfirmAdd = async () => {
    if (!newCollection?.name || !newCollection.path) {
      toast({ title: "Error", description: "Please enter a name and select a folder.", variant: "destructive" });
      return;
    }

    const success = await CollectionsService.addCollection({
      id: crypto.randomUUID(),
      name: newCollection.name,
      path: newCollection.path,
    });

    if (success) {
      setCollections(await CollectionsService.getCollections());
      setNewCollection(null);
      toast({ title: "Collection Added", description: "New collection added successfully." });
    } else {
      toast({ title: "Already Exists", description: "This collection is already added.", variant: "destructive" });
    }
  };

  const handleCancelAdd = () => setNewCollection(null);

  const handleRemoveCollection = async () => {
    if (!collectionToDelete) return;

    try {
      const success = await CollectionsService.removeCollection(collectionToDelete.id);
      if (success) {
        setCollections(await CollectionsService.getCollections());
        toast({ title: "Collection Removed", description: "Collection has been removed." });
      }
    } catch (error) {
      console.error("Failed to remove collection:", error);
      toast({ title: "Error", description: "Failed to remove collection.", variant: "destructive" });
    }

    setCollectionToDelete(null);
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
        return (
          <Section title="Connections" description="Manage API integrations, database connections, and more.">
            <h2>This section is currently under development.</h2>
          </Section>
        );


      case "Collections":
        return (
          <Section title="Collections" description="Manage multiple collection directories.">
            <Button variant="outline" onClick={() => setNewCollection({ name: "", path: "" })}>
              <FolderOpen className="w-4 h-4 mr-1" /> Add Collection
            </Button>

            {newCollection && (
              <div className="flex items-center gap-3 border p-2 rounded-md mt-3">
                <Input
                  type="text"
                  placeholder="Collection Name"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="text"
                  placeholder="Select Folder..."
                  value={newCollection.path}
                  onClick={handleSelectFolder}
                  readOnly
                  className="flex-1 cursor-pointer truncate"
                />
                <Button size="icon" variant="outline" onClick={handleConfirmAdd}>
                  <Check className="w-5 h-5 text-green-600" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleCancelAdd}>
                  <X className="w-5 h-5 text-red-600" />
                </Button>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {collections.length === 0 ? (
                <p className="text-muted-foreground">No collections added yet.</p>
              ) : (
                collections.map((col) => (
                  <div key={col.id} className="flex items-center justify-between border p-2 rounded-md">
                    <div className="text-sm flex items-center gap-2 w-5/6 overflow-hidden">
                      <span>{col.name}</span>
                      <Separator orientation="vertical" className="h-4 w-[1px] bg-border" />
                      <span className="truncate">{col.path}</span>
                    </div>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={() => setCollectionToDelete(col)}>
                          <Trash className="w-4 h-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The collection <b>{collectionToDelete?.name}</b> will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setCollectionToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRemoveCollection}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          </Section>
        );


      case "About":
        return (
        <Section title="About" description="Information about the app and your device.">
          <div className="space-y-4 w-96">
        
            {/* System Information */}
            <div>
              <h3 className="text-md font-semibold mb-2 text-muted-foreground">System Information</h3>
              <Separator className="my-2" />
              <p><strong>Operating System:</strong> {osDetails}</p>
              <p><strong>Architecture:</strong> {arch}</p>
              <p><strong>First Opened:</strong> {firstStartup}</p>
            </div>
        
            {/* App Information */}
            <div>
              <h3 className="text-md font-semibold mb-2 text-muted-foreground">App Information</h3>
              <Separator className="my-2" />
              <p><strong>App Version:</strong> {appVersion}</p>
              <p><strong>Tauri Version:</strong> {tauriVersion}</p>
            </div>
        
            {/* Storage Paths */}
            <div>
              <h3 className="text-md font-semibold mb-2 text-muted-foreground">Storage Paths</h3>
              <Separator className="my-2" />
              <p><strong>App Directory:</strong> {appDirectory}</p>
            </div>
        
          </div>
        </Section>
        );


      case "Trash":
        return (
          <Section title="Trash" description="Manage trash cleanup settings.">
            <Select defaultValue="never">
              <SelectTrigger>
                <SelectValue placeholder="Select Auto-Clear Interval" />
              </SelectTrigger>
              <SelectContent>
                {trashClearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>
        );


      case "Test":
        return (
          <Section title="Test" description="Basically a boilerplate for me.">
            <h2>This section is used for testing various settings.</h2>
          </Section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-64 flex-none p-4 border-r">
        <h2 className="text-md font-semibold mb-2 text-muted-foreground">Settings</h2>
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
      <main className="flex-1 p-6 overflow-auto">{renderSection()}</main>
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
