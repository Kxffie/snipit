import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  X,
  Search,
  Sparkles,
  Folders,
  Tag,
  Filter,
} from "lucide-react";
import { SnipItView } from "./SnipItView";
import { SnipItForm } from "./SnipItForm";
import { SnipItCard } from "./SnipItCard";
import {
  useSnippetsQuery,
  Snippet,
  filterBySide,
  filterBySearch,
  sortSnippets,
  SortOption,
} from "@/lib/SnipItService";
import { useCollectionsQuery, Collection } from "@/lib/CollectionsService";
import { loadSettings, saveSettings } from "@/db/db";
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

type SnipItsListProps = {
  setActivePage: React.Dispatch<React.SetStateAction<Page>>;
  selectedCollection: Collection | null;
  setSelectedCollection: React.Dispatch<React.SetStateAction<Collection | null>>;
};

export const SnipItsList = ({
  setActivePage,
  selectedCollection,
  setSelectedCollection,
}: SnipItsListProps) => {
  // Local state for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [starredFirst, setStarredFirst] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCollectionPopoverOpen, setIsCollectionPopoverOpen] = useState(false);

  // Collections and snippets queries
  const { data: collections = [], isLoading: isLoadingCollections } = useCollectionsQuery();
  const {
    data: snippets = [],
    refetch: refetchSnippets,
    isLoading: isLoadingSnippets,
  } = useSnippetsQuery(selectedCollection?.path);

  // Load saved collection from settings if available.
  useEffect(() => {
    async function loadSavedCollection() {
      const settings = await loadSettings();
      const savedCollectionId = settings?.selectedCollectionId;
      if (collections.length > 0) {
        let defaultCollection: Collection | null = null;
        if (savedCollectionId) {
          defaultCollection = collections.find((c) => c.id === savedCollectionId) || null;
        }
        if (!defaultCollection) {
          defaultCollection = collections[0];
        }
        setSelectedCollection(defaultCollection);
      }
    }
    loadSavedCollection();
  }, [collections, setSelectedCollection]);

  // Compute available frameworks and languages from snippets.
  const availableFrameworks = useMemo(() => {
    return Array.from(new Set(snippets.map((s) => (s as any).framework).filter(Boolean)));
  }, [snippets]);

  const availableLanguages = useMemo(() => {
    return Array.from(new Set(snippets.map((s) => s.language).filter(Boolean)));
  }, [snippets]);

  const handleCollectionSelect = async (col: Collection) => {
    setSelectedCollection(col);
    await saveSettings({ selectedCollectionId: col.id });
    refetchSnippets();
    setIsCollectionPopoverOpen(false);
  };

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

  const toggleStar = () => {
    // Simply refetch snippets for now after a star toggle.
    refetchSnippets();
  };

  const handleDeleteSnippet = (id: string) => {
    refetchSnippets();
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null);
    }
  };

  // Filtering: first, filter by side (favorites, starred, unlabeled, etc.)
  const sideFiltered = useMemo(() => {
    return filterBySide(snippets, filters, availableLanguages);
  }, [snippets, filters, availableLanguages]);

  // Then, filter by search query.
  const finalSnippets = useMemo(() => {
    return filterBySearch(sideFiltered, searchQuery);
  }, [sideFiltered, searchQuery]);

  if (editingSnippetId) {
    return (
      <SnipItForm
        snippetId={editingSnippetId}
        onClose={() => setEditingSnippetId(null)}
        onSave={() => refetchSnippets()}
        selectedCollection={selectedCollection}
      />
    );
  }

  if (selectedSnippet) {
    return (
      <SnipItView
        snippet={selectedSnippet}
        onClose={() => setSelectedSnippet(null)}
        onDelete={handleDeleteSnippet}
        onEdit={setEditingSnippetId}
        collectionPath={selectedCollection?.path}
      />
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r flex flex-col">
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

        {/* Frameworks Section */}
        <h3 className="text-md font-semibold mb-2 text-muted-foreground">
          Frameworks
        </h3>
        <div className="space-y-2 mb-2 overflow-auto">
          {availableFrameworks.length > 0 ? (
            availableFrameworks.map((fw) => {
              const normalizedFW = fw.toLowerCase();
              return (
                <Button
                  key={fw}
                  variant={filters.includes(normalizedFW) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => toggleFilter(fw)}
                >
                  <FileText className="w-4 h-4" />
                  <span className="ml-2">{fw}</span>
                </Button>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No frameworks found</p>
          )}
        </div>

        {/* Languages Section */}
        <h3 className="text-md font-semibold mb-2 text-muted-foreground">
          Languages
        </h3>
        <div className="space-y-2 flex-1 overflow-auto">
          {availableLanguages.length > 0 ? (
            availableLanguages.map((lang) => {
              const normalizedLang = lang.toLowerCase();
              return (
                <Button
                  key={lang}
                  variant={filters.includes(normalizedLang) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => toggleFilter(lang)}
                >
                  <FileText className="w-4 h-4" />
                  <span className="ml-2">{lang}</span>
                </Button>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No languages found</p>
          )}
        </div>

        {/* Collection Selector */}
        <div className="mt-4">
          <Popover open={isCollectionPopoverOpen} onOpenChange={setIsCollectionPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                {selectedCollection?.name ?? "Select Collection"}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" sideOffset={8} className="p-2 w-full max-h-48 overflow-y-auto">
              {isLoadingCollections ? (
                <p className="text-sm text-muted-foreground">Loading collections...</p>
              ) : collections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collections found.</p>
              ) : (
                collections.map((col) => (
                  <Button
                    key={col.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleCollectionSelect(col)}
                  >
                    {col.name}
                  </Button>
                ))
              )}
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col rounded-tl-lg">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button className="px-4 py-2 rounded-md" variant="ghost">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-2 w-56 flex flex-col space-y-2 text-left">
                    <div className="flex flex-col space-y-1">
                      <Button variant="ghost" onClick={() => { setSortOption("date-desc"); setIsPopoverOpen(false); }}>
                        Date: Newest First
                      </Button>
                      <Button variant="ghost" onClick={() => { setSortOption("date-asc"); setIsPopoverOpen(false); }}>
                        Date: Oldest First
                      </Button>
                      <Button variant="ghost" onClick={() => { setSortOption("title-asc"); setIsPopoverOpen(false); }}>
                        Title: A → Z
                      </Button>
                      <Button variant="ghost" onClick={() => { setSortOption("title-desc"); setIsPopoverOpen(false); }}>
                        Title: Z → A
                      </Button>
                    </div>
                    <hr className="my-1 border-border" />
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={starredFirst}
                        onCheckedChange={(val: boolean) => setStarredFirst(Boolean(val))}
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
                  onClick={() => {
                    if (!selectedCollection) {
                      alert("Please select a collection first!");
                      return;
                    }
                    setActivePage("newsnippet");
                  }}
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

        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((filter) => (
              <Badge
                key={filter}
                className="flex items-center space-x-2 px-3 py-1 bg-secondary text-secondary-foreground"
              >
                <span>{filter}</span>
                <X className="w-4 h-4 cursor-pointer" onClick={() => removeFilter(filter)} />
              </Badge>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hidden">
          {isLoadingSnippets ? (
            <p>Loading snippets...</p>
          ) : (
            finalSnippets
              .slice()
              .sort((a, b) => sortSnippets(a, b, sortOption, starredFirst))
              .map((snippet) => (
                <SnipItCard
                  key={snippet.id}
                  snippet={snippet}
                  onEdit={(id) => setEditingSnippetId(id)}
                  onDelete={handleDeleteSnippet}
                  onSelect={setSelectedSnippet}
                  onToggleStar={toggleStar}
                  collectionPath={selectedCollection?.path}
                />
              ))
          )}
        </div>
      </main>
    </div>
  );
};
