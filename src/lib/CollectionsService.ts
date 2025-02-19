import { loadSettings, saveSettings } from "@/db/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Collection {
  id: string;
  path: string;
  name: string;
}

// Fetch the collections from settings.json.
export const getCollections = async (): Promise<Collection[]> => {
  const settings = await loadSettings();
  // Check that 'collections' is an array.
  if (!settings.collections || !Array.isArray(settings.collections)) {
    console.warn(
      "⚠️ 'collections' in settings.json is not an array. Resetting to an empty array."
    );
    return [];
  }
  return settings.collections;
};

// Add a new collection.
export const addCollection = async (newCollection: Collection): Promise<boolean> => {
  const settings = await loadSettings();
  let collections: Collection[] = settings.collections || [];

  // Confirm that collections is an array before modifying it.
  if (!Array.isArray(collections)) {
    console.error("❌ 'collections' is not an array. Resetting...");
    collections = [];
  }

  // Avoid duplicate collections.
  if (collections.some((col) => col.path === newCollection.path)) {
    console.warn("⚠️ Collection already exists:", newCollection.path);
    return false;
  }

  collections.push(newCollection);
  await saveSettings({ ...settings, collections });
  console.log("✅ Collection added:", newCollection.path);
  return true;
};

// Remove a collection by its ID.
export const removeCollection = async (collectionId: string): Promise<boolean> => {
  const settings = await loadSettings();
  let collections: Collection[] = settings.collections || [];

  // Confirm that collections is an array.
  if (!Array.isArray(collections)) {
    console.error("❌ 'collections' is not an array. Resetting...");
    collections = [];
  }

  const updatedCollections = collections.filter((col) => col.id !== collectionId);

  if (updatedCollections.length === collections.length) {
    console.warn("⚠️ Collection ID not found:", collectionId);
    return false;
  }

  await saveSettings({ ...settings, collections: updatedCollections });
  console.log("✅ Collection removed:", collectionId);
  return true;
};

// Check if collections exist; if not, reset to an empty array.
export const verifyCollectionsExist = async (): Promise<void> => {
  const settings = await loadSettings();
  if (!settings.collections || !Array.isArray(settings.collections)) {
    console.warn(
      "⚠️ 'collections' is missing or invalid in settings.json. Resetting to an empty array."
    );
    await saveSettings({ ...settings, collections: [] });
  }
};

// TanStack Query hook for fetching collections.
export const useCollectionsQuery = () => {
  return useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: getCollections,
  });
};

// TanStack Query hooks for mutations.
export const useCollectionsMutations = () => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (newCollection: Collection) => addCollection(newCollection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (collectionId: string) => removeCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  return { addMutation, removeMutation };
};
