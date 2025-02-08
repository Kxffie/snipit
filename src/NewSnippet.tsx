import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MonacoEditor from "@monaco-editor/react";
import langDetector from "lang-detector";
import { fs } from "@tauri-apps/api";
import { loadSettings } from "@/db/db";

export const NewSnippet = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [collectionPath, setCollectionPath] = useState<string>("");

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSettings().then((settings) => {
      if (settings.collectionPath) {
        setCollectionPath(settings.collectionPath);
      }
    });
  }, []);

  useEffect(() => {
    if (code) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        const detectedLanguage = langDetector(code);
        if (detectedLanguage && detectedLanguage !== language) {
          setLanguage(detectedLanguage);
        }
      }, 4000);
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [code]);

  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const generateUniqueId = async (): Promise<string> => {
    let id: string;
    let exists = true;

    while (exists) {
      id = Math.floor(100000000 + Math.random() * 900000000).toString();
      const filePath = `${collectionPath}/${id}.json`;
      exists = await fs.exists(filePath);
    }

    return id!;
  };

  const handleSaveSnippet = async () => {
    if (!title || !code) {
      toast.error("Title and code are required.");
      return;
    }

    try {
      const id = await generateUniqueId();
      const finalTags = tags.length > 0 ? tags : ["unlabeled"];

      const newSnippet = { id, title, description, code, language, tags: finalTags, starred: false, date: new Date().toISOString() };

      const filePath = `${collectionPath}/${id}.json`;
      await fs.writeTextFile(filePath, JSON.stringify(newSnippet, null, 2));

      toast.success("Snippet saved successfully.");
      setTitle("");
      setDescription("");
      setCode("");
      setLanguage("");
      setTags([]);
    } catch (error) {
      console.error("Failed to save snippet:", error);
      toast.error("Failed to save snippet.");
    }
  };

  return (
    <ThemeProvider>
      <div className="h-full max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">New Snippet</h1>

        <Input
          placeholder="Snippet Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
        />

        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full"
        />

        <MonacoEditor
          height="400px"
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
          }}
        />

        <div className="flex items-center gap-2">
          <Input
            placeholder="Detected language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full"
          />
          <span className="text-sm text-muted-foreground">(Editable)</span>
        </div>

        <div className="flex items-center flex-wrap gap-2 border rounded-md px-2 py-1 bg-background focus-within:ring-2 ring-ring">
          {tags.map((tag, index) => (
            <Badge key={index} className="flex items-center gap-1 px-2 py-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-1 text-red-500 hover:text-red-700">
                ×
              </button>
            </Badge>
          ))}
          <input
            type="text"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none bg-transparent"
          />
        </div>

        <Button className="w-full py-3" onClick={handleSaveSnippet}>
          Save Snippet
        </Button>
      </div>
    </ThemeProvider>
  );
};
