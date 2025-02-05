import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { fs } from "@tauri-apps/api";
import { loadSettings } from "@/db/db";

export const EditSnippet = ({ snippetId, onCancel, onSave }: { snippetId: string; onCancel: () => void; onSave: () => void }) => {
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
        toast.error("Failed to load snippet.");
      }
    };

    loadSnippet();
  }, [snippetId]);

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

  const handleSave = async () => {
    if (!title || !code) {
      toast.error("Title and code are required.");
      return;
    }

    try {
      const updatedSnippet = { id: snippetId, title, description, code, language, tags, date: new Date().toISOString() };
      const filePath = `${collectionPath}/${snippetId}.json`;

      await fs.writeTextFile(filePath, JSON.stringify(updatedSnippet, null, 2));
      toast.success("Snippet updated successfully.");
      onSave();
    } catch (error) {
      console.error("Failed to save snippet:", error);
      toast.error("Failed to save snippet.");
    }
  };

  return (
    <ThemeProvider>
      <div className="h-full max-w-2xl mx-auto p-6 space-y-4 bg-muted rounded-md shadow-md">
        <h1 className="text-2xl font-bold text-center">Edit Snippet</h1>

        <Input
          placeholder="Snippet Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
        />

        <Textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full"
        />

        <Textarea
          placeholder="Edit your code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-40 w-full"
        />

        <Input
          placeholder="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full"
        />

        {code && (
          <div className="border rounded-md p-3 bg-background">
            <SyntaxHighlighter language={language} style={tomorrow} showLineNumbers>
              {code}
            </SyntaxHighlighter>
          </div>
        )}

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

        <div className="flex justify-between gap-4">
          <Button variant="outline" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="w-full" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </ThemeProvider>
  );
};
