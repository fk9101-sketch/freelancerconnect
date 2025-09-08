import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling to prevent white screens
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Prevent default error handling to avoid white screen
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default error handling to avoid white screen
  event.preventDefault();
});

// Ensure DOM is ready before mounting
function mountApp() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    
    // Clear any existing content
    rootElement.innerHTML = '';
    
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('Error rendering app:', error);
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: white; background: #1E1B2E; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <h1 style="color: #ff6b6b; margin-bottom: 20px;">Error Loading App</h1>
          <p style="margin-bottom: 20px; text-align: center;">There was an error loading the application.</p>
          <pre style="color: #ff6b6b; background: #2d2d2d; padding: 15px; border-radius: 5px; max-width: 100%; overflow-x: auto;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Page</button>
        </div>
      `;
    }
  }
}

// Mount when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
