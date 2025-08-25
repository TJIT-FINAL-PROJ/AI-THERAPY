import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Lottie from "lottie-react";
import chatbotAnimation from "../assets/chatbot.json"; // 👈 import your Lottie file

const ChatPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false);

  // Store pending AI reply until animation finishes
  const pendingAiReply = useRef(null);

  // Dummy ref at the bottom of messages
  const bottomRef = useRef(null);

  // Always scroll to bottom whenever messages update
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentSessionId, isTyping]);

  // Fetch logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/");
      } else {
        setUserId(data.user.id);
        setUser(data.user);
        fetchSessions(data.user.id);
      }
    };
    getUser();
  }, [navigate]);

  // Fetch all sessions
  const fetchSessions = async (uid) => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id); // open latest session
      }
    }
  };

  // Fetch messages for current session
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

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !userId || !currentSessionId) return;

    const text = input.trim();
    setInput("");

    const userMessage = {
      user_id: userId,
      session_id: currentSessionId,
      sender: "user",
      text,
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

    // --- AUTO-RENAME LOGIC ---
    const session = sessions.find((s) => s.id === currentSessionId);
    if (session && (!session.title || session.title === "Untitled")) {
      try {
        const titleRes = await fetch("/api/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage.text }),
        });
        const { title } = await titleRes.json();
        if (title) {
          await supabase.from("sessions").update({ title }).eq("id", currentSessionId);
          setSessions((prev) =>
            prev.map((s) => (s.id === currentSessionId ? { ...s, title } : s))
          );
        }
      } catch (err) {
        console.error("Title generation failed:", err);
      }
    }
    // --------------------------

    // Show typing animation immediately
    setIsTyping(true);

    // AI reply
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const aiMessage = {
        user_id: userId,
        session_id: currentSessionId,
        sender: "ai",
        text: data.reply || "⚠️ Sorry, I couldn't generate a reply.",
      };

      // Hold AI reply until animation completes
      pendingAiReply.current = aiMessage;
    } catch (err) {
      console.error("AI fetch error:", err);
      setIsTyping(false);
    }
  };

  // Handle animation complete → drop the AI message
  const handleAnimationComplete = async () => {
    setIsTyping(false);

    if (pendingAiReply.current) {
      const aiMessage = pendingAiReply.current;

      const { data: savedAiMsg, error: aiError } = await supabase
        .from("messages")
        .insert([aiMessage])
        .select();

      if (!aiError && savedAiMsg) {
        setMessages((prev) => [...prev, savedAiMsg[0]]);
      }

      pendingAiReply.current = null;
    }
  };

  // New conversation
  const handleNewConversation = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("sessions")
      .insert([{ user_id: userId, title: "Untitled" }])
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
        setSessions={setSessions}
        user={user}
      />

      {/* Main Chat */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-green-50 via-emerald-100 to-green-200">
        {/* Messages */}
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

          {/* Typing Indicator (Lottie) */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center">
                <Lottie
                  animationData={chatbotAnimation}
                  loop={false}
                  style={{ width: 68, height: 68 }} // 🔹 perfect size
                  onComplete={handleAnimationComplete}
                />
              </div>
            </div>
          )}

          {/* Always here */}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
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
            disabled={!input.trim()}
            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
            {/* Perfect size spinner */}
            <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Logging out...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
