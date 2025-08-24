import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import Sidebar from "../components/Sidebar"; // <-- import Sidebar

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

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // ✅ Fetch logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/"); // kick out if not logged in
      } else {
        setUserId(data.user.id);
        fetchSessions(data.user.id);
      }
    };
    getUser();
  }, [navigate]);

  // ✅ Fetch all sessions for this user
  const fetchSessions = async (uid) => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id); // default: latest session
      }
    }
  };

  // ✅ Fetch messages for current session
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !currentSessionId) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .eq("session_id", currentSessionId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();
  }, [userId, currentSessionId]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate("/");
  };

  // ✅ Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || !userId || !currentSessionId) return;

    const userMessage = {
      user_id: userId,
      session_id: currentSessionId,
      sender: "user",
      text: input.trim(),
    };

    const { data: savedUserMsg, error: userError } = await supabase
      .from("messages")
      .insert([userMessage])
      .select();

    if (userError) {
      console.error("Error saving message:", userError.message);
      return;
    }

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
        session_id: currentSessionId,
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

  // ✅ Start new conversation
  const handleNewConversation = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("sessions")
      .insert([{ user_id: userId }])
      .select();

    if (!error && data.length > 0) {
      setCurrentSessionId(data[0].id);
      setMessages([]);
      setSessions((prev) => [data[0], ...prev]);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        handleNewConversation={handleNewConversation}
        handleLogout={handleLogout}
        setShowModal={setShowModal}
      />

      {/* Main Chat Section */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-green-50 via-emerald-100 to-green-200">
        {/* Chat Messages */}
<div className="flex-1 p-6 overflow-y-auto space-y-4">
  {messages.length === 0 ? (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 text-center">
        💬 No conversations yet. Start by sending a message!
      </p>
    </div>
  ) : (
    messages.map((msg, index) => (
      <div
        key={index}
        className={`flex ${
          msg.sender === "user" ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`px-4 py-2 rounded-2xl max-w-xs shadow flex flex-col ${
            msg.sender === "user"
              ? "bg-emerald-600 text-white"
              : "bg-white text-gray-800 border border-emerald-200"
          }`}
        >
          <span>{msg.text}</span>
          <span
            className={`text-xs mt-1 self-end ${
              msg.sender === "user" ? "text-gray-300" : "text-gray-500"
            }`}
          >
            {new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    ))
  )}
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

      {/* Logout Modal */}
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
