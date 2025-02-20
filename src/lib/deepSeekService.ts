import { invoke } from "@tauri-apps/api/tauri"; 

// List downloaded DeepSeek models by scanning the default models directory.
export async function listDeepSeekModels(): Promise<string[]> {
  try {
    const models = await invoke<string[]>("list_deepseek_models");
    return models;
  } catch (err) {
    console.error("Error listing DeepSeek models:", err);
    return [];
  }
}

// Check if DeepSeek is installed.
export async function checkDeepSeekInstalled(): Promise<boolean> {
  try {
    return await invoke("check_deepseek");
  } catch (err) {
    console.error("Error checking DeepSeek installation:", err);
    return false;
  }
}

// Install (or run) a DeepSeek model – this command should trigger installation if missing.
export async function installDeepSeekModel(model: string): Promise<string> {
  try {
    const command = `ollama run ${model}`;
    return await invoke("run_deepseek", { prompt: command, model });
  } catch (err) {
    console.error("Error installing DeepSeek model:", err);
    throw err;
  }
}

// Check if Ollama is installed.
export async function checkOllamaInstalled(): Promise<boolean> {
  try {
    return await invoke("check_ollama");
  } catch (err) {
    console.error("Error checking Ollama installation:", err);
    return false;
  }
}

export async function runDeepSeek(prompt: string, model: string): Promise<string> {
    try {
      return await invoke("run_deepseek", { prompt, model });
    } catch (err) {
      console.error("Error running DeepSeek:", err);
      throw err;
    }
  }

/**
 * Calls DeepSeek to generate snippet metadata from a given code snippet.
 * Returns an object with { title, description, codeLanguage, tags, error? }.
 * If there's a parsing issue or no JSON is found, this throws an Error.
 *
 * After retrieving the result, it sends a "/bye" message to the model
 * so that the model cleanly shuts down and frees memory.
 */
export async function completeSnippetMetadata(
    code: string,
    selectedModel: "1.5b" | "7b"
  ): Promise<{
    title: string;
    description: string;
    codeLanguage: string;
    tags: string[];
    error?: string;
  }> {
    const modelName = selectedModel === "7b" ? "deepseek-r1:7b" : "deepseek-r1:1.5b";
  
    const prompt = `
    
Act as a metadata generator bot for code snippets. You will receive a code snippet and must output a valid JSON object with exactly four keys in this order: "title", "description", "codeLanguage", and "tags". The "title" must be a concise heading summarizing the snippet’s subject, limited to 60 characters. The "description" should briefly outline the snippet’s features in one sentence, no longer than 150 characters. The "codeLanguage" must be capitalized correctly (e.g., "Java", "JavaScript", "Python", "C++") and must match the snippet’s most likely language. The "tags" should be an alphabetically sorted array of 3–10 relevant, lowercase keywords describing the snippet’s functionalities or libraries, avoiding generic terms or the programming language name.

If the snippet is empty, uses multiple languages, or is ambiguous and the primary language cannot be determined, return default values and include an additional "error" key explaining the issue. Avoid simply echoing the snippet text in the "title", "description", or "tags". Output only the JSON object with these keys, with no extra text or commentary.

Here is the code snippet: ${code}

    `;
  
    let rawResponse = "";
    try {
      // 1) Run DeepSeek with the main prompt
      rawResponse = await runDeepSeek(prompt, modelName);
    } finally {
      // 2) Always send "/bye" to close the model session
      try {
        await runDeepSeek("/bye", modelName);
      } catch (closeErr) {
        console.warn("Warning: failed to close model session with /bye:", closeErr);
      }
    }
  
    console.log("Raw AI response:", rawResponse);
  
    // Remove everything between <think>...</think>
    const sanitizedResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, "");
    console.log("Sanitized AI response:", sanitizedResponse);
  
    // Match the JSON
    const jsonMatch = sanitizedResponse.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
  
    const jsonString = jsonMatch[0].trim();
    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr);
      throw new Error("Failed to parse JSON from AI response");
    }
  
    // Return the parsed result
    return {
      title: result.title || "",
      description: result.description || "",
      codeLanguage: result.codeLanguage || "",
      tags: result.tags || [],
      error: result.error,
    };
  }