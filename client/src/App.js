import React from "react";
import { Routes, Route } from "react-router-dom";

import Home   from "./pages/Home";
import Signup from "./pages/Signup";
import Footer from "./components/Footer";   // ← add this

export default function App() {
  return (
    <div className="appShell">             {/* layout wrapper */}
      <main className="content">           {/* grows to push footer down */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<div style={{ padding: "2rem" }}>404 – Not Found</div>} />
        </Routes>
      </main>

      <Footer />                           {/* ← always visible */}
    </div>
  );
}
