import { fs } from "@tauri-apps/api";
import { loadSettings } from "@/db/db";

export type Snippet = {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
  starred: boolean;
  date: string;
};

/**
 * Retrieve all snippets from the collection directory.
 */
export const loadSnippets = async (overridePath?: string): Promise<Snippet[]> => {
  try {
    const settings = await loadSettings();
    const collectionPath = overridePath ?? settings.collectionPath;

    if (!collectionPath) {
      console.warn("No collection path specified or found in settings.");
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

/**
 * Retrieve a single snippet by its ID.
 */
export const getSnippetById = async (id: string): Promise<Snippet | null> => {
  try {
    const settings = await loadSettings();
    const filePath = `${settings.collectionPath}/${id}.json`;
    const content = await fs.readTextFile(filePath);
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading snippet ${id}:`, error);
    return null;
  }
};

/**
 * Save or update a snippet.
 */
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

/**
 * Remove a snippet by its ID.
 */
export const deleteSnippet = async (id: string): Promise<boolean> => {
  try {
    const settings = await loadSettings();
    const filePath = `${settings.collectionPath}/${id}.json`;
    await fs.removeFile(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting snippet ${id}:`, error);
    return false;
  }
};

/**
 * Switch the starred status of a snippet.
 */
export const toggleStarSnippet = async (id: string): Promise<boolean> => {
  try {
    const snippet = await getSnippetById(id);
    if (!snippet) return false;

    snippet.starred = !snippet.starred;
    return await saveSnippet(snippet);
  } catch (error) {
    console.error(`Error toggling star for snippet ${id}:`, error);
    return false;
  }
};

/**
 * Filter snippets based on a structured search query.
 * Supports field-specific queries: title, description, content (code), language, and tags.
 */
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
