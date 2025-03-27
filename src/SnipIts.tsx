import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Folders,
  Filter,
  ChevronUp,
  ChevronDown,
  Tag,
} from "lucide-react";
import Icon from "@mdi/react";
import {
  mdiLanguageJavascript,
  mdiLanguageCsharp,
  mdiLanguagePython,
  mdiLanguageC,
  mdiLanguageCpp,
  mdiLanguageJava,
  mdiLanguageGo,
  mdiLanguageRust,
  mdiLanguagePhp,
  mdiLanguageHtml5,
  mdiLanguageCss3,
  mdiLanguageSwift,
  mdiLanguageKotlin,
  mdiLanguageRuby,
  mdiLanguageTypescript,
  mdiLanguageMarkdown,
  mdiLanguageLua,
  mdiLanguageHaskell,
  mdiCodeBraces,
  mdiBash,
} from "@mdi/js";

const languageIcons: Record<string, string> = {
    javascript: mdiLanguageJavascript,
    typescript: mdiLanguageTypescript,
    python: mdiLanguagePython,
    c: mdiLanguageC,
    cpp: mdiLanguageCpp,
    csharp: mdiLanguageCsharp,
    java: mdiLanguageJava,
    go: mdiLanguageGo,
    rust: mdiLanguageRust,
    php: mdiLanguagePhp,
    html: mdiLanguageHtml5,
    css: mdiLanguageCss3,
    swift: mdiLanguageSwift,
    kotlin: mdiLanguageKotlin,
    ruby: mdiLanguageRuby,
    markdown: mdiLanguageMarkdown,
    lua: mdiLanguageLua,
    haskell: mdiLanguageHaskell,
    bash: mdiBash,
  };

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SnipItCard } from "./components/snippets/SnipItCard";
import { SnipItForm } from "./components/snippets/SnipItForm";
import { SnipItView } from "./components/snippets/SnipItView";
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

export const SnipIts = () => {
  // States for snippet management
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  // UI state for filters, search, and collections
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [isLanguagesOpen, setIsLanguagesOpen] = useState(true);
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [starredFirst, setStarredFirst] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCollectionPopoverOpen, setIsCollectionPopoverOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const { data: collections = [], isLoading: isLoadingCollections } = useCollectionsQuery();
  const { data: snippets = [], refetch: refetchSnippets, isLoading: isLoadingSnippets } =
    useSnippetsQuery(selectedCollection?.path);

  // Load saved collection on mount
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
  }, [collections]);

  const availableLanguages = useMemo(() => {
    return Array.from(new Set(snippets.map((s) => s.language).filter(Boolean)));
  }, [snippets]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      const normalizedSearch = searchQuery.trim().toLowerCase();
      if (!filters.includes(normalizedSearch)) {
        setFilters([...filters, normalizedSearch]);
      }
      setSearchQuery("");
    }
  };

  const handleCollectionSelect = async (col: Collection) => {
    setSelectedCollection(col);
    await saveSettings({ selectedCollectionId: col.id });
    refetchSnippets();
    setIsCollectionPopoverOpen(false);
  };

  const removeFilter = (filter: string) => {
    setFilters((prev) => prev.filter((f) => f !== filter));
  };

  const toggleFilter = (filter: string) => {
    const normalized = filter.toLowerCase();
    setFilters((prev) =>
      prev.includes(normalized) ? prev.filter((f) => f !== normalized) : [...prev, normalized]
    );
  };

  const toggleStar = () => {
    refetchSnippets();
  };

  const handleDeleteSnippet = (id: string) => {
    refetchSnippets();
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null);
    }
  };

  const sideFiltered = useMemo(() => {
    return filterBySide(snippets, filters, availableLanguages);
  }, [snippets, filters, availableLanguages]);

  const finalSnippets = useMemo(() => {
    return filterBySearch(sideFiltered, searchQuery);
  }, [sideFiltered, searchQuery]);

  const SectionToggle = ({
    title,
    isOpen,
    onToggle,
  }: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 text-md font-semibold text-muted-foreground hover:text-foreground transition-all"
    >
      <span>{title}</span>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-4 h-4">
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </motion.div>
    </button>
  );

  const topTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    snippets.forEach((snippet) => {
      snippet.tags?.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [snippets]);

  if (editingSnippetId !== null) {
    return (
      <SnipItForm
        snippetId={editingSnippetId || undefined}
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
        onEdit={(id) => setEditingSnippetId(id)}
        onDelete={handleDeleteSnippet}
        collectionPath={selectedCollection?.path}
      />
    );
  }

  // Main list view
  return (
    <div className="h-full flex">
      {/* Sidebar with filters and collection selector */}
      <div className="w-64 p-4 border-r flex flex-col">
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hidden">
          {/* Favorites Section */}
          <SectionToggle
            title="Favorites"
            isOpen={isFavoritesOpen}
            onToggle={() => setIsFavoritesOpen(!isFavoritesOpen)}
          />
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={isFavoritesOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
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
            </div>
          </motion.div>

          {/* Languages Section */}
          <SectionToggle
            title="Languages"
            isOpen={isLanguagesOpen}
            onToggle={() => setIsLanguagesOpen(!isLanguagesOpen)}
          />
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={isLanguagesOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {availableLanguages.length > 0 && (
              <div className="space-y-2">
                {availableLanguages.map((lang) => (
                  <Button
                    key={lang}
                    variant={filters.includes(lang) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => toggleFilter(lang)}
                  >
                    <Icon
                      path={languageIcons[lang.toLowerCase()] || mdiCodeBraces}
                      size={0.8}
                      className="mr-2"
                    />
                    <span>{lang}</span>
                  </Button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Tags Section */}
          <SectionToggle
            title="Tags"
            isOpen={isTagsOpen}
            onToggle={() => setIsTagsOpen(!isTagsOpen)}
          />
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={isTagsOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {topTags.length > 0 && (
              <div className="space-y-2">
                {topTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={filters.includes(tag) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => toggleFilter(tag)}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    <span>{tag}</span>
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Collection Selector */}
        <div className="mt-4 bg-background sticky bottom-0 left-0 w-full pt-4 border-t">
          <Popover open={isCollectionPopoverOpen} onOpenChange={setIsCollectionPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between">
                {selectedCollection?.name ?? "Select Collection"}
                {isCollectionPopoverOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
      </div>

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
                onKeyDown={handleSearchKeyDown}
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
                  onClick={() => setEditingSnippetId("")}
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
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            {filters.map((filter, index) => (
              <Badge
                key={index}
                onClick={() => removeFilter(filter)}
                title={filter}
                className="hover:bg-accent hover:text-secondary px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs cursor-pointer max-w-[6.5rem] overflow-hidden whitespace-nowrap text-ellipsis"
              >
                {filter.length > 10 ? filter.slice(0, 10) + "…" : filter}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hidden">
          {isLoadingSnippets ? (
            <p>Loading snippets...</p>
          ) : finalSnippets.length === 0 ? (
            <div className="text-center flex flex-col items-center justify-center gap-4 h-full">
              <img
                src=""
                alt="Placeholder"
                className="w-48 h-48 object-cover rounded-md shadow"
              />
              <p className="text-muted-foreground text-lg">
                Uh-oh, it's looking pretty empty in here...
              </p>
              <Button
                onClick={() => setEditingSnippetId("")}
                variant="secondary"
                className="px-6 py-2"
              >
                Create your first SnipIt
              </Button>
            </div>
            // check if theres more than 0 snippets there are search results
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
