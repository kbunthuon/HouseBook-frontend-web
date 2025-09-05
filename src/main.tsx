
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import supabase from '../src/config/supabaseClient.ts';

  console.log(supabase);
  createRoot(document.getElementById("root")!).render(<App />);
  