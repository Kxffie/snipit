// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}