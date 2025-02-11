// lib/FilterSnippets.ts
import { Snippet } from "@/lib/SnipItService";

export type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc";

/**
 * Filters snippets by side-menu toggles (e.g. starred, unlabeled, language).
 */
export function filterBySide(
  allSnippets: Snippet[],
  filters: string[],
  availableLanguages: string[]
): Snippet[] {
  return allSnippets.filter((snippet) => {
    // If "starred" is in filters, snippet must be starred
    if (filters.includes("starred") && !snippet.starred) {
      return false;
    }
    // If "unlabeled" is in filters, snippet must have 0 tags
    if (filters.includes("unlabeled") && snippet.tags.length > 0) {
      return false;
    }
    // If any language filters are chosen, snippet.language must match
    const chosenLangs = filters.filter((f) =>
      availableLanguages.map((lang) => lang.toLowerCase()).includes(f)
    );
    if (
      chosenLangs.length > 0 &&
      !chosenLangs.includes(snippet.language.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Filters snippets by text-based searches, e.g. "title:React content:\"useState\"".
 */
export function filterBySearch(allSnippets: Snippet[], query: string): Snippet[] {
  if (!query.trim()) return allSnippets;

  // e.g. ["title:react", "content:\"useState\""]
  const terms =
    query.toLowerCase().match(/(\w+:"[^"]+"|\w+:\S+|\S+)/g) || [];

  return allSnippets.filter((snippet) =>
    terms.every((term) => {
      let [field, value] = term.includes(":")
        ? term.split(":")
        : ["all", term];
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
          return snippet.tags.some((tag) => tag.toLowerCase().includes(value));
        case "all":
        default:
          // If no field is specified, search everything
          return (
            snippet.title.toLowerCase().includes(value) ||
            (snippet.description ?? "").toLowerCase().includes(value) ||
            snippet.code.toLowerCase().includes(value) ||
            snippet.language.toLowerCase().includes(value) ||
            snippet.tags.some((tag) => tag.toLowerCase().includes(value))
          );
      }
    })
  );
}

/**
 * Sorts two snippets given a sort option and whether "starred first" is enabled.
 */
export function sortSnippets(
  a: Snippet,
  b: Snippet,
  sortOption: SortOption,
  starredFirst: boolean
): number {
  // If "Starred First" is toggled, starred snippets always come first
  if (starredFirst) {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
  }

  // Then apply chosen sortOption
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
}
