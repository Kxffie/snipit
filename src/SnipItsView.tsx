import { useState, useEffect } from "react";
import * as DevIcons from "react-icons/di";
import { languageIconMap } from "@/lib/languageIconMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, FileText, X, Search, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { loadSnippets, deleteSnippet, addSnippet, updateSnippet } from "@/db/db";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

export const SnipItsView = ({ setActivePage }: { setActivePage: (page: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    const fetchSnippets = async () => {
      const loadedSnippets = await loadSnippets();
      setSnippets(loadedSnippets);
  
      const languages = Array.from(new Set(loadedSnippets.map((s) => s.language)));
      setAvailableLanguages(languages);
    };
    fetchSnippets();
  }, []);

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
    toast.success("Code copied to clipboard.");
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

  const filteredSnippets = snippets.filter((snippet) => {
    const searchTerms = [...filters, searchQuery.trim().toLowerCase()].filter(Boolean);

    if (searchTerms.length === 0) return true;

    return searchTerms.some((term) => {
      if (term === "uncategorized") {
        return snippet.tags.length === 0;
      }

      return [snippet.title, snippet.description, snippet.language, snippet.date, ...snippet.tags]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  });

  const handleDelete = async (id: number) => {
    await deleteSnippet(id);
    setSnippets(await loadSnippets());
    toast.success("Snippet deleted.");
  };

  const handleEdit = async (snippet: any) => {
    await updateSnippet(snippet);
    setSnippets(await loadSnippets());
    toast.success("Snippet updated.");
  };

  const handleAddSnippet = async (newSnippet: any) => {
    await addSnippet(newSnippet);
    setSnippets(await loadSnippets());
    toast.success("Snippet added.");
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
            <FileText className="w-4 h-4" />
            <span className="ml-2">All</span>
          </Button>

          <Button
            variant={filters.includes("uncategorized") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => toggleFilter("uncategorized")}
          >
            <FileText className="w-4 h-4" />
            <span className="ml-2">Uncategorized</span>
          </Button>
        </div>

        <h3 className="text-md font-semibold mb-2 text-muted-foreground">Tags</h3>
        <div className="space-y-2">
          {availableLanguages.map((language) => {
            const normalizedLanguage = language.toLowerCase();
            const IconComponent = DevIcons[languageIconMap[normalizedLanguage]] || FileText;

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

      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search snippets..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={addFilter}
            />
          </div>

          <Button
            className="px-6 py-2 rounded-md bg-secondary text-secondary-foreground"
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

        <div className={`flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hidden`}>
          {filteredSnippets.length === 0 ? (
            <p className="text-muted-foreground">No snippets found.</p>
          ) : (
            filteredSnippets.map((snippet) => (
              <Card key={snippet.id} className="relative border bg-muted">
                <CardHeader className="relative">
                  <CardTitle>{snippet.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{snippet.description}</p>

                  {snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {snippet.tags.map((tag, index) => (
                        <Badge key={index} className="bg-background text-foreground">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex space-x-2 z-10">
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(snippet.code)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(snippet)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(snippet.id)}>
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="relative bg-background p-4 rounded-md border">
                  <SyntaxHighlighter
                    language={snippet.language.toLowerCase()}
                    style={tomorrow}
                    showLineNumbers={true}
                    customStyle={{ backgroundColor: "inherit", padding: "1rem", borderRadius: "0.375rem" }}
                  >
                    {snippet.code}
                  </SyntaxHighlighter>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
