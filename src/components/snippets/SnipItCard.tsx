import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Star, Pencil, Copy, Trash } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Snippet, useSnippetMutations } from "@/lib/SnipItService";
import { useToast } from "@/hooks/use-toast";

type SnipItCardProps = {
  snippet: Snippet;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (snippet: Snippet) => void;
  onToggleStar: (id: string, newStarredValue: boolean) => void;
  collectionPath?: string;
};

export const SnipItCard = ({
  snippet,
  onEdit,
  onDelete,
  onSelect,
  onToggleStar,
  collectionPath,
}: SnipItCardProps) => {
  const { toast } = useToast();
  const { toggleStarMutation, deleteMutation } = useSnippetMutations();

  const handleToggleStar = () => {
    toggleStarMutation.mutate(
      { id: snippet.id, overridePath: collectionPath },
      {
        onSuccess: () => {
          onToggleStar(snippet.id, !snippet.starred);
          toast({
            title: snippet.starred ? "Unstarred" : "Starred",
            description: `Snippet ${
              snippet.starred ? "removed from" : "added to"
            } favorites.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to toggle star.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: snippet.id, overridePath: collectionPath },
      {
        onSuccess: () => {
          toast({
            title: "Deleted",
            description: "Snippet deleted successfully.",
          });
          onDelete(snippet.id);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete snippet.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const renamedVariables: Record<string, string> = {
    "C++": "cpp",
    "C#": "csharp",
    "Arduino C": "c",
  };

  return (
    <>
      <Card className="border bg-muted p-3 rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-2 min-w-0">
          <div className="min-w-0 cursor-pointer" onClick={() => onSelect(snippet)}>
            <CardTitle className="text-xl font-semibold text-accent hover:underline">
              {snippet.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {snippet.description}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button size="icon" variant="ghost" onClick={handleToggleStar}>
              <Star className={`w-4 h-4 ${snippet.starred ? "text-yellow-400" : ""}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <EllipsisVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(snippet.code)}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Code
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(snippet.id)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={handleDelete}
                >
                  <Trash className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardContent className="bg-background p-3 rounded-md border">
          <SyntaxHighlighter
            language={renamedVariables[snippet.language] || snippet.language.toLowerCase()}
            style={tomorrow}
            showLineNumbers
            customStyle={{
              backgroundColor: "inherit",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              fontSize: "0.9rem",
              lineHeight: "1.4",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflow: "auto",
            }}
          >
            {snippet.code.split("\n").length > 9
              ? snippet.code.split("\n").slice(0, 9).join("\n") + "\n..."
              : snippet.code}
          </SyntaxHighlighter>
        </CardContent>
      </Card>
    </>
  );
};
