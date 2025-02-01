import "./App.css";

import { ThemeProvider } from "@/components/theme-provider";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import langDetector from "lang-detector";
import { addSnippet } from "@/db/db";

export const NewSnippet = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (code) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        const detectedLanguage = langDetector(code);
        setLanguage(detectedLanguage || "");
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [code]);

  const addCustomTag = () => {
    if (customTag && !tags.includes(customTag)) {
      setTags([...tags, customTag]);
      setCustomTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSaveSnippet = async () => {
    if (!title || !code) {
      toast.error("Title and code are required.");
      return;
    }

    const newSnippet = {
      title,
      description,
      code,
      language,
      tags,
      date: new Date().toISOString(),
    };

    try {
      await addSnippet(newSnippet);
      toast.success("Snippet saved successfully.");

      setTitle("");
      setDescription("");
      setCode("");
      setLanguage("");
      setTags([]);
    } catch (error) {
      toast.error("Failed to save snippet.");
    }
  };

  return (
    <ThemeProvider>
      <div className="h-full flex flex-col justify-center items-center gap-4 p-4">
        <h1 className="text-2xl font-bold">New Snippet</h1>

        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Textarea
          placeholder="Paste your code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-40"
        />

        {code && (
          <SyntaxHighlighter language={language} style={tomorrow} showLineNumbers>
            {code}
          </SyntaxHighlighter>
        )}

        {language && (
          <div className="text-sm text-muted-foreground">Detected Language: {language}</div>
        )}

        <div className="flex gap-2 flex-wrap">
          {tags.map((tag, index) => (
            <Badge key={index} className="flex items-center gap-1">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add custom tag"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
          />
          <Button onClick={addCustomTag}>Add Tag</Button>
        </div>

        <Button className="mt-4" onClick={handleSaveSnippet}>Save Snippet</Button>
      </div>
    </ThemeProvider>
  );
};
