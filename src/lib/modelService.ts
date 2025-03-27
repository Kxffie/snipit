import { invoke } from "@tauri-apps/api/tauri";
import { Command } from "@tauri-apps/api/shell";
import { readDir, exists } from "@tauri-apps/api/fs";
import { join, homeDir } from "@tauri-apps/api/path";

// --- Ollama functions ---
export async function checkOllamaInstalled(): Promise<boolean> {
  console.log("Checking for Ollama installation...");
  try {
    const command = new Command("ollama", ["--version"]);
    const output = await command.execute();
    if (output.code === 0 && output.stdout.trim().length > 0) {
      console.log("Ollama installed, version:", output.stdout.trim());
      return true;
    } else {
      console.error("Ollama returned non-zero exit code:", output.code);
      return false;
    }
  } catch (error) {
    console.error("Error executing Ollama command. It may not be installed:", error);
    return false;
  }
}

export async function checkOllamaVersion(): Promise<string> {
  try {
    const command = new Command("ollama", ["--version"]);
    const { code, stdout, stderr } = await command.execute();
    if (code === 0 && stdout.trim()) {
      console.log("Ollama version is:", stdout.trim());
      return stdout.trim();
    } else {
      console.error("Non-zero exit code or no stdout. stderr:", stderr);
      return "";
    }
  } catch (err) {
    console.error("Error checking Ollama version:", err);
    return "";
  }
}

// --- Model functions ---
// Scans the user's .ollama models library folder and for each subdirectory (the model group),
// reads its files (the individual model versions). If a file name ends with a known extension
// (e.g. ".json"), that extension is stripped. Otherwise, the full file name is used.
export async function listModels(): Promise<{ group: string; models: string[] }[]> {
  try {
    const home = await homeDir();
    const libraryPath = await join(
      home,
      ".ollama",
      "models",
      "manifests",
      "registry.ollama.ai",
      "library"
    );
    if (!(await exists(libraryPath))) {
      console.error("Library folder does not exist:", libraryPath);
      return [];
    }
    const groups: { group: string; models: string[] }[] = [];
    const groupEntries = await readDir(libraryPath, { recursive: false });
    for (const groupEntry of groupEntries) {
      if (groupEntry.children !== undefined) {
        const groupName = groupEntry.name ?? "Unknown";
        const groupFolderPath = groupEntry.path;
        const modelEntries = await readDir(groupFolderPath, { recursive: false });
        const models: string[] = [];
        for (const modelEntry of modelEntries) {
          if (modelEntry.children === undefined && modelEntry.name) {
            let modelName = modelEntry.name;
            if (modelName.endsWith(".json")) {
              modelName = modelName.slice(0, -5);
            }
            models.push(modelName);
          }
        }
        groups.push({ group: groupName, models: models.sort() });
      }
    }
    groups.sort((a, b) => a.group.localeCompare(b.group));
    return groups;
  } catch (err) {
    console.error("Error listing models:", err);
    return [];
  }
}

export async function runModel(
  prompt: string,
  model: string,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = invoke("run_deepseek", { prompt, model });
    if (signal) {
      signal.addEventListener("abort", () => {
        reject(new Error("Generation aborted"));
      });
    }
    p.then((value) => resolve(value as string)).catch(reject);
  });
}

/**
 * Generates metadata for a code snippet using the AI model.
 *
 * @param code The code snippet.
 * @param selectedModel The full model string (e.g. "deepseek-r1:7b").
 * @param userTitle Optional user-provided title.
 * @param userDescription Optional user-provided description.
 * @param userLanguage Optional user-provided language.
 * @param userTags Optional user-provided tags.
 * @param signal Optional AbortSignal to cancel the generation.
 * @returns A JSON object containing title, description, codeLanguage, framework, tags and optionally error.
 */
export async function completeSnippetMetadata(
  code: string,
  selectedModel: string,
  userTitle?: string,
  userDescription?: string,
  userLanguage?: string,
  userTags?: string[],
  signal?: AbortSignal
): Promise<{
  title: string;
  description: string;
  codeLanguage: string;
  // framework: string;
  tags: string[];
  error?: string;
}> {
  const modelName = selectedModel;
  
  console.log("Using model:", modelName);
  
  const userDataLines: string[] = [];
  if (userTitle?.trim()) {
    userDataLines.push(`- Title: ${userTitle.trim()}`);
  }
  if (userDescription?.trim()) {
    userDataLines.push(`- Description: ${userDescription.trim()}`);
  }
  if (userLanguage?.trim()) {
    userDataLines.push(`- Language: ${userLanguage.trim()}`);
  }
  if (userTags && userTags.length > 0) {
    userDataLines.push(`- Tags: ${userTags.join(", ")}`);
  }
  let userDataSection = "";
  if (userDataLines.length > 0) {
    userDataSection = `
Here is some user-provided data (any blank fields were omitted):
${userDataLines.join("\n")}
`;
  }

//   const promptText = `
// Act as a metadata generator bot for code snippets. 
// You will receive a code snippet along with optional user-provided fields. 
// Your task is to analyze the snippet and generate a valid JSON object that strictly follows the specifications below. 
// The JSON object must have exactly five keys in the following order: "title", "description", "codeLanguage", "framework", and "tags". 
// No additional keys or commentary should be output (except an "error" key only if necessary as described below).

// 1. "title":
//    - Generate a concise and clear title summarizing the snippet’s subject.
//    - Must not exceed 60 characters.
//    - Must be correctly capitalized.
//    - Must not contain any special characters or spaces.
//    - Must not contain duplicates.
// 2. "description":
//    - Produce a single sentence outlining the snippet’s features.
//    - Must be no longer than 150 characters.
//    - Must be correctly capitalized.
//    - Must not contain any special characters or spaces.
//    - Must not contain duplicates.
// 3. "codeLanguage":
//    - Determine the primary programming language used in the snippet.
//    - Must be correctly capitalized.
//    - Must not contain any special characters or spaces.
//    - Must not contain duplicates.
// 4. "framework":
//    - If applicable, determine the framework used; otherwise, output an empty string.
//     - Must be correctly capitalized.
//     - Must be an empty string if not applicable.
//     - Must not contain any special characters or spaces.
//     - Must not contain duplicates.
// 5. "tags":
//    - Generate an array of 3 to 10 relevant keywords (all in lowercase, no spaces).
//    - Must be correctly capitalized.
//    - Must not contain any special characters or spaces.
//    - Must not contain duplicates.


// Here is an example of how you have to conclude your answer:

// "
// {
// "title": "Example Title",
// "description": "Example Description",
// "codeLanguage": "Example Coding Language (Python, C++, Ruby etc)",
// "framework": "Example Framework (React (TypeScript or JavaScript), Ursina (Python), Panda3D (C++) etc if applicable)",
// "tags": ["Example Tag 1", "Example Tag 2", "Example Tag 3"...]
// }
// "

// Here is the code snippet:
// ${code}

// ${userDataSection}
// `;

const promptText = `
Act as a metadata generator bot for code snippets. 
You will receive a code snippet along with optional user-provided fields. 
Your task is to analyze the snippet and generate a valid JSON object that strictly follows the specifications below. 
The JSON object must have exactly five keys in the following order: "title", "description", "codeLanguage", and "tags". 
No additional keys or commentary should be output (except an "error" key only if necessary as described below).

1. "title":
   - Generate a concise and clear title summarizing the snippet’s subject.
   - Must not exceed 60 characters.
   - Must be correctly capitalized.
   - Must not contain any special characters or spaces.
   - Must not contain duplicates.
2. "description":
   - Produce a single sentence outlining the snippet’s features.
   - Must be no longer than 150 characters.
   - Must be correctly capitalized.
   - Must not contain any special characters or spaces.
   - Must not contain duplicates.
3. "codeLanguage":
   - Determine the primary programming language used in the snippet.
   - Must be correctly capitalized.
   - Must not contain any special characters or spaces.
   - Must not contain duplicates.
4. "tags":
   - Generate an array of 3 to 10 relevant keywords (all in lowercase, no spaces).
   - Must be correctly capitalized.
   - Must not contain any special characters or spaces.
   - Must not contain duplicates.


Here is an example of how you have to conclude your answer:

"
{
"title": "Example Title",
"description": "Example Description",
"codeLanguage": "Example Coding Language (Python, C++, Ruby etc)",
"tags": ["Example Tag 1", "Example Tag 2", "Example Tag 3"...]
}
"

Here is the code snippet:
${code}

${userDataSection}
`;

  let rawResponse = "";
  try {
    rawResponse = await runModel(promptText, modelName, signal);
  } catch (err) {
    throw err;
  }

  console.log("Raw AI response:", rawResponse);
  const sanitizedResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, "");
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
  return {
    title: result.title || "",
    description: result.description || "",
    codeLanguage: result.codeLanguage || "",
    // framework: result.framework || "",
    tags: result.tags || [],
    error: result.error,
  };
}
