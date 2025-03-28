import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCollections, addCollection, removeCollection, Collection } from "@/lib/CollectionsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Trash } from "lucide-react";
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
  description: "Manage multiple collection directories.",
  icon: <FolderOpen className="w-4 h-4" />,
  group: "Main",
  order: 3,
  visible: true,
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
      <h1 className="text-2xl font-bold">{settingsMeta.name}</h1>
      <p className="mb-4">{settingsMeta.description}</p>
      <div className="space-y-4">
        {/* Add Collection Area */}
        <div className="border p-4 rounded-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Collection</h3>
            {!newCollection && (
              <Button variant="outline" onClick={() => setNewCollection({ name: "", path: "" })}>
                Add Collection
              </Button>
            )}
          </div>
          {newCollection && (
            <div className="mt-4 space-y-3">
              <Input
                type="text"
                placeholder="Collection Name"
                value={newCollection.name}
                onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
              />
              <Input
                type="text"
                placeholder="Select Folder..."
                value={newCollection.path}
                onClick={handleSelectFolder}
                readOnly
                className="cursor-pointer truncate"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewCollection(null)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={() => addCollectionMutation.mutate(newCollection!)}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Collections List */}
        {isLoading ? (
          <p className="mt-3">Loading...</p>
        ) : (
          collections.map((col: Collection) => (
            <div key={col.id} className="border p-4 rounded-md flex items-center justify-between">
              <div className="flex flex-col">
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
          ))
        )}
      </div>
    </div>
  );
}
