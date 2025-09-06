import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling to prevent white screens
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('Error rendering app:', error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: white; background: #1E1B2E; min-height: 100vh;">
        <h1>Error Loading App</h1>
        <p>There was an error loading the application.</p>
        <pre style="color: red;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
      </div>
    `;
  }
}
