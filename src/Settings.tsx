import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCollections,
  addCollection,
  removeCollection,
  Collection,
} from "@/lib/CollectionsService";
import { loadSettings } from "@/db/db";
import { os, app, dialog, path as tauriPath } from "@tauri-apps/api";
import {
  Cable,
  Plug,
  Palette,
  Clipboard,
  Container,
  FolderOpen,
  Library,
  Trash,
  X,
  Check,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

// Sidebar options for settings navigation
type SidebarOption = { type: "item"; name: string; icon: JSX.Element } | { type: "separator" };

const settingsOptions: SidebarOption[] = [
  { type: "item", name: "Themes", icon: <Palette className="w-4 h-4" /> },
  { type: "item", name: "Connections", icon: <Plug className="w-4 h-4" /> },
  { type: "item", name: "Collections", icon: <Container className="w-4 h-4" /> },
  { type: "separator" },
  { type: "item", name: "About", icon: <Library className="w-4 h-4" /> },
  { type: "item", name: "Telemetry", icon: <Cable className="w-4 h-4" /> },
  { type: "separator" },
  { type: "item", name: "Trash", icon: <Trash className="w-4 h-4" /> },
  { type: "item", name: "Test", icon: <Clipboard className="w-4 h-4" /> },
];

const trashClearOptions = [
  { label: "Never", value: "never" },
  { label: "Every Hour", value: "1h" },
  { label: "Every 12 Hours", value: "12h" },
  { label: "Every Day", value: "24h" },
  { label: "Every Week", value: "168h" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mb-4">{description}</p>
      {children}
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("Themes");
  const [newCollection, setNewCollection] = useState<{ name: string; path: string } | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch collections using TanStack Query.
  const {
    data: collections = [],
    isLoading: isLoadingCollections,
  } = useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: getCollections,
  });

  // Fetch system and app info.
  const { data: systemInfo } = useQuery({
    queryKey: ["systemInfo"],
    queryFn: async () => {
      const settings = await loadSettings();
      return {
        appDirectory: await tauriPath.appDataDir(),
        osDetails: `${await os.platform()} ${await os.version()}`,
        arch: await os.arch(),
        appVersion: await app.getVersion(),
        tauriVersion: await app.getTauriVersion(),
        firstStartup: settings?.firstStartup
          ? new Date(settings.firstStartup).toLocaleString()
          : "",
      };
    },
  });

  // Mutation for adding a new collection.
  const addCollectionMutation = useMutation({
    mutationFn: async (collection: { name: string; path: string }) => {
      return await addCollection({
        id: crypto.randomUUID(),
        name: collection.name,
        path: collection.path,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setNewCollection(null);
      toast({ title: "Collection Added", description: "New collection added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add collection.", variant: "destructive" });
    },
  });

  // Mutation for removing a collection.
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await removeCollection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setCollectionToDelete(null);
      toast({ title: "Collection Removed", description: "Collection has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove collection.", variant: "destructive" });
    },
  });

  const handleSelectFolder = async () => {
    const selected = await dialog.open({ directory: true });
    if (selected && typeof selected === "string") {
      setNewCollection((prev) => ({ ...prev!, path: selected }));
    }
  };

  // Render each section based on the active selection.
  const renderSection = () => {
    switch (activeSection) {
      case "Themes":
        return (
          <Section title="Themes" description="Customize your theme and appearance settings.">
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
            >
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
                <Button size="icon" variant="outline" onClick={() => addCollectionMutation.mutate(newCollection!)}>
                  <Check className="w-5 h-5 text-green-600" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => setNewCollection(null)}>
                  <X className="w-5 h-5 text-red-600" />
                </Button>
              </div>
            )}
      
            {isLoadingCollections ? (
              <p className="mt-3">Loading...</p>
            ) : (
              <div className="mt-4 space-y-2">
                {collections.map((col: Collection) => (
                  <div
                    key={col.id}
                    className="p-3 bg-secondary text-secondary-foreground rounded-md shadow-sm flex items-center justify-between"
                  >
                    <div className="flex flex-col w-[80%]">
                      <span className="font-medium truncate">{col.name}</span>
                      <span className="text-xs truncate text-muted-foreground">{col.path}</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setCollectionToDelete(col)}>
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
                          <AlertDialogAction onClick={() => deleteCollectionMutation.mutate(col.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </Section>
        );

      case "About":
        return (
          <Section title="About" description="Information about the app and your device.">
            <div className="space-y-4 w-96">
              <div>
                <h3 className="text-md font-semibold mb-2 text-muted-foreground">System Information</h3>
                <Separator className="my-2" />
                <p>
                  <strong>Operating System:</strong> {systemInfo?.osDetails || "Loading..."}
                </p>
                <p>
                  <strong>Architecture:</strong> {systemInfo?.arch || "Loading..."}
                </p>
                <p>
                  <strong>First Opened:</strong> {systemInfo?.firstStartup || "Loading..."}
                </p>
              </div>
              <div>
                <h3 className="text-md font-semibold mb-2 text-muted-foreground">App Information</h3>
                <Separator className="my-2" />
                <p>
                  <strong>App Version:</strong> {systemInfo?.appVersion || "Loading..."}
                </p>
                <p>
                  <strong>Tauri Version:</strong> {systemInfo?.tauriVersion || "Loading..."}
                </p>
              </div>
              <div>
                <h3 className="text-md font-semibold mb-2 text-muted-foreground">Storage Paths</h3>
                <Separator className="my-2" />
                <p>
                  <strong>App Directory:</strong> {systemInfo?.appDirectory || "Loading..."}
                </p>
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

      case "Telemetry":
        return (
          <Section title="Telemetry" description="Opt in or out of telemetry settings.">
            <h2>This section displays telemetry options.</h2>
            <p>No telemetry is implemented yet.</p>
          </Section>
        );

        case "Test":
          return (
            <Section title="Test" description="A sandbox for various settings.">
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() =>
                    toast({ title: "Info", description: "This is an info toast." })
                  }
                >
                  Show Info Toast
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    toast({
                      title: "Error",
                      description: "This is an error toast.",
                      variant: "destructive",
                    })
                  }
                >
                  Show Error Toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast({ title: "Success", description: "This is a success toast." })
                  }
                >
                  Show Success Toast
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => console.log("Test button clicked!")}
                >
                  Log to Console
                </Button>
              </div>
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
          {settingsOptions.map((option, idx) =>
            option.type === "separator" ? (
              <Separator key={`sep-${idx}`} className="my-2" />
            ) : (
              <Button
                key={option.name}
                variant={activeSection === option.name ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection(option.name)}
              >
                {option.icon}
                <span className="ml-2">{option.name}</span>
              </Button>
            )
          )}
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{renderSection()}</main>
    </div>
  );
}
