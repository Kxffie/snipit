// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::fs;
use open;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
  let path_buf = PathBuf::from(&path);
  if open::that(path_buf).is_ok() {
    Ok(())
  } else {
    Err(format!("Failed to open folder: {}", path))
  }
}

#[tauri::command]
async fn run_deepseek(prompt: String, model: Option<String>) -> Result<String, String> {
  use std::process::{Command, Stdio};
  // Use the provided model, defaulting to "deepseek-r1:7b"
  let model = model.unwrap_or_else(|| "deepseek-r1:7b".to_string());
  
  // Spawn the process with piped stdin and stdout.
  let mut child = Command::new("ollama")
    .args(&["run", &model])
    .stdin(Stdio::piped())
    .stdout(Stdio::piped())
    .spawn()
    .map_err(|e| e.to_string())?;

  // Write the prompt to the child's stdin.
  if let Some(stdin) = child.stdin.as_mut() {
    use std::io::Write;
    stdin.write_all(prompt.as_bytes()).map_err(|e| e.to_string())?;
  }

  let output = child.wait_with_output().map_err(|e| e.to_string())?;
  if output.status.success() {
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
  } else {
    Err(String::from_utf8_lossy(&output.stderr).to_string())
  }
}

#[tauri::command]
async fn check_ollama() -> Result<bool, String> {
  use std::process::Command;
  let output = if cfg!(target_os = "windows") {
    Command::new("powershell")
      .args(&["-Command", "ollama --version"])
      .output()
  } else {
    Command::new("ollama")
      .arg("--version")
      .output()
  };
  match output {
    Ok(output) if output.status.success() && !output.stdout.is_empty() => Ok(true),
    Ok(output) => Err(String::from_utf8_lossy(&output.stderr).to_string()),
    Err(e) => Err(e.to_string()),
  }
}

#[tauri::command]
async fn check_deepseek() -> Result<bool, String> {
  use std::process::Command;
  let output = if cfg!(target_os = "windows") {
    Command::new("powershell")
      .args(&["-Command", "ollama ps deepseek-r1:7b"])
      .output()
  } else {
    Command::new("ollama")
      .args(&["ps", "deepseek-r1:7b"])
      .output()
  };
  match output {
    Ok(output) => Ok(output.status.success()),
    Err(e) => Err(e.to_string()),
  }
}

#[tauri::command]
async fn list_deepseek_models() -> Result<Vec<String>, String> {
  // Determine default models directory.
  let mut model_dir: PathBuf;
  if cfg!(target_os = "windows") {
    let local_app_data = std::env::var("LOCALAPPDATA").map_err(|e| e.to_string())?;
    model_dir = PathBuf::from(local_app_data);
    model_dir.push("Ollama");
    model_dir.push("models");
  } else {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    model_dir = PathBuf::from(home);
    model_dir.push(".ollama");
    model_dir.push("models");
  }
  let mut models = Vec::new();
  if model_dir.exists() {
    for entry in fs::read_dir(model_dir).map_err(|e| e.to_string())? {
      let entry = entry.map_err(|e| e.to_string())?;
      let file_name = entry.file_name().to_string_lossy().to_string();
      // Filter for models that start with "deepseek-r1:"
      if file_name.starts_with("deepseek-r1:") {
        models.push(file_name);
      }
    }
  }
  Ok(models)
}

#[tauri::command]
async fn get_ollama_install_path() -> Result<String, String> {
  use std::process::Command;
  if cfg!(target_os = "windows") {
    let output = Command::new("where")
      .arg("ollama")
      .output()
      .map_err(|e| e.to_string())?;
    if output.status.success() {
      let path = String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()
        .unwrap_or("")
        .to_string();
      Ok(path)
    } else {
      Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
  } else {
    let output = Command::new("which")
      .arg("ollama")
      .output()
      .map_err(|e| e.to_string())?;
    if output.status.success() {
      Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
      Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
  }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      open_folder,
      run_deepseek,
      check_ollama,
      check_deepseek,
      list_deepseek_models,
      get_ollama_install_path
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
