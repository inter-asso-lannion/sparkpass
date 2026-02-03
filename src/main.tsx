import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import Tulipes from "./Tulipes.tsx";
import Success from "./Success.tsx";
import Admin from "./Admin.tsx";
import SuperAdmin from "./SuperAdmin.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/tulipes" element={<Tulipes />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
