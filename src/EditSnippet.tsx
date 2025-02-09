import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MonacoEditor from "@monaco-editor/react";
import { fs } from "@tauri-apps/api";
import { loadSettings } from "@/db/db";
import { ThemeProvider } from "@/components/theme-provider";
import { Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Import ShadCN's toast

export const EditSnippet = ({ snippetId, onCancel, onSave }: { snippetId: string; onCancel: () => void; onSave: () => void }) => {
  const { toast } = useToast(); // ShadCN toast function
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [collectionPath, setCollectionPath] = useState<string>("");

  useEffect(() => {
    const loadSnippet = async () => {
      const settings = await loadSettings();
      setCollectionPath(settings.collectionPath);

      try {
        const filePath = `${settings.collectionPath}/${snippetId}.json`;
        const content = await fs.readTextFile(filePath);
        const snippet = JSON.parse(content);

        setTitle(snippet.title);
        setDescription(snippet.description);
        setCode(snippet.code);
        setLanguage(snippet.language);
        setTags(snippet.tags || []);
      } catch (error) {
        console.error("Failed to load snippet:", error);
        toast({
          title: "Error",
          description: "Failed to load snippet.",
          variant: "destructive",
        });
      }
    };

    loadSnippet();
  }, [snippetId]);

  const handleSaveSnippet = async () => {
    if (!title || !code) {
      toast({
        title: "Error",
        description: "Title and code are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedSnippet = { id: snippetId, title, description, code, language, tags, date: new Date().toISOString() };
      const filePath = `${collectionPath}/${snippetId}.json`;

      await fs.writeTextFile(filePath, JSON.stringify(updatedSnippet, null, 2));
      toast({
        title: "Success",
        description: "SnipIt updated successfully.",
      });

      onSave();
    } catch (error) {
      console.error("Failed to save SnipIt:", error);
      toast({
        title: "Error",
        description: "Failed to save SnipIt.",
        variant: "destructive",
      });
    }
  };

  return (
    <ThemeProvider>
      <div className="h-full w-full flex flex-col bg-background text-foreground">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar for metadata */}
          <aside className="w-64 border-r border-border p-4 text-sm text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground mb-3">Edit Snippet</h2>

            <Input
              placeholder="Snippet Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm bg-secondary text-secondary-foreground border-none focus:ring-0 focus:outline-none px-3 py-2 rounded-md mb-4"
            />

            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-secondary text-secondary-foreground border-none focus:ring-0 focus:outline-none px-3 py-2 rounded-md mb-4"
            />

            <div className="mb-4">
              <h3 className="text-md font-semibold text-foreground mb-2">Language</h3>
              <Input
                placeholder="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-sm bg-secondary text-secondary-foreground border-none focus:ring-0 focus:outline-none px-3 py-2 rounded-md"
              />
            </div>

            <h3 className="text-md font-semibold text-foreground mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <Badge key={index} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                  {tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="ml-1 text-red-500 hover:text-red-700">
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
              language={language || "plaintext"}
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
          <Button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all duration-200 ease-in-out"
            onClick={handleSaveSnippet}
          >
            <Save className="w-5 h-5" />
            <span>Save</span>
          </Button>

          <Button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200 ease-in-out"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
            <span>Cancel</span>
          </Button>
        </div>
      </div>
    </ThemeProvider>
  );
};
