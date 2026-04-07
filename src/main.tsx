import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AIHintProvider } from "./contexts/AIHintContext";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGate from "./components/AuthGate";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <AIHintProvider>
            <App />
          </AIHintProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
