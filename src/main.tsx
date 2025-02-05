import React from "react";
import ReactDOM from "react-dom/client";
import { getDeviceInfo } from "./lib/startup";

import { App } from "./App";

import "./styles.css";

async function initializeApp() {
  
  console.log("Initializing SnipIt App...");
  try {
    await getDeviceInfo();
    console.log("SnipIt App initialized successfully.");
  } catch (error) {
    console.error("App initialization failed:", error);
  }
}

initializeApp(); 

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  
);
