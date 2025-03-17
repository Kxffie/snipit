import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator,
  SelectGroup,
} from "@/components/ui/select";
import { Plug, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveSettings } from "@/db/db";
import { checkOllamaInstalled, checkOllamaVersion, listModels } from "@/lib/modelService";

export const settingsMeta = {
  name: "Connections",
  description: "Manage API integrations, database connections, and more.",
  icon: <Plug className="w-4 h-4" />,
  group: "Main",
  order: 2,
  visible: true,
};

export default function Connections() {
  const { toast } = useToast();
  const [isOllamaInstalled, setIsOllamaInstalled] = useState(false);
  const [ollamaVersion, setOllamaVersion] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [modelGroups, setModelGroups] = useState<
    { group: string; models: string[] }[]
  >([]);

  // Helper to format version string: capitalize "ollama"
  const formatVersion = (version: string) =>
    version.replace(/^ollama/i, "Ollama");

  // On mount, try to load a saved model from localStorage.
  useEffect(() => {
    const saved = localStorage.getItem("selectedModel");
    if (saved) {
      setSelectedModel(saved);
    }
  }, []);

  useEffect(() => {
    checkOllamaInstalled()
      .then(setIsOllamaInstalled)
      .catch(() => setIsOllamaInstalled(false));
  }, []);

  useEffect(() => {
    if (isOllamaInstalled) {
      checkOllamaVersion().then((version) => {
        setOllamaVersion(version || "Unknown");
      });
    }
  }, [isOllamaInstalled]);

  useEffect(() => {
    // List models from the library folder
    listModels()
      .then(setModelGroups)
      .catch((err) => {
        console.error("Error listing models:", err);
        setModelGroups([]);
      });
  }, []);

  // When the user changes model selection, update state and save.
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    localStorage.setItem("selectedModel", value);
    saveSettings({ selectedModel: value });
  };

  const handleDownloadOllama = async () => {
    try {
      const { platform } = await import("@tauri-apps/api/os");
      const currentPlatform = await platform();
      let downloadUrl = "https://ollama.com/download/";
      if (currentPlatform === "darwin") downloadUrl += "mac";
      else if (currentPlatform === "win32") downloadUrl += "windows";
      else if (currentPlatform === "linux") downloadUrl += "linux";
      else downloadUrl += "mac";
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error(err);
    }
  };

  const notRecommendedGroups = ["deepseek-coder", "legacy-models"];

  return (
    <div>
      <h1 className="text-2xl font-bold">{settingsMeta.name}</h1>
      <p className="mb-4">{settingsMeta.description}</p>
      <div className="space-y-4">
        {/* Ollama Integration */}
        <div className="border p-4 rounded-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ollama Integration</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                const version = await checkOllamaVersion();
                setOllamaVersion(version || "Unknown");
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          {isOllamaInstalled ? (
            ollamaVersion ? (
              <p className="text-sm text-green-500">
                Ollama is installed. {formatVersion(ollamaVersion)}
              </p>
            ) : (
              <p className="text-sm text-green-500">
                Ollama is installed. Checking version...
              </p>
            )
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-500">Ollama is not installed.</p>
              <Button variant="outline" onClick={handleDownloadOllama}>
                Download Ollama
              </Button>
            </div>
          )}
        </div>

        {/* Model Integration */}
        <div className="border p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Model Integration</h3>
          <p className="text-sm mb-2">
            Select a model from your installed models:
          </p>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
            {modelGroups.length > 0 ? (
              modelGroups.map((group) => {
                const isNotRecommended = notRecommendedGroups.includes(group.group);
                return (
                  <SelectGroup key={group.group}>
                    <SelectLabel className={isNotRecommended ? "text-red-500" : ""}>
                      {group.group} {isNotRecommended && "(Not Recommended)"}
                    </SelectLabel>
                    {group.models.map((model) => {
                      const fullModel = `${group.group}:${model}`;
                      const displayModel = `${group.group} ${model}`;
                      return (
                        <SelectItem key={fullModel} value={fullModel}>
                          {displayModel}
                        </SelectItem>
                      );
                    })}
                    <SelectSeparator />
                  </SelectGroup>
                );
              })
            ) : (
              <>
                <SelectItem value="deepseek-r1:7b">deepseek-r1 7b</SelectItem>
                <SelectItem value="deepseek-r1:1.5b">deepseek-r1 1.5b</SelectItem>
              </>
            )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
