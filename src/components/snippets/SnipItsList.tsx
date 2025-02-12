import { useState, useEffect, useMemo } from "react";
import { FileText, X, Search, Sparkles, Folders, Tag, Filter } from "lucide-react";

import { SnipItView } from "./SnipItView";
import { SnipItForm } from "./SnipItForm";
import { SnipItCard } from "./SnipItCard";

import { loadSnippets, Snippet } from "@/lib/SnipItService";
import {
  filterBySide,
  filterBySearch,
  sortSnippets,
  SortOption,
} from "@/lib/FilterSnippets";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type Page = "home" | "snipits" | "settings" | "newsnippet" | "view";

export const SnipItsList = ({
  setActivePage,
}: {
  setActivePage: React.Dispatch<React.SetStateAction<Page>>;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  // Sorting state
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [starredFirst, setStarredFirst] = useState(true);

  // Popover open/close
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // -------------------------------------
  // Lifecycle
  // -------------------------------------
  useEffect(() => {
    loadSnippetsData();
  }, []);

  async function loadSnippetsData() {
    const loadedSnippets = await loadSnippets();
    setSnippets(loadedSnippets);

    const languages = Array.from(new Set(loadedSnippets.map((s) => s.language)));
    setAvailableLanguages(languages);
  }

  // -------------------------------------
  // Handlers & Utilities
  // -------------------------------------
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const removeFilter = (filter: string) => {
    setFilters((prev) => prev.filter((f) => f !== filter));
  };

  const toggleFilter = (filter: string) => {
    const normalized = filter.toLowerCase();
    setFilters((prev) =>
      prev.includes(normalized)
        ? prev.filter((f) => f !== normalized)
        : [...prev, normalized]
    );
  };

  const toggleStar = (id: string, newStarred: boolean) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, starred: newStarred } : s))
    );
  };

  // -------------------------------------
  // Memoized Filter Results
  // -------------------------------------
  const sideFiltered = useMemo(
    () => filterBySide(snippets, filters, availableLanguages),
    [snippets, filters, availableLanguages]
  );

  const finalSnippets = useMemo(
    () => filterBySearch(sideFiltered, searchQuery),
    [sideFiltered, searchQuery]
  );

  // -------------------------------------
  // Conditional Rendering
  // -------------------------------------
  if (editingSnippetId) {
    return (
      <SnipItForm
        snippetId={editingSnippetId}
        onClose={() => setEditingSnippetId(null)}
        onSave={loadSnippetsData}
      />
    );
  }

  if (selectedSnippet) {
    return (
      <SnipItView
        snippet={selectedSnippet}
        onClose={() => setSelectedSnippet(null)}
      />
    );
  }

  // -------------------------------------
  // Main Render
  // -------------------------------------
  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r">
        <h3 className="text-md font-semibold mb-2 text-muted-foreground">
          Favorites
        </h3>
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
                  variant={
                    filters.includes("unlabeled") ? "secondary" : "ghost"
                  }
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

        {/* List of tags from snippet languages */}
        <h3 className="text-md font-semibold mb-2 text-muted-foreground">Tags</h3>
        <div className="space-y-2">
          {availableLanguages.map((language) => {
            const normalizedLanguage = language.toLowerCase();
            const IconComponent = FileText;

            return (
              <Button
                key={language}
                variant={
                  filters.includes(normalizedLanguage) ? "secondary" : "ghost"
                }
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

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col rounded-tl-lg">
        {/* Search, Filter, and New Snippet area */}
        <TooltipProvider>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder='Search snippets... (e.g., title:React content:useState)'
                className="pl-10 w-full focus:border-accent"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            {/* Sort/Filter Popover */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button className="px-4 py-2 rounded-md" variant="ghost">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-2 w-56 flex flex-col space-y-2 text-left">
                    {/* Sort Options */}
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSortOption("date-desc");
                          setIsPopoverOpen(false);
                        }}
                      >
                        Date: Newest First
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSortOption("date-asc");
                          setIsPopoverOpen(false);
                        }}
                      >
                        Date: Oldest First
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSortOption("title-asc");
                          setIsPopoverOpen(false);
                        }}
                      >
                        Title: A → Z
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSortOption("title-desc");
                          setIsPopoverOpen(false);
                        }}
                      >
                        Title: Z → A
                      </Button>
                    </div>

                    <hr className="my-1 border-border" />

                    {/* Additional Checkboxes */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={starredFirst}
                        onCheckedChange={(val: boolean) => {
                          setStarredFirst(Boolean(val));
                        }}
                      />
                      <span>Starred First</span>
                    </label>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter / Sort snippets</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="px-6 py-2 rounded-md"
                  variant="ghost"
                  onClick={() => setActivePage("newsnippet")}
                >
                  + New Snippet
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new snippet</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Filter badges */}
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((filter) => (
              <Badge
                key={filter}
                className="flex items-center space-x-2 px-3 py-1 bg-secondary text-secondary-foreground"
              >
                <span>{filter}</span>
                <X
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => removeFilter(filter)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Snippet cards list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hidden">
          {finalSnippets
            .slice()
            .sort((a, b) => sortSnippets(a, b, sortOption, starredFirst))
            .map((snippet) => (
              <SnipItCard
                key={snippet.id}
                snippet={snippet}
                onEdit={(id) => setEditingSnippetId(id)}
                onDelete={(id) =>
                  setSnippets((prev) => prev.filter((s) => s.id !== id))
                }
                onSelect={(s) => setSelectedSnippet(s)}
                onToggleStar={toggleStar}
              />
            ))}
        </div>
      </main>
    </div>
  );
};
