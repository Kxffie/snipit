import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkOllamaInstalled, checkDeepSeekInstalled, installDeepSeekModel, listDeepSeekModels } from "@/lib/deepSeekService";

export const settingsMeta = {
  name: "Connections",
  icon: <Plug className="w-4 h-4" />,
  group: "Main",
  order: 2,
};

export default function Connections() {
  const { toast } = useToast();
  const [isOllamaInstalled, setIsOllamaInstalled] = useState(false);
  const [isDeepSeekInstalled, setIsDeepSeekInstalled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("deepseek-r1:7b");
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);

  useEffect(() => {
    checkOllamaInstalled()
      .then(setIsOllamaInstalled)
      .catch((err) => {
        console.error(err);
        setIsOllamaInstalled(false);
      });
    checkDeepSeekInstalled()
      .then(setIsDeepSeekInstalled)
      .catch((err) => {
        console.error(err);
        setIsDeepSeekInstalled(false);
      });
  }, []);

  useEffect(() => {
    listDeepSeekModels()
      .then((models) => {
        setDownloadedModels(models);
        if (models.length > 0 && !models.includes(selectedModel)) {
          setSelectedModel(models[0]);
          localStorage.setItem("selectedDeepSeekModel", models[0]);
        }
      })
      .catch((err) => {
        console.error(err);
        setDownloadedModels([]);
      });
  }, []);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    localStorage.setItem("selectedDeepSeekModel", value);
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

  return (
    <div>
      <h1 className="text-2xl font-bold">Connections</h1>
      <p className="mb-4">Manage API integrations, database connections, and more.</p>
      <div className="space-y-4">
        <div className="border p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">DeepSeek Integration</h3>
          {isOllamaInstalled ? (
            isDeepSeekInstalled ? (
              <div className="space-y-2">
                <p className="text-sm">DeepSeek is installed. Select one of the downloaded models:</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Model:</span>
                  <Select value={selectedModel} onValueChange={handleModelChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {downloadedModels.length > 0 ? (
                        downloadedModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="deepseek-r1:1.5b">DeepSeek r1:1.5b</SelectItem>
                          <SelectItem value="deepseek-r1:7b">DeepSeek r1:7b</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-500">DeepSeek is not installed.</p>
                <p className="text-xs">To install, ensure Ollama is installed first. Then click the button below.</p>
                <Button variant="outline" onClick={() => {
                  installDeepSeekModel(selectedModel)
                    .then((res) => {
                      console.log("Installation output:", res);
                      checkDeepSeekInstalled().then(setIsDeepSeekInstalled);
                      toast({ title: "DeepSeek Installed", description: "DeepSeek model has been installed." });
                    })
                    .catch((err) => {
                      console.error(err);
                      toast({ title: "Error", description: "Failed to install DeepSeek.", variant: "destructive" });
                    });
                }}>
                  Install DeepSeek
                </Button>
                <p className="text-xs mt-2">If Ollama is missing, download it:</p>
                <Button variant="outline" onClick={handleDownloadOllama}>
                  Download Ollama
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-500">Ollama is not installed.</p>
              <p className="text-xs">Please download Ollama:</p>
              <Button variant="outline" onClick={handleDownloadOllama}>
                Download Ollama
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
