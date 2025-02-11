import { ThemeProvider } from "@/components/theme-provider";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const SnipItView = ({ snippet, onClose }: { snippet: any; onClose: () => void }) => {
  return (
    <ThemeProvider>
      <div className="h-full w-full flex flex-col bg-background text-foreground">
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 border-r border-border p-4 text-sm text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground mb-3">{snippet.title}</h2>

            <p className="mb-2">
              <span className="font-bold text-foreground">Language: </span>
              {snippet.language}
            </p>
            <p className="mb-4">{snippet.description}</p>

            <h3 className="text-md font-semibold text-foreground mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {snippet.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </aside>

          <div className="flex-1 overflow-auto p-4 hide-scrollbar">
            <SyntaxHighlighter
              language={snippet.language.toLowerCase()}
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

        {/* Action Button */}
        <div className="absolute bottom-6 right-6">
          <Button variant="ghost" className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-primary rounded-md" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
        </div>
      </div>
    </ThemeProvider>
  );
};
