import { useState, useEffect } from "react";
import { FileText, X, Search, Sparkles, Folders, Tag, Filter } from "lucide-react";
import { SnipItView } from "./SnipItView";
import { SnipItForm } from "./SnipItForm";
import { SnipItCard } from "./SnipItCard";

import { 
  loadSnippets, 
  filterSnippetsByQuery,
  Snippet 
} from "@/lib/SnipItService";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Page = "home" | "snipits" | "settings" | "newsnippet" | "view";

export const SnipItsList = ({ setActivePage }: { setActivePage: React.Dispatch<React.SetStateAction<Page>> }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    const loadedSnippets = await loadSnippets();
    setSnippets(loadedSnippets);
    const languages = Array.from(new Set(loadedSnippets.map((s) => s.language)));
    setAvailableLanguages(languages);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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

  const toggleStar = (id: string, newStarred: boolean) => {
    setSnippets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, starred: newStarred } : s
      )
    );
  };

  const filterSnippetsByQuery = (snippets: Snippet[], query: string): Snippet[] => {
    if (!query.trim()) return snippets;
  
    const terms = query
      .toLowerCase()
      .match(/(\w+:"[^"]+"|\w+:\S+|\S+)/g) || [];
  
    return snippets.filter((snippet) => {
      return terms.every((term) => {
        let [field, value] = term.includes(":") ? term.split(":") : ["all", term];
        value = value.replace(/^"|"$/g, "").toLowerCase(); // strip any quotes
  
        switch (field) {
          case "title":
            return snippet.title.toLowerCase().includes(value);
          case "description":
            return (snippet.description ?? "").toLowerCase().includes(value);
          case "content":
            return snippet.code.toLowerCase().includes(value);
          case "language":
            return snippet.language.toLowerCase().includes(value);
          case "tag":
          case "tags":
            return snippet.tags.some((tag) => tag.toLowerCase().includes(value));
          case "all":
          default:
            return (
              snippet.title.toLowerCase().includes(value) ||
              (snippet.description ?? "").toLowerCase().includes(value) ||
              snippet.code.toLowerCase().includes(value) ||
              snippet.language.toLowerCase().includes(value) ||
              snippet.tags.some((tag) => tag.toLowerCase().includes(value))
            );
        }
      });
    });
  };

  const filteredSnippets = filterSnippetsByQuery(snippets, searchQuery);

  if (editingSnippetId) {
    return <SnipItForm snippetId={editingSnippetId} onClose={() => setEditingSnippetId(null)} onSave={fetchSnippets} />;
  }

  if (selectedSnippet) {
    return <SnipItView snippet={selectedSnippet} onClose={() => setSelectedSnippet(null)} />;
  }

  return (
    <div className="h-full flex">
      <aside className="w-64 p-4 border-r">
        <h3 className="text-md font-semibold mb-2 text-muted-foreground">Favorites</h3>
        <div className="space-y-2 mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={filters.length === 0 ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setFilters([])}
                >
                  <Folders className="w-4 h-4" />
                  <span className="ml-2">All</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show all snippets</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={filters.includes("starred") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => toggleFilter("starred")}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="ml-2">Starred</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show starred snippets</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={filters.includes("unlabeled") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => toggleFilter("unlabeled")}
                >
                  <Tag className="w-4 h-4" />
                  <span className="ml-2">Unlabeled</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show snippets without tags</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>


        {/* List of tags that uses the languages of your snippets */}
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


      {/* Entire Snippet List */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col rounded-tl-lg">


        {/* Search, Filter, and New Snippet area */}
        <TooltipProvider>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search snippets... (e.g., title:React content:useState)"
                className="pl-10 w-full focus:border-accent"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="px-4 py-2 rounded-md" variant="ghost">
                  <Filter className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter snippets</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="px-6 py-2 rounded-md" variant="ghost" onClick={() => setActivePage("newsnippet")}>
                  + New Snippet
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new snippet</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>


        {/* filter badges */}
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


        {/* Snippet cards list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hidden">
        {filteredSnippets.map((snippet) => (
          <SnipItCard
            key={snippet.id}
            snippet={snippet}
            onEdit={(id) => setEditingSnippetId(id)}
            onDelete={(id) => setSnippets(snippets.filter(s => s.id !== id))}
            onSelect={(snippet) => setSelectedSnippet(snippet)}
            onToggleStar={toggleStar}
          />
        ))}
        </div>
      </main>
    </div>
  );
};
