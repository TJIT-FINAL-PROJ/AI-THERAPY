import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { User, LogOut, Home, Send, Menu, X, Settings } from "lucide-react";

const ChatPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([
    { sender: "ai", text: "👋 Hi there! How are you feeling today?" },
  ]);
  const [input, setInput] = useState("");

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate("/");
  };

  // Handle sending a message
  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const newMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, newMessage]);

    // Clear input
    setInput("");

    // Temporary AI demo reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "💡 Thanks for sharing, I'm here to listen." },
      ]);
    }, 800);
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-emerald-600 text-white flex flex-col justify-between transition-all duration-300`}
      >
        {/* Top Links */}
        <div>
          <div className="flex items-center justify-between p-4">
            {isSidebarOpen && (
              <h1 className="text-xl font-bold transition-opacity duration-300">
                Therapy Chat
              </h1>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-emerald-700"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <nav className="mt-6 space-y-2">
            <Link
              to="/chat"
              className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-700 rounded-lg"
            >
              <Home className="w-5 h-5" />
              {isSidebarOpen && <span>Chat</span>}
            </Link>
            {isSidebarOpen && (
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-700 rounded-lg"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom - Profile & Logout */}
        <div className="mb-4 space-y-2">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-700 rounded-lg"
          >
            <User className="w-5 h-5" />
            {isSidebarOpen && <span>Profile</span>}
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-600 rounded-lg text-left"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Chat Section */}
      <main className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs ${
                  msg.sender === "user"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-4 border-t bg-white flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
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
                onClick={() => {
                  setShowModal(false);
                  setIsSidebarOpen(false); // collapse sidebar on cancel
                }}
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
