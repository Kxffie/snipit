import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Pencil, Copy, Trash } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Snippet, toggleStarSnippet, deleteSnippet } from "@/utils/SnipItService";
import { useToast } from "@/hooks/use-toast";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type SnipItCardProps = {
  snippet: Snippet;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (snippet: Snippet) => void;
};

export const SnipItCard = ({ snippet, onEdit, onDelete, onSelect }: SnipItCardProps) => {
  const { toast } = useToast();

  const handleToggleStar = async () => {
    if (await toggleStarSnippet(snippet.id)) {
      toast({
        title: snippet.starred ? "Unstarred" : "Starred",
        description: `Snippet ${snippet.starred ? "removed from" : "added to"} favorites.`,
      });
    }
  };

  const handleDelete = async () => {
    if (await deleteSnippet(snippet.id)) {
      toast({
        title: "Deleted",
        description: "Snippet deleted successfully.",
      });
      onDelete(snippet.id);
    } else {
      toast({
        title: "Error",
        description: "Failed to delete snippet.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border bg-muted p-3 rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-2 min-w-0">
        <div className="min-w-0 cursor-pointer" onClick={() => onSelect(snippet)}>
          <CardTitle className="text-xl font-semibold text-accent hover:underline">
            {snippet.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground truncate">{snippet.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button size="icon" variant="ghost" onClick={handleToggleStar}>
            <Star className={`w-4 h-4 ${snippet.starred ? "text-yellow-400" : ""}`} />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onEdit(snippet.id)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(snippet.code)}>
            <Copy className="w-4 h-4" />
          </Button>

          {/* Delete Confirmation Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The snippet will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Code Preview */}
      <CardContent className="bg-background p-3 rounded-md border">
        <SyntaxHighlighter
          language={snippet.language.toLowerCase()}
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
  );
};
