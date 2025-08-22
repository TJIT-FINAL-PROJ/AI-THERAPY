import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
// If you already created this, great — otherwise make a simple placeholder.
import AuthPage from "./components/AuthPage";
import ChatPage from "./components/ChatPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
       <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
};

export default App;
