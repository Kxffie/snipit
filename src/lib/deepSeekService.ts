import { invoke } from "@tauri-apps/api/tauri"; 
import { Command } from "@tauri-apps/api/shell";

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
    return await invoke<boolean>("check_deepseek");
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
    const command = new Command("ollama", ["--version"]);
    const { code, stdout, stderr } = await command.execute();
    console.log("Ollama version output:", stdout);
    // If the command runs successfully and returns output, assume it's installed.
    return code === 0 && stdout.trim().length > 0;
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

export async function completeSnippetMetadata(
  code: string,
  selectedModel: "7b",
  userTitle?: string,
  userDescription?: string,
  userLanguage?: string,
  userFramework?: string,
  userTags?: string[]
): Promise<{
  title: string;
  description: string;
  codeLanguage: string;
  framework: string;
  tags: string[];
  error?: string;
}> {
  const modelName = selectedModel === "7b" ? "deepseek-r1:7b" : "deepseek-r1:1.5b";

  let userDataLines: string[] = [];
  if (userTitle?.trim()) {
    userDataLines.push(`- Title: ${userTitle.trim()}`);
  }
  if (userDescription?.trim()) {
    userDataLines.push(`- Description: ${userDescription.trim()}`);
  }
  if (userLanguage?.trim()) {
    userDataLines.push(`- Language: ${userLanguage.trim()}`);
  }
  if (userFramework?.trim()) {
    userDataLines.push(`- Framework: ${userFramework.trim()}`);
  }
  if (userTags && userTags.length > 0) {
    const joinedTags = userTags.join(", ");
    userDataLines.push(`- Tags: ${joinedTags}`);
  }
  let userDataSection = "";
  if (userDataLines.length > 0) {
    userDataSection = `
Here is some user-provided data (any blank fields were omitted):
${userDataLines.join("\n")}
`;
  }

  // Updated prompt with explicit instructions for tags and framework.
  const prompt = `
Act as a metadata generator bot for code snippets. You will receive a code snippet along with optional user-provided fields. Your task is to analyze the snippet and generate a valid JSON object that strictly follows the specifications below. The JSON object must have exactly five keys in the following order: "title", "description", "codeLanguage", "framework", and "tags". No additional keys or commentary should be output (except an "error" key only if necessary as described below).

Detailed Instructions:

1. "title":
   - Generate a concise and clear title summarizing the snippet’s subject.
   - The title must not exceed 60 characters.
   - Do not simply echo the snippet text; provide a descriptive heading.

2. "description":
   - Produce a single sentence that briefly outlines the snippet’s features and functionality.
   - The description must be no longer than 150 characters.
   - It should clearly describe what the snippet does without including extraneous code text.

3. "codeLanguage":
   - Determine the primary programming language used in the snippet.
   - The language name must be correctly capitalized (for example, "JavaScript", "Python", "C++", "Java").
   - If the snippet contains multiple languages or is ambiguous, choose the dominant language or, if unclear, output default values and include an "error" key with a brief explanation.

4. "framework":
   - If the snippet uses a primary framework or engine (for example, "Ursina Engine"), output that value.
   - This value must be in all lowercase letters.
   - Replace every space with a single dash (for example, "Ursina Engine" becomes "ursina-engine").
   - If no framework is applicable, output an empty string ("").

5. "tags":
   - Generate an array containing 3 to 10 relevant keywords that describe the snippet’s functionalities, libraries, or overall subject.
   - All tags must be in lowercase.
   - Each tag must not include any spaces; if a tag would normally contain spaces, replace them with dashes (for example, "mouse controls" becomes "mouse-controls").
   - The array must be sorted in alphabetical order.
   - Do not include the programming language name as one of the tags.
   - If there isn’t sufficient context, generate default relevant tags and, if necessary, include an "error" key with a brief explanation.

Additional Guidelines:
- If the snippet is empty, ambiguous, or uses multiple languages such that the primary language cannot be determined, output default values for all keys and include an additional "error" key with a brief explanation.
- If any optional user-provided fields (such as title, description, codeLanguage, framework, or tags) are provided and are non-empty, use them as guidance to generate a more accurate output.
- The output must be strictly a JSON object with only the keys specified above (and "error" if applicable). Do not include any additional text, markdown, or commentary.

Here is the code snippet:
${code}

`;

  let rawResponse = "";
  try {
    rawResponse = await runDeepSeek(prompt, modelName);
  } finally {
    try {
      await runDeepSeek("/bye", modelName);
    } catch (closeErr) {
      console.warn("Warning: failed to close model session with /bye:", closeErr);
    }
  }

  console.log("Raw AI response:", rawResponse);
  const sanitizedResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, "");
  console.log("Sanitized AI response:", sanitizedResponse);
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
    framework: result.framework || "", // new key in the result
    tags: result.tags || [],
    error: result.error,
  };
}

