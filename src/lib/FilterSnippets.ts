import { Snippet } from "@/lib/SnipItService";

export type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc";

/**
 * Filter snippets based on side-menu selections (e.g., starred, unlabeled, language).
 */
export function filterBySide(
  allSnippets: Snippet[],
  filters: string[],
  availableLanguages: string[]
): Snippet[] {
  return allSnippets.filter(snippet => {
    // If the "starred" filter is active, the snippet must be starred.
    if (filters.includes("starred") && !snippet.starred) {
      return false;
    }
    // If the "unlabeled" filter is active, the snippet must have no tags.
    if (filters.includes("unlabeled") && snippet.tags.length > 0) {
      return false;
    }
    // For language filters, the snippet's language must match one of the selected languages.
    const chosenLangs = filters.filter(f =>
      availableLanguages.map(lang => lang.toLowerCase()).includes(f)
    );
    if (chosenLangs.length > 0 && !chosenLangs.includes(snippet.language.toLowerCase())) {
      return false;
    }
    return true;
  });
}

/**
 * Filter snippets based on a text search query.
 * Example: "title:react content:\"useState\""
 */
export function filterBySearch(allSnippets: Snippet[], query: string): Snippet[] {
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
}

/**
 * Compare two snippets for sorting, given a sort option and a starred-first setting.
 */
export function sortSnippets(
  a: Snippet,
  b: Snippet,
  sortOption: SortOption,
  starredFirst: boolean
): number {
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
}
