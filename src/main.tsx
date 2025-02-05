import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { getDeviceInfo } from "./lib/startup";
import { useKonami } from 'react-konami-code'

import { App } from "./App";

import "./styles.css";

const gifList = [
  "https://i.gifer.com/XDZW.gif",
  "https://i.gifer.com/ZJF5.gif",
  "https://i.gifer.com/ZgtM.gif",
];

const KonamiWrapper = ({ children }: { children: React.ReactNode }) => {
  const [gifKey, setGifKey] = useState(0); // Key to force re-render
  const [currentGif, setCurrentGif] = useState<string | null>(null); // Selected GIF
  const [showGif, setShowGif] = useState(false); // Control GIF visibility

  useKonami(() => {
    console.log("Konami Code");

    const randomGif = gifList[Math.floor(Math.random() * gifList.length)];
    setCurrentGif(randomGif);
    setGifKey((prevKey) => prevKey + 1);
    setShowGif(true);
  });

  useEffect(() => {
    if (currentGif) {
      const img = new Image();
      img.src = currentGif;

      img.onload = () => {
        const duration = (img.naturalWidth / img.width) * 1000 * 2;
        
        setTimeout(() => {
          setShowGif(false);
        }, duration);
      };
    }
  }, [currentGif]);

  return (
    <>
      {children}
      {showGif && currentGif && (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
          <img
            key={gifKey}
            src={currentGif}
            style={{
              width: "150px",
              height: "auto",
              transform: "scaleX(-1)",
              display: "block",
            }}
            alt="Easter Egg"
          />
        </div>
      )}
    </>
  );
};

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
    <KonamiWrapper>
      <App />
    </KonamiWrapper>
  </React.StrictMode>,
  
);
