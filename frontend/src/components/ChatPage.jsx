import React from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 bg-emerald-500 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Therapy Chat</h1>
        <button
          onClick={handleLogout}
          className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-700 text-lg">
          👋 This is your chat area. Connect AI chat here later.
        </p>
      </main>
    </div>
  );
};

export default ChatPage;
