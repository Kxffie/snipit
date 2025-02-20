import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MonacoEditor from "@monaco-editor/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Save, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSnippetById, saveSnippet, Snippet } from "@/lib/SnipItService";
import { Collection } from "@/lib/CollectionsService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/tauri";
import {
  completeSnippetMetadata, // <-- import the new helper
} from "@/lib/deepSeekService";

interface SnipItFormProps {
  snippetId?: string;
  onClose: () => void;
  onSave: () => void;
  selectedCollection?: Collection | null;
}

export const SnipItForm: React.FC<SnipItFormProps> = ({
  snippetId,
  onClose,
  onSave,
  selectedCollection,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const snippetQueryKey = [
    "snippet",
    snippetId || "",
    selectedCollection?.path || "default",
  ];

  const { data, error } = useQuery<Snippet | null>({
    queryKey: snippetQueryKey,
    queryFn: () => getSnippetById(snippetId!, selectedCollection?.path),
    enabled: Boolean(snippetId),
  });

  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setDescription(data.description ?? "");
      setCode(data.code);
      setLanguage(data.language ?? "");
      setTags(data.tags ?? []);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load snippet.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const saveMutation = useMutation({
    mutationFn: (snippetData: Snippet) =>
      saveSnippet(snippetData, selectedCollection?.path),
    onSuccess: () => {
      toast({
        title: "Success",
        description: snippetId
          ? "SnipIt updated successfully."
          : "SnipIt saved successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["snippets", selectedCollection?.path || ""],
      });
      onSave();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save SnipIt.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSnippet = () => {
    if (!title || !code) {
      toast({
        title: "Error",
        description: "Title and code are required.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedCollection?.path) {
      toast({
        title: "Error",
        description: "No collection selected. Please select a collection first.",
        variant: "destructive",
      });
      return;
    }
    const id =
      snippetId || Math.floor(100000000 + Math.random() * 900000000).toString();
    const finalTags = tags.length > 0 ? tags : ["unlabeled"];
    const snippetData: Snippet = {
      id,
      title,
      description,
      code,
      language,
      tags: finalTags,
      starred: false,
      date: new Date().toISOString(),
    };
    saveMutation.mutate(snippetData);
  };

  // New handleCompleteWithAI that delegates to the service function
  const handleCompleteWithAI = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a code snippet first.",
        variant: "destructive",
      });
      return;
    }

    // Pick model from localStorage if set
    const selectedModel =
      (localStorage.getItem("selectedDeepSeekModel") as "1.5b" | "7b" | null) ||
      "7b";

    setIsAiLoading(true);
    try {
      // Calls our new service function
      const result = await completeSnippetMetadata(code, selectedModel);

      if (result.error) {
        toast({
          title: "AI Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setTitle(result.title || "");
        setDescription(result.description || "");
        setLanguage(result.codeLanguage || "");
        setTags(result.tags || []);
        toast({
          title: "AI Completed",
          description: "Fields have been auto-filled.",
        });
        console.log("Parsed AI result:", result);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to complete with AI.",
        variant: "destructive",
      });
      console.error("handleCompleteWithAI error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Check DeepSeek status on mount.
  const [isDeepSeekInstalled, setIsDeepSeekInstalled] = useState(false);
  useEffect(() => {
    invoke<boolean>("check_deepseek")
      .then((res) => {
        console.log("DeepSeek installed check:", res);
        setIsDeepSeekInstalled(res);
      })
      .catch((err) => {
        console.error(err);
        setIsDeepSeekInstalled(false);
      });
  }, []);

  return (
    <ThemeProvider>
      <div className="relative h-full w-full flex flex-col bg-background text-foreground">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar for snippet details */}
          <aside className="w-64 border-r border-border p-4 text-sm text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {snippetId ? "Edit Snippet" : "New Snippet"}
            </h2>
            <Input
              placeholder="Snippet Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full text-sm bg-secondary text-secondary-foreground border-none focus:ring-0 focus:outline-none px-3 py-2 rounded-md mb-4 ${
                isAiLoading ? "animate-pulse" : ""
              }`}
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full text-sm bg-secondary text-secondary-foreground border-none focus:ring-0 focus:outline-none px-3 py-2 rounded-md mb-4 ${
                isAiLoading ? "animate-pulse" : ""
              }`}
            />
            <div className="mb-4">
              <h3 className="text-md font-semibold text-foreground mb-2">
                Language
              </h3>
              <Input
                placeholder="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full text-sm bg-secondary text-secondary-foreground border-none focus:ring-0 focus:outline-none px-3 py-2 rounded-md ${
                  isAiLoading ? "animate-pulse" : ""
                }`}
              />
            </div>
            <h3 className="text-md font-semibold text-foreground mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              type="text"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const newTag = tagInput.trim();
                  if (newTag && !tags.includes(newTag)) {
                    setTags([...tags, newTag]);
                  }
                  setTagInput("");
                }
              }}
              className="w-full text-sm bg-secondary text-secondary-foreground border-none focus:ring-0 focus:outline-none px-3 py-2 rounded-md"
            />
          </aside>
          {/* Code editor */}
          <div className="flex-1 overflow-auto hide-scrollbar">
            <MonacoEditor
              height="100%"
              language={language ? language.toLowerCase() : "plaintext"}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                scrollbar: { vertical: "hidden", horizontal: "hidden" },
                overviewRulerLanes: 0,
              }}
            />
          </div>
        </div>
        {/* Action buttons */}
        <div className="absolute bottom-6 right-6 flex gap-3">
          {isDeepSeekInstalled && (
            <Button
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              onClick={handleCompleteWithAI}
              disabled={isAiLoading}
            >
              {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>Complete with AI</span>
            </Button>
          )}
          <Button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md"
            onClick={handleSaveSnippet}
          >
            <Save className="w-5 h-5" />
            <span>Save</span>
          </Button>
          <Button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
            <span>Cancel</span>
          </Button>
        </div>
        {/* Overlay loading indicator */}
        {isAiLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <span className="mt-4 text-white text-lg">
              Generating metadata, please wait...
            </span>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};
