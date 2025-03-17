import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MonacoEditor from "@monaco-editor/react";
import { ThemeProvider } from "@/components/theme-provider";
import {
  Save,
  X,
  Loader2,
  Bot,
  BotOff,
  ShieldCheck,
  ShieldX,
  Undo2,
  Redo2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSnippetById, saveSnippet, Snippet } from "@/lib/SnipItService";
import { Collection } from "@/lib/CollectionsService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { invoke } from "@tauri-apps/api/tauri";
import { completeSnippetMetadata } from "@/lib/modelService";

// Framer Motion
import { motion } from "framer-motion";

// Tooltip components
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface SnipItFormProps {
  snippetId?: string;
  onClose: () => void;
  onSave: () => void;
  selectedCollection?: Collection | null;
}

const MAX_TAGS = 10;

// Lock icon animation variants – starting 10px below and hidden, then moving up.
const lockIconVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: -13.5, opacity: 1 },
};

export const SnipItForm: React.FC<SnipItFormProps> = ({
  snippetId,
  onClose,
  onSave,
  selectedCollection,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State declarations
  const [titleLocked, setTitleLocked] = useState(!!snippetId);
  const [descriptionLocked, setDescriptionLocked] = useState(!!snippetId);
  const [languageLocked, setLanguageLocked] = useState(!!snippetId);
  // const [framework, setFramework] = useState("");
  // const [frameworkLocked, setFrameworkLocked] = useState(!!snippetId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Undo/Redo states
  const [undoState, setUndoState] = useState<Snippet | null>(null);
  const [redoState, setRedoState] = useState<Snippet | null>(null);

  // AI loading state
  const [isAiLoading, setIsAiLoading] = useState(false);
  // Model selection state (initially blank)
  const [selectedModel, setSelectedModel] = useState<string>("");

  // Ref to track if generation was cancelled.
  const aiCancelledRef = useRef(false);

  const snippetQueryKey = [
    "snippet",
    snippetId || "",
    selectedCollection?.path || "default",
  ];

  // Load snippet if editing
  const { data, error } = useQuery<Snippet | null>({
    queryKey: snippetQueryKey,
    queryFn: () => getSnippetById(snippetId!, selectedCollection?.path),
    enabled: Boolean(snippetId),
  });

  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setDescription(data.description ?? "");
      setCode(data.code);
      setLanguage(data.language ?? "");
      setTags(data.tags ?? []);
      if (data.locks) {
        setTitleLocked(data.locks.title);
        setDescriptionLocked(data.locks.description);
        setLanguageLocked(data.locks.language);
        // setFrameworkLocked(data.locks.framework);
      }
      // if ("framework" in data) {
      //   setFramework((data as any).framework || "");
      // }
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load snippet.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Load selected model from localStorage on mount.
  useEffect(() => {
    const saved = localStorage.getItem("selectedModel");
    if (saved) {
      setSelectedModel(saved);
    }
  }, []);

  // Save snippet mutation
  const saveMutation = useMutation({
    mutationFn: (snippetData: Snippet) =>
      saveSnippet(snippetData, selectedCollection?.path),
    onSuccess: () => {
      toast({
        title: "Success",
        description: snippetId
          ? "SnipIt updated successfully."
          : "SnipIt saved successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["snippets", selectedCollection?.path || ""],
      });
      onSave();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save SnipIt.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSnippet = () => {
    if (!title || !code) {
      toast({
        title: "Error",
        description: "Title and code are required.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedCollection?.path) {
      toast({
        title: "Error",
        description: "No collection selected. Please select a collection first.",
        variant: "destructive",
      });
      return;
    }

    const isExistingSnippet = !!snippetId;
    const id =
      snippetId || Math.floor(100000000 + Math.random() * 900000000).toString();
    const finalTags = tags.length > 0 ? tags : ["unlabeled"];
    const creationDate =
      isExistingSnippet && data ? data.date : new Date().toISOString();
    const snippetData: Snippet = {
      id,
      title,
      description,
      code,
      language,
      // framework,
      tags: finalTags,
      starred: data?.starred ?? false,
      date: creationDate,
      lastEdited: new Date().toISOString(),
      locks: {
        title: titleLocked,
        description: descriptionLocked,
        language: languageLocked,
        // framework: frameworkLocked,
      },
    };
    saveMutation.mutate(snippetData);
  };

  /**
   * Cancel the ongoing AI generation.
   */
  const handleCancelGeneration = () => {
    aiCancelledRef.current = true;
    setIsAiLoading(false);
    toast({ title: "Cancelled", description: "AI generation cancelled." });
  };

  /**
   * AI metadata generation using the selected model.
   */
  const handleGenerateMetadata = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a code snippet first.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedModel) {
      toast({
        title: "Error",
        description: "Please select a model first.",
        variant: "destructive",
      });
      return;
    }
    // Reset cancellation flag and store current snippet for undo.
    aiCancelledRef.current = false;
    setUndoState({
      id: snippetId || "",
      title,
      description,
      code,
      language,
      tags,
      starred: false,
      date: "",
    });
    setRedoState(null);

    // Retrieve the selected model (from localStorage or state)
    const selectedModelFromStorage =
      localStorage.getItem("selectedModel") || "";

    setIsAiLoading(true);
    try {
      const result = await completeSnippetMetadata(
        code,
        selectedModelFromStorage,
        title,
        description,
        language,
        tags
      );
      if (aiCancelledRef.current) {
        console.log("Generation cancelled, ignoring result.");
        return;
      }
      if (result.error) {
        toast({
          title: "AI Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setTitle(titleLocked ? title : (result.title ?? ""));
        setDescription(descriptionLocked ? description : (result.description ?? ""));
        setLanguage(languageLocked ? language : (result.codeLanguage ?? ""));
        // setFramework(frameworkLocked ? framework : (result.framework ?? ""));
        setTags(result.tags || []);
        toast({
          title: "AI Completed",
          description: "Fields updated (unless locked).",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to complete with AI.",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUndo = () => {
    if (!undoState) {
      toast({
        title: "Nothing to Undo",
        description: "No previous version found.",
        variant: "destructive",
      });
      return;
    }
    const currentSnippet: Snippet = {
      id: snippetId || "",
      title,
      description,
      code,
      language,
      tags,
      starred: false,
      date: "",
    };
    setRedoState(currentSnippet);
    setTitle(undoState.title);
    setDescription(undoState.description ?? "");
    setCode(undoState.code);
    setLanguage(undoState.language);
    setTags(undoState.tags);
    toast({ title: "Undone", description: "Reverted to previous state." });
  };

  const handleRedo = () => {
    if (!redoState) {
      toast({
        title: "Nothing to Redo",
        description: "No next version found.",
        variant: "destructive",
      });
      return;
    }
    const currentSnippet: Snippet = {
      id: snippetId || "",
      title,
      description,
      code,
      language,
      tags,
      starred: false,
      date: "",
    };
    setUndoState(currentSnippet);
    setTitle(redoState.title);
    setDescription(redoState.description ?? "");
    setCode(redoState.code);
    setLanguage(redoState.language);
    setTags(redoState.tags);
    toast({ title: "Redone", description: "Restored next version." });
  };

  const handleAddTag = (newTag: string) => {
    if (tags.length >= MAX_TAGS) {
      toast({
        title: "Tag limit reached",
        description: `You cannot add more than ${MAX_TAGS} tags.`,
        variant: "destructive",
      });
      return;
    }
    setTags([...tags, newTag]);
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="relative h-full w-full flex flex-col bg-background text-foreground">
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-64 border-r border-border p-4 text-sm text-muted-foreground flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {snippetId ? "Edit Snippet" : "New Snippet"}
                </h2>

                {/* TITLE FIELD */}
                <h3 className="text-md font-semibold text-foreground mb-2">
                  Title
                </h3>
                <motion.div
                  className="mb-4 relative"
                  initial="hidden"
                  whileHover="visible"
                >
                  <Input
                    placeholder="Snippet Title"
                    value={title}
                    disabled={titleLocked || isAiLoading}
                    className={`w-full text-sm px-3 py-2 rounded-md ${
                      titleLocked
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-secondary text-secondary-foreground"
                    } ${isAiLoading ? "animate-pulse" : ""}`}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        type="button"
                        onClick={() => setTitleLocked(!titleLocked)}
                        variants={lockIconVariants}
                        transition={{ duration: 0.3 }}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded bg-secondary"
                      >
                        {titleLocked ? (
                          <ShieldX className="text-red-500 w-5 h-5" />
                        ) : (
                          <ShieldCheck className="text-white w-5 h-5" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {titleLocked ? "Unlock Title" : "Lock Title"}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>

                {/* DESCRIPTION FIELD */}
                <h3 className="text-md font-semibold text-foreground mb-2">
                  Description
                </h3>
                <motion.div
                  className="mb-4 relative"
                  initial="hidden"
                  whileHover="visible"
                >
                  <Input
                    placeholder="Description (optional)"
                    value={description}
                    disabled={descriptionLocked || isAiLoading}
                    className={`w-full text-sm px-3 py-2 rounded-md ${
                      descriptionLocked
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-secondary text-secondary-foreground"
                    } ${isAiLoading ? "animate-pulse" : ""}`}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        type="button"
                        onClick={() => setDescriptionLocked(!descriptionLocked)}
                        variants={lockIconVariants}
                        transition={{ duration: 0.3 }}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded bg-secondary"
                      >
                        {descriptionLocked ? (
                          <ShieldX className="text-red-500 w-5 h-5" />
                        ) : (
                          <ShieldCheck className="text-white w-5 h-5" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {descriptionLocked ? "Unlock Description" : "Lock Description"}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>

                {/* FRAMEWORK FIELD */}
                {/* <h3 className="text-md font-semibold text-foreground mb-2">
                  Framework
                </h3>
                <motion.div
                  className="mb-4 relative"
                  initial="hidden"
                  whileHover="visible"
                >
                  <Input
                    placeholder="Framework (optional)"
                    value={framework}
                    disabled={frameworkLocked || isAiLoading}
                    className={`w-full text-sm px-3 py-2 rounded-md ${
                      frameworkLocked
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-secondary text-secondary-foreground"
                    } ${isAiLoading ? "animate-pulse" : ""}`}
                    onChange={(e) => setFramework(e.target.value)}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        type="button"
                        onClick={() => setFrameworkLocked(!frameworkLocked)}
                        variants={lockIconVariants}
                        transition={{ duration: 0.3 }}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded bg-secondary"
                      >
                        {frameworkLocked ? (
                          <ShieldX className="text-red-500 w-5 h-5" />
                        ) : (
                          <ShieldCheck className="text-white w-5 h-5" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {frameworkLocked ? "Unlock Framework" : "Lock Framework"}
                    </TooltipContent>
                  </Tooltip>
                </motion.div> */}

                {/* LANGUAGE FIELD */}
                <h3 className="text-md font-semibold text-foreground mb-2">
                  Language
                </h3>
                <motion.div
                  className="mb-4 relative"
                  initial="hidden"
                  whileHover="visible"
                >
                  <Input
                    placeholder="Language"
                    value={language}
                    disabled={languageLocked || isAiLoading}
                    className={`w-full text-sm px-3 py-2 rounded-md ${
                      languageLocked
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-secondary text-secondary-foreground"
                    } ${isAiLoading ? "animate-pulse" : ""}`}
                    onChange={(e) => setLanguage(e.target.value)}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        type="button"
                        onClick={() => setLanguageLocked(!languageLocked)}
                        variants={lockIconVariants}
                        transition={{ duration: 0.3 }}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded bg-secondary"
                      >
                        {languageLocked ? (
                          <ShieldX className="text-red-500 w-5 h-5" />
                        ) : (
                          <ShieldCheck className="text-white w-5 h-5" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {languageLocked ? "Unlock Language" : "Lock Language"}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>

                {/* TAGS */}
                <h3 className="text-md font-semibold text-foreground mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      title={tag}
                      className="hover:bg-accent hover:text-secondary px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs cursor-pointer max-w-[6.5rem] overflow-hidden whitespace-nowrap text-ellipsis"
                    >
                      {tag.length > 10 ? tag.slice(0, 10) + "…" : tag}
                    </Badge>
                  ))}
                </div>
                <Input
                  type="text"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const newTag = tagInput.trim();
                      if (newTag) {
                        handleAddTag(newTag);
                      }
                      setTagInput("");
                    }
                  }}
                  className={`w-full text-sm px-3 py-2 rounded-md ${
                    isAiLoading
                      ? "animate-pulse bg-gray-200 text-gray-600 cursor-not-allowed"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                  disabled={isAiLoading}
                />
              </div>

              {/* UNDO - AI METADATA - REDO */}
              <div className="mt-4 flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={handleUndo}
                      disabled={!undoState || isAiLoading}
                      className="p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Undo2 className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Undo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-accent hover:bg-accent/80 text-white rounded-md"
                      onClick={handleGenerateMetadata}
                      disabled={isAiLoading || !selectedModel}
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : selectedModel ? (
                        <Bot className="w-5 h-5" />
                      ) : (
                        <BotOff className="w-5 h-5" />
                      )}
                      <span>AI Metadata</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {selectedModel
                      ? "Generate snippet metadata with AI"
                      : "Select a model to enable AI"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={handleRedo}
                      disabled={!redoState || isAiLoading}
                      className="p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Redo2 className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Redo</TooltipContent>
                </Tooltip>
              </div>
            </aside>

            {/* CODE EDITOR */}
            <div className="flex-1 overflow-auto hide-scrollbar">
              <MonacoEditor
                height="100%"
                language={
                  language === "C++"
                    ? "cpp"
                    : language?.toLowerCase() || "plaintext"
                }
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  scrollbar: { vertical: "hidden", horizontal: "hidden" },
                  overviewRulerLanes: 0,
                }}
              />
            </div>
          </div>

          {/* FOOTER BUTTONS (SAVE + CANCEL) */}
          <div className="absolute bottom-6 right-6 flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md"
                  onClick={handleSaveSnippet}
                  disabled={isAiLoading}
                >
                  <Save className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save snippet</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md"
                  onClick={onClose}
                  disabled={isAiLoading}
                >
                  <X className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close without saving</TooltipContent>
            </Tooltip>
          </div>

          {/* OVERLAY LOADING INDICATOR */}
          {isAiLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <span className="mt-4 text-white text-lg">
                Generating metadata, please wait...
              </span>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleCancelGeneration}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
};
