import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCollections, addCollection, removeCollection, Collection } from "@/lib/CollectionsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Trash, X, Check } from "lucide-react";
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
import { dialog } from "@tauri-apps/api";
import { useToast } from "@/hooks/use-toast";

export const settingsMeta = {
  name: "Collections",
  icon: <FolderOpen className="w-4 h-4" />,
  group: "Main",
  order: 3,
};

export default function Collections() {
  const [newCollection, setNewCollection] = useState<{ name: string; path: string } | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collections = [], isLoading } = useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: getCollections,
  });

  const addCollectionMutation = useMutation({
    mutationFn: async (collection: { name: string; path: string }) => {
      return await addCollection({
        id: crypto.randomUUID(),
        name: collection.name,
        path: collection.path,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setNewCollection(null);
      toast({ title: "Collection Added", description: "New collection added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add collection.", variant: "destructive" });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await removeCollection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setCollectionToDelete(null);
      toast({ title: "Collection Removed", description: "Collection has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove collection.", variant: "destructive" });
    },
  });

  const handleSelectFolder = async () => {
    const selected = await dialog.open({ directory: true });
    if (selected && typeof selected === "string") {
      setNewCollection((prev) => ({ ...prev!, path: selected }));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Collections</h1>
      <p className="mb-4">Manage multiple collection directories.</p>
      <Button variant="outline" onClick={() => setNewCollection({ name: "", path: "" })}>
        <FolderOpen className="w-4 h-4 mr-1" /> Add Collection
      </Button>
      {newCollection && (
        <div className="flex items-center gap-3 border p-2 rounded-md mt-3">
          <Input
            type="text"
            placeholder="Collection Name"
            value={newCollection.name}
            onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
            className="flex-1"
          />
          <Input
            type="text"
            placeholder="Select Folder..."
            value={newCollection.path}
            onClick={handleSelectFolder}
            readOnly
            className="flex-1 cursor-pointer truncate"
          />
          <Button size="icon" variant="outline" onClick={() => addCollectionMutation.mutate(newCollection!)}>
            <Check className="w-5 h-5 text-green-600" />
          </Button>
          <Button size="icon" variant="outline" onClick={() => setNewCollection(null)}>
            <X className="w-5 h-5 text-red-600" />
          </Button>
        </div>
      )}
      {isLoading ? (
        <p className="mt-3">Loading...</p>
      ) : (
        <div className="mt-4 space-y-2">
          {collections.map((col: Collection) => (
            <div key={col.id} className="p-3 bg-secondary text-secondary-foreground rounded-md shadow-sm flex items-center justify-between">
              <div className="flex flex-col w-[80%]">
                <span className="font-medium truncate">{col.name}</span>
                <span className="text-xs truncate text-muted-foreground">{col.path}</span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setCollectionToDelete(col)}>
                    <Trash className="w-4 h-4 text-red-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The collection <b>{collectionToDelete?.name}</b> will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCollectionToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteCollectionMutation.mutate(col.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
