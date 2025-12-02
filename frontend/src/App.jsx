// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import ChatPage from "./components/ChatPage";
import ProfilePage from "./components/ProfilePage";
import VoiceTherapyPage from "./components/VoiceTherapyPage";
import FacialTherapyMode from "./components/FacialTherapyMode";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/voice-therapy" element={<VoiceTherapyPage />} />
      <Route path="/facial-therapy" element={<FacialTherapyMode />} />
    </Routes>
  );
};

export default App;
