
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { initAuthSync } from "./app/lib/auth";
  import "./styles/index.css";

  initAuthSync();
  createRoot(document.getElementById("root")!).render(<App />);
