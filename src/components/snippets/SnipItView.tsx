import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Pencil, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSnippetMutations } from "@/lib/SnipItService";

export type SnipItViewProps = {
  snippet: {
    id: string;
    title: string;
    description?: string;
    language: string;
    code: string;
    date: string;
    tags: string[];
  };
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  collectionPath?: string;
  languageMapping?: Record<string, string>;
};

export const SnipItView: React.FC<SnipItViewProps> = ({
  snippet,
  onClose,
  onEdit,
  onDelete,
  collectionPath,
  languageMapping,
}) => {
  const { toast } = useToast();
  const { deleteMutation } = useSnippetMutations();

  const mapping = languageMapping ?? {
    "C++": "cpp",
    "C#": "csharp",
    "Arduino C": "c",
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippet.code);
    toast({ title: "Copied", description: "Snippet code copied to clipboard." });
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: snippet.id, overridePath: collectionPath },
      {
        onSuccess: () => {
          toast({ title: "Deleted", description: "Snippet deleted successfully." });
          onDelete(snippet.id);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete snippet.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground relative">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-border p-4 text-sm text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground mb-3">{snippet.title}</h2>
          <p className="mb-4">{snippet.description || "No Description"}</p>
          <p className="font-bold text-foreground mb-1">Language</p>
          <p className="mb-4">{snippet.language}</p>
          <p className="font-bold text-foreground mb-1">Created At</p>
          <p className="mb-4">{new Date(snippet.date).toLocaleString()}</p>
          <h3 className="text-md font-semibold text-foreground mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {snippet.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                {tag}
              </span>
            ))}
          </div>
        </aside>
        <div className="flex-1 overflow-auto p-4 hide-scrollbar">
          <SyntaxHighlighter
            language={mapping[snippet.language] || snippet.language.toLowerCase()}
            style={tomorrow}
            showLineNumbers
            customStyle={{
              backgroundColor: "inherit",
              padding: "1rem",
              borderRadius: "0",
              fontSize: "0.95rem",
              lineHeight: "1.5",
              whiteSpace: "pre",
              fontFamily: "monospace",
            }}
          >
            {snippet.code}
          </SyntaxHighlighter>
        </div>
      </div>
      <div className="absolute bottom-6 right-6 flex space-x-2">
        <Button variant="ghost" className="flex items-center gap-2 px-4 py-3 bg-secondary text-primary rounded-md" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="ghost" className="flex items-center justify-center gap-1 px-4 py-3 bg-secondary text-primary rounded-md" onClick={handleCopyCode}>
          <Copy className="w-5 h-5" />
        </Button>
        <Button variant="ghost" className="flex items-center justify-center gap-1 px-4 py-3 bg-secondary text-primary rounded-md" onClick={() => onEdit(snippet.id)}>
          <Pencil className="w-5 h-5" />
        </Button>
        <Button variant="ghost" className="flex items-center justify-center gap-1 px-4 py-3 bg-secondary text-red-500 rounded-md" onClick={handleDelete}>
          <Trash className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
