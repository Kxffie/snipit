import { loadSettings, saveSettings } from "@/db/db";

export async function updateSelectedModel(newModel: string): Promise<void> {
  try {
    const settings = await loadSettings();
    // Save the selected model under a key named "model"
    settings.model = newModel;
    await saveSettings(settings);
  } catch (err) {
    console.error("Error updating selected model in settings:", err);
  }
}
