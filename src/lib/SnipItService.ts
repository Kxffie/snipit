import { fs } from "@tauri-apps/api";
import { loadSettings } from "@/db/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Snippet = {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  framework?: string; // new field
  tags: string[];
  starred: boolean;
  date: string;
  lastEdited?: string;
  locks?: {
    title: boolean;
    description: boolean;
    language: boolean;
    // framework: boolean; // new lock for framework
  };
};




export type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc";

export const loadSnippets = async (overridePath?: string): Promise<Snippet[]> => {
  try {
    const settings = await loadSettings();
    const collectionPath = overridePath ?? settings.collectionPath;
    if (!collectionPath) {
      console.warn("No collection path provided or found in settings.");
      return [];
    }
    const files = await fs.readDir(collectionPath);
    const snippets: Snippet[] = [];
    for (const file of files) {
      if (file.name?.endsWith(".json")) {
        const content = await fs.readTextFile(`${collectionPath}/${file.name}`);
        snippets.push(JSON.parse(content));
      }
    }
    return snippets;
  } catch (error) {
    console.error("Error loading snippets:", error);
    return [];
  }
};

export const getSnippetById = async (id: string, overridePath?: string): Promise<Snippet | null> => {
  try {
    const settings = await loadSettings();
    const collectionPath = overridePath ?? settings.collectionPath;
    if (!collectionPath) {
      throw new Error("collectionPath is not defined in settings.");
    }
    const filePath = `${collectionPath}/${id}.json`;
    const content = await fs.readTextFile(filePath);
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading snippet ${id}:`, error);
    return null;
  }
};

export const saveSnippet = async (snippet: Snippet, overridePath?: string): Promise<boolean> => {
  try {
    const settings = await loadSettings();
    const collectionPath = overridePath ?? settings.collectionPath;
    if (!collectionPath) {
      console.error("No collection path provided!");
      return false;
    }
    const filePath = `${collectionPath}/${snippet.id}.json`;
    await fs.writeTextFile(filePath, JSON.stringify(snippet, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving snippet:", error);
    return false;
  }
};

export const deleteSnippet = async (id: string, overridePath?: string): Promise<boolean> => {
  try {
    const settings = await loadSettings();
    const collectionPath = overridePath ?? settings.collectionPath;
    if (!collectionPath) {
      console.error("No collection path provided!");
      return false;
    }
    const filePath = `${collectionPath}/${id}.json`;
    await fs.removeFile(filePath);
    return true;
  } catch (error: any) {
    if (error?.message && error.message.includes("os error 2")) {
      console.warn(`File not found for snippet ${id}; treating as deleted.`);
      return true;
    }
    console.error(`Error deleting snippet ${id}:`, error);
    return false;
  }
};



export const toggleStarSnippet = async (id: string, overridePath?: string): Promise<boolean> => {
  try {
    const snippet = await getSnippetById(id, overridePath);
    if (!snippet) return false;
    snippet.starred = !snippet.starred;
    return await saveSnippet(snippet, overridePath);
  } catch (error) {
    console.error(`Error toggling star for snippet ${id}:`, error);
    return false;
  }
};

export const filterSnippetsByQuery = (snippets: Snippet[], query: string): Snippet[] => {
  if (!query.trim()) return snippets;
  const terms = query.toLowerCase().match(/(\w+:"[^"]+"|\w+:\S+|\S+)/g) || [];
  return snippets.filter(snippet =>
    terms.every(term => {
      let [field, value] = term.includes(":") ? term.split(":") : ["all", term];
      value = value.replace(/^"|"$/g, "").toLowerCase();
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
          return snippet.tags.some(tag => tag.toLowerCase().includes(value));
        case "all":
        default:
          return (
            snippet.title.toLowerCase().includes(value) ||
            (snippet.description ?? "").toLowerCase().includes(value) ||
            snippet.code.toLowerCase().includes(value) ||
            snippet.language.toLowerCase().includes(value) ||
            snippet.tags.some(tag => tag.toLowerCase().includes(value))
          );
      }
    })
  );
};

export const filterBySide = (
  allSnippets: Snippet[],
  filters: string[],
  availableLanguages: string[]
): Snippet[] => {
  return allSnippets.filter(snippet => {
    if (filters.includes("starred") && !snippet.starred) {
      return false;
    }
    if (filters.includes("unlabeled") && snippet.tags.length > 0) {
      return false;
    }
    const chosenLangs = filters.filter(f =>
      availableLanguages.map(lang => lang.toLowerCase()).includes(f)
    );
    if (chosenLangs.length > 0 && !chosenLangs.includes(snippet.language.toLowerCase())) {
      return false;
    }
    return true;
  });
};

export const filterBySearch = (allSnippets: Snippet[], query: string): Snippet[] => {
  if (!query.trim()) return allSnippets;
  const terms = query.toLowerCase().match(/(\w+:"[^"]+"|\w+:\S+|\S+)/g) || [];
  return allSnippets.filter(snippet =>
    terms.every(term => {
      let [field, value] = term.includes(":") ? term.split(":") : ["all", term];
      value = value.replace(/^"|"$/g, "").toLowerCase();
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
          return snippet.tags.some(tag => tag.toLowerCase().includes(value));
        case "all":
        default:
          return (
            snippet.title.toLowerCase().includes(value) ||
            (snippet.description ?? "").toLowerCase().includes(value) ||
            snippet.code.toLowerCase().includes(value) ||
            snippet.language.toLowerCase().includes(value) ||
            snippet.tags.some(tag => tag.toLowerCase().includes(value))
          );
      }
    })
  );
};

export const sortSnippets = (
  a: Snippet,
  b: Snippet,
  sortOption: SortOption,
  starredFirst: boolean
): number => {
  if (starredFirst) {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
  }
  switch (sortOption) {
    case "date-asc":
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    case "date-desc":
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    case "title-asc":
      return a.title.localeCompare(b.title);
    case "title-desc":
      return b.title.localeCompare(a.title);
    default:
      return 0;
  }
};

export const useSnippetsQuery = (overridePath?: string) => {
  return useQuery<Snippet[]>({
    queryKey: ["snippets", overridePath],
    queryFn: () => loadSnippets(overridePath),
  });
};

export const useSnippetMutations = () => {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (snippet: Snippet) => saveSnippet(snippet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, overridePath }: { id: string; overridePath?: string }) =>
      deleteSnippet(id, overridePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: ({ id, overridePath }: { id: string; overridePath?: string }) =>
      toggleStarSnippet(id, overridePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });

  return { saveMutation, deleteMutation, toggleStarMutation };
};
