import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { User, LogOut, Home } from "lucide-react"; // icons (you can change)

const ChatPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate("/");
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-emerald-600 text-white flex flex-col justify-between">
        {/* Top Links */}
        <div>
          <h1 className="p-4 text-xl font-bold">Therapy Chat</h1>
          <nav className="mt-6 space-y-2">
            <Link
              to="/chat"
              className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-700 rounded-lg"
            >
              <Home className="w-5 h-5" />
              <span>Chat</span>
            </Link>
            {/* Add more nav links if needed */}
          </nav>
        </div>

        {/* Bottom - Profile & Logout */}
        <div className="mb-4 space-y-2">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-700 rounded-lg"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-600 rounded-lg text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-700 text-lg">
          👋 This is your chat area. Connect AI chat here later.
        </p>
      </main>

      {/* Logout Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-80">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to log out?
            </h2>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Logging out...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
