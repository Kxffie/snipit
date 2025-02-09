import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Copy, FileText, X, Search, Pencil, Trash, Sparkles, Folders, Star, Tag, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fs } from "@tauri-apps/api";
import { loadSettings } from "@/db/db";
import { View } from "./View";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { EditSnippet } from "./EditSnippet";
import { useToast } from "@/hooks/use-toast";

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

type Page = "home" | "snipits" | "settings" | "newsnippet" | "view";

export const SnipItsView = ({ setActivePage }: { setActivePage: React.Dispatch<React.SetStateAction<Page>> }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [collectionPath, setCollectionPath] = useState<string>("");
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<any | null>(null);
  const [snippetToDelete, setSnippetToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      const settings = await loadSettings();
      setCollectionPath(settings.collectionPath);
      await fetchSnippets(settings.collectionPath);
    };

    initialize();
  }, []);

  const fetchSnippets = async (path: string) => {
    try {
      const files = await fs.readDir(path);
      const loadedSnippets = [];

      for (const file of files) {
        if (file.name?.endsWith(".json")) {
          const content = await fs.readTextFile(`${path}/${file.name}`);
          loadedSnippets.push(JSON.parse(content));
        }
      }

      setSnippets(loadedSnippets);

      const languages = Array.from(new Set(loadedSnippets.map((s) => s.language)));
      setAvailableLanguages(languages);
    } catch (error) {
      console.error("Failed to load snippets:", error);
      toast({
        title: "Error",
        description: "Failed to load snippets.",
        variant: "destructive",
      });
    }
  };

  if (selectedSnippet) {
    return <View snippet={selectedSnippet} onClose={() => setSelectedSnippet(null)} />;
  }

  const addFilter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const term = searchQuery.trim().toLowerCase();
      if (term !== "" && !filters.includes(term)) {
        setFilters([...filters, term]);
      }
      setSearchQuery("");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    });
  };

  const removeFilter = (filter: string) => {
    setFilters(filters.filter((f) => f !== filter));
  };

  const toggleFilter = (filter: string) => {
    if (filters.includes(filter.toLowerCase())) {
      setFilters(filters.filter((f) => f !== filter.toLowerCase()));
    } else {
      setFilters([...filters, filter.toLowerCase()]);
    }
  };

  const toggleStar = async (snippet: any) => {
    snippet.starred = !snippet.starred;
    try {
      await fs.writeTextFile(`${collectionPath}/${snippet.id}.json`, JSON.stringify(snippet, null, 2));
      await fetchSnippets(collectionPath);
      toast({
        title: "Success",
        description: snippet.starred ? "Snippet starred." : "Snippet unstarred.",
      });
    } catch (error) {
      console.error("Failed to update snippet:", error);
      toast({
        title: "Error",
        description: "Failed to update snippet.",
        variant: "destructive",
      });
    }
  };
  

  const filteredSnippets = snippets.filter((snippet) => {
    const searchTerm = searchQuery.trim().toLowerCase();
    const isStarredFilterActive = filters.includes("starred");
  
    if (isStarredFilterActive && snippet.starred !== true) {
      return false;
    }
  
    if (!searchTerm && filters.length === 0) return true;
  
    const matchesSearch = [snippet.title, snippet.description, snippet.language, snippet.date, ...snippet.tags]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm);
  
    const activeFilters = filters.filter((filter) => filter !== "starred");
    const matchesFilters = activeFilters.length === 0 || activeFilters.some((filter) =>
      snippet.tags.includes(filter) || snippet.language.toLowerCase() === filter
    );
  
    return matchesSearch && matchesFilters;
  });

  const handleEditClick = (id: string) => {
    setEditingSnippetId(id);
  };

  const handleSave = async () => {
    await fetchSnippets(collectionPath);
    setEditingSnippetId(null);
  };

  const handleCancel = () => {
    setEditingSnippetId(null);
  };

  if (editingSnippetId) {
    return <EditSnippet snippetId={editingSnippetId} onCancel={handleCancel} onSave={handleSave} />;
  }

  const confirmDeleteSnippet = async () => {
    if (!snippetToDelete) return;

    try {
      await fs.removeFile(`${collectionPath}/${snippetToDelete}.json`);
      await fetchSnippets(collectionPath);
      toast({
        title: "Deleted",
        description: "Snippet deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete snippet:", error);
      toast({
        title: "Error",
        description: "Failed to delete snippet.",
        variant: "destructive",
      });
    } finally {
      setSnippetToDelete(null); // Reset state
    }
  };

  return (
    <div className="h-full flex">
      <aside className="w-64 p-4 border-r">
        <h3 className="text-md font-semibold mb-2 text-muted-foreground">Favorites</h3>
        <div className="space-y-2 mb-4">
          <Button
            variant={filters.length === 0 ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setFilters([])}
          >
            <Folders className="w-4 h-4" />
            <span className="ml-2">All</span>
          </Button>

          <Button
            variant={filters.includes("starred") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => toggleFilter("starred")}
          >
            <Sparkles className="w-4 h-4" />
            <span className="ml-2">Starred</span>
          </Button>

          <Button
            variant={filters.includes("unlabeled") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => toggleFilter("unlabeled")}
          >
            <Tag className="w-4 h-4" />
            <span className="ml-2">Unlabeled</span>
          </Button>
        </div>

        <h3 className="text-md font-semibold mb-2 text-muted-foreground">Tags</h3>
        <div className="space-y-2">
          {availableLanguages.map((language) => {
            const normalizedLanguage = language.toLowerCase();
            const IconComponent = FileText;

            return (
              <Button
                key={language}
                variant={filters.includes(normalizedLanguage) ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => toggleFilter(language)}
              >
                <IconComponent className="w-4 h-4" />
                <span className="ml-2">{language}</span>
              </Button>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-hidden flex flex-col rounded-tl-lg">
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search snippets..."
              className="pl-10 w-full focus:border-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={addFilter}
            />
          </div>

          <Button 
            className="px-4 py-2 rounded-md"
            variant="ghost"
            >
              <Filter className="w-4 h-4" />
            </Button>

          <Button
            className="px-6 py-2 rounded-md"
            variant="ghost"
            onClick={() => setActivePage("newsnippet")}
          >
            + New Snippet
          </Button>
        </div>

        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((filter) => (
              <Badge key={filter} className="flex items-center space-x-2 px-3 py-1 bg-secondary text-secondary-foreground">
                <span>{filter}</span>
                <X className="w-4 h-4 cursor-pointer" onClick={() => removeFilter(filter)} />
              </Badge>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hidden">
          {filteredSnippets
          .slice()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((snippet) => (
            <Card key={snippet.id} className="border bg-muted p-3 rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-2 min-w-0">
                <div className="min-w-0 cursor-pointer" onClick={() => setSelectedSnippet(snippet)}>
                  <CardTitle className="text-xl font-semibold text-accent hover:underline">
                    {snippet.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground truncate">{snippet.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="icon" variant="ghost" onClick={() => toggleStar(snippet)}>
                    <Star className={`w-4 h-4 ${snippet.starred ? "text-yellow-400" : ""}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleEditClick(snippet.id)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(snippet.code)}>
                    <Copy className="w-4 h-4" />
                  </Button>

                  {/* Alert Dialog for Deleting Snippet */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setSnippetToDelete(snippet.id)}>
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The SnipIt will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteSnippet}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <CardContent className="bg-background p-3 rounded-md border">
                <SyntaxHighlighter
                  language={snippet.language.toLowerCase()}
                  style={tomorrow}
                  showLineNumbers
                  customStyle={{
                    backgroundColor: "inherit",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.9rem",
                    lineHeight: "1.4",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflow: "auto",
                  }}
                >
                  {snippet.code.split("\n").length > 9
                    ? snippet.code.split("\n").slice(0, 9).join("\n") + "\n..."
                    : snippet.code}
                </SyntaxHighlighter>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};
