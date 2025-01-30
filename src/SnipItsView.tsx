import { useState, useEffect } from "react";
import { DiJavascript, DiHtml5, DiCss3 } from "react-icons/di";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, FileText, X, Search, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const fileExtensions: Record<string, string> = {
  JavaScript: "js",
  HTML: "html",
  CSS: "css",
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard!");
};

const downloadSnippet = (title: string, code: string, extension: string) => {
  const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${title}.${extension}`);
};

export const SnipItsView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [snippets, setSnippets] = useState<any[]>([]);

  const addFilter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const term = searchQuery.trim().toLowerCase();
      if (term !== "" && !filters.includes(term)) {
        setFilters([...filters, term]); // ✅ Only add if not in filters already
      }
      setSearchQuery(""); // ✅ Clear input
    }
  };

  const removeFilter = (filter: string) => {
    setFilters(filters.filter((f) => f !== filter)); // ✅ Remove correctly
  };

  const toggleFilter = (filter: string) => {
    if (filters.includes(filter.toLowerCase())) {
      setFilters(filters.filter((f) => f !== filter.toLowerCase())); // ✅ Remove tag if already selected
    } else {
      setFilters([...filters, filter.toLowerCase()]); // ✅ Add if not already selected
    }
  };

  const filteredSnippets = snippets.filter((snippet) => {
    const searchTerms = [...filters, searchQuery.trim().toLowerCase()].filter(Boolean);
    return searchTerms.every((term) =>
      [snippet.title, snippet.description, ...snippet.tags, snippet.language]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  });

  return (
    <div className="h-full flex">
      <aside className="w-64 p-4 border-r">
        <h2 className="text-lg font-bold mb-4">Search</h2>
        <div className="space-y-2">
        <Button
          variant={filters.includes("javascript") ? "secondary" : "ghost"} 
          className="w-full justify-start"
          onClick={() => toggleFilter("JavaScript")}
        >
          <DiJavascript className="w-4 h-4" />
          <span className="ml-2">JavaScript</span>
        </Button>

        <Button
          variant={filters.includes("html") ? "secondary" : "ghost"} 
          className="w-full justify-start"
          onClick={() => toggleFilter("HTML")}
        >
          <DiHtml5 className="w-4 h-4" />
          <span className="ml-2">HTML</span>
        </Button>

        <Button
          variant={filters.includes("css") ? "secondary" : "ghost"} 
          className="w-full justify-start"
          onClick={() => toggleFilter("CSS")}
        >
          <DiCss3 className="w-4 h-4" />
          <span className="ml-2">CSS</span>
        </Button>

        </div>
      </aside>

      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        {/* ✅ Search Bar */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search snippets..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={addFilter}
            />
          </div>
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


        {/* ✅ Snippets List (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hidden">
          {filteredSnippets.length === 0 ? (
            <p className="text-muted-foreground">No snippets found.</p>
          ) : (
            filteredSnippets.map((snippet) => (
              <Card key={snippet.id} className="relative border bg-muted">
                <CardHeader className="relative">
                  <CardTitle>{snippet.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{snippet.description}</p>

                  {/* ✅ Copy, Edit, and Delete Buttons */}
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
                  <pre className="overflow-x-auto">{snippet.code}</pre>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
