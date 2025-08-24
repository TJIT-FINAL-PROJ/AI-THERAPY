import React, { useState, useEffect } from "react";
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState(null);

  // ✅ Fetch logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/"); // kick out if not logged in
      } else {
        setUserId(data.user.id);
        fetchMessages(data.user.id);
      }
    };
    getUser();
  }, [navigate]);

  // ✅ Fetch existing messages from Supabase
  const fetchMessages = async (uid) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate("/");
  };

  // ✅ Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || !userId) return;

    const userMessage = {
      user_id: userId,
      sender: "user",
      text: input.trim(),
    };

    // Save user message to DB
    const { data: savedUserMsg, error: userError } = await supabase
      .from("messages")
      .insert([userMessage])
      .select();

    if (userError) {
      console.error("Error saving message:", userError.message);
      return;
    }

    // Add user message locally
    setMessages((prev) => [...prev, savedUserMsg[0]]);
    setInput("");

    // ✅ Ask backend for AI reply
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });

      const data = await res.json();

      const aiMessage = {
        user_id: userId,
        sender: "ai",
        text: data.reply || "⚠️ Sorry, I couldn't generate a reply.",
      };

      // Save AI reply in DB
      const { data: savedAiMsg, error: aiError } = await supabase
        .from("messages")
        .insert([aiMessage])
        .select();

      if (!aiError && savedAiMsg) {
        setMessages((prev) => [...prev, savedAiMsg[0]]);
      }
    } catch (err) {
      console.error("AI fetch error:", err);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-gradient-to-b from-emerald-700 to-emerald-900 text-white flex flex-col justify-between transition-all duration-300`}
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
              className="rounded-lg hover:bg-emerald-800"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <nav className="mt-6 space-y-2">
            <Link
              to="/chat"
              className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-800 rounded-lg"
            >
              <Home className="w-5 h-5" />
              {isSidebarOpen && <span>Chat</span>}
            </Link>
            {isSidebarOpen && (
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-800 rounded-lg"
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
            className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-800 rounded-lg"
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
      <main className="flex-1 flex flex-col bg-gradient-to-br from-green-50 via-emerald-100 to-green-200">
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
                className={`px-4 py-2 rounded-2xl max-w-xs shadow ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-800 border border-emerald-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-4 border-t bg-emerald-50 flex items-center gap-2">
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
            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
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
                  setIsSidebarOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
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
