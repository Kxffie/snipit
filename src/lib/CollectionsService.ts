import { loadSettings, saveSettings } from "@/db/db";

export interface Collection {
  id: string;
  path: string;
  name: string;
}

export class CollectionsService {
  static async getCollections(): Promise<Collection[]> {
    const settings = await loadSettings();

    // Ensure `collections` is always an array
    if (!settings.collections || !Array.isArray(settings.collections)) {
      console.warn("⚠️ `collections` in settings.json is not an array. Resetting to an empty array.");
      return [];
    }

    return settings.collections;
  }

  static async addCollection(newCollection: Collection): Promise<boolean> {
    const settings = await loadSettings();
    let collections: Collection[] = settings.collections || [];

    // Ensure collections is an array before modifying it
    if (!Array.isArray(collections)) {
      console.error("❌ `collections` is not an array. Resetting...");
      collections = [];
    }

    // Prevent duplicate collections
    if (collections.some((col) => col.path === newCollection.path)) {
      console.warn("⚠️ Collection already exists:", newCollection.path);
      return false;
    }

    collections.push(newCollection);
    await saveSettings({ ...settings, collections });
    console.log("✅ Collection added:", newCollection.path);
    return true;
  }

  static async removeCollection(collectionId: string): Promise<boolean> {
    const settings = await loadSettings();
    let collections: Collection[] = settings.collections || [];

    // Ensure collections is an array
    if (!Array.isArray(collections)) {
      console.error("❌ `collections` is not an array. Resetting...");
      collections = [];
    }

    const updatedCollections = collections.filter((col) => col.id !== collectionId);

    if (updatedCollections.length === collections.length) {
      console.warn("⚠️ Collection ID not found:", collectionId);
      return false; // Collection ID not found
    }

    await saveSettings({ ...settings, collections: updatedCollections });
    console.log("✅ Collection removed:", collectionId);
    return true;
  }

  static async ensureCollectionsExist(): Promise<void> {
    const settings = await loadSettings();
    if (!settings.collections || !Array.isArray(settings.collections)) {
      console.warn("⚠️ `collections` is missing or invalid in settings.json. Resetting to an empty array.");
      await saveSettings({ ...settings, collections: [] });
    }
  }
}
