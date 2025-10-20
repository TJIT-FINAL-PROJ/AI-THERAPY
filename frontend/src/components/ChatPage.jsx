import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Lottie from "lottie-react";
import chatbotAnimation from "../assets/chatbot.json";
import chatbotAvatar from "../assets/avatars/avatarchatbot.png";
import { useTheme } from "../contexts/ThemeContext";
import dayjs from "dayjs";

const generateTitleFromMessages = (messages) => {
  const text = messages.map((m) => m.text.toLowerCase()).join(" ");

  // 🌞 Positive emotions
  if (
    text.includes("happy") || text.includes("joy") || text.includes("excited") ||
    text.includes("great") || text.includes("awesome") || text.includes("grateful") ||
    text.includes("amazing") || text.includes("cheerful") || text.includes("delighted") ||
    text.includes("glad") || text.includes("content")
  )
    return "Happiness";

  // 🌿 Calm / peaceful / relaxed moods
  if (
    text.includes("peace") || text.includes("calm") || text.includes("relaxed") ||
    text.includes("serene") || text.includes("chill") || text.includes("comfortable") ||
    text.includes("stable") || text.includes("balanced")
  )
    return "Peace";

  // 💭 Sad / low moods
  if (
    text.includes("sad") || text.includes("unhappy") || text.includes("depress") ||
    text.includes("down") || text.includes("hopeless") || text.includes("lonely") ||
    text.includes("cry") || text.includes("disappointed") || text.includes("hurt")
  )
    return "Sadness";

  // 😡 Angry / irritated
  if (
    text.includes("angry") || text.includes("mad") || text.includes("furious") ||
    text.includes("frustrated") || text.includes("irritated") || text.includes("annoyed") ||
    text.includes("upset") || text.includes("rage")
  )
    return "Anger";

  // 😰 Anxious / stressed
  if (
    text.includes("anxious") || text.includes("worried") || text.includes("nervous") ||
    text.includes("scared") || text.includes("afraid") || text.includes("stress") ||
    text.includes("tense") || text.includes("uneasy") || text.includes("panic")
  )
    return "Anxiety";

  // 🥱 Tired / low energy
  if (
    text.includes("tired") || text.includes("sleepy") || text.includes("exhausted") ||
    text.includes("drained") || text.includes("lazy") || text.includes("fatigued") ||
    text.includes("burnt out")
  )
    return "Fatigue";

  // 🤔 Thoughtful / reflective
  if (
    text.includes("thinking") || text.includes("wonder") || text.includes("reflect") ||
    text.includes("ponder") || text.includes("confused") || text.includes("curious")
  )
    return "Thoughtful";

  // 💖 Loving / affectionate
  if (
    text.includes("love") || text.includes("care") || text.includes("affection") ||
    text.includes("kind") || text.includes("support") || text.includes("thankful") ||
    text.includes("appreciate")
  )
    return "Love";

  // 😶 Neutral / general chats
  return "Neutral";
};

const ChatPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const pendingAiReply = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentSessionId, isTyping]);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) navigate("/");
      else {
        setUserId(data.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", data.user.id)
          .single();
        setUser({
          ...data.user,
          full_name: profile?.full_name || data.user.user_metadata?.full_name || "User",
          avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url || null,
        });
        fetchSessions(data.user.id);
      }
    };
    getUser();
  }, [navigate]);

  const fetchSessions = async (uid) => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setSessions(data);
      if (data.length > 0 && !currentSessionId) setCurrentSessionId(data[0].id);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !currentSessionId) return;
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .eq("session_id", currentSessionId)
        .order("created_at", { ascending: true });
      if (!error && data) setMessages(data);
    };
    fetchMessages();
  }, [userId, currentSessionId]);

  useEffect(() => {
    if (!currentSessionId || messages.length < 3) return;
    const session = sessions.find((s) => s.id === currentSessionId);
    if (session && session.title === "Untitled") {
      const newTitle = generateTitleFromMessages(messages);
      supabase
        .from("sessions")
        .update({ title: newTitle })
        .eq("id", currentSessionId)
        .then(() => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId ? { ...s, title: newTitle } : s
            )
          );
        })
        .catch((err) => console.error("Auto-title update failed:", err));
    }
  }, [messages, currentSessionId, sessions]);

  // 🧠 New useEffect to store emotion each day
useEffect(() => {
  if (!userId || messages.length === 0) return;

  const emotion = generateTitleFromMessages(messages);

  const saveEmotionForDay = async () => {
    const today = dayjs().format("YYYY-MM-DD");
    const { error } = await supabase.from("user_mood_history").upsert(
      [{ user_id: userId, date: today, emotion }],
      { onConflict: ["user_id", "date"] }
    );
    if (error) console.error("Error saving emotion:", error);
  };

  saveEmotionForDay();
}, [messages]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate("/");
  };

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
    if (userError) return console.error("Error saving message:", userError.message);
    setMessages((prev) => [...prev, savedUserMsg[0]]);

    setIsTyping(true);
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
      pendingAiReply.current = aiMessage;
    } catch (err) {
      console.error("AI fetch error:", err);
      setIsTyping(false);
    }
  };

  const handleAnimationComplete = async () => {
    setIsTyping(false);
    if (pendingAiReply.current) {
      const aiMessage = pendingAiReply.current;
      const { data: savedAiMsg, error: aiError } = await supabase
        .from("messages")
        .insert([aiMessage])
        .select();
      if (!aiError && savedAiMsg) setMessages((prev) => [...prev, savedAiMsg[0]]);
      pendingAiReply.current = null;
    }
  };

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
    <div
      className={`h-screen flex transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-pink-50 text-gray-800"
      }`}
    >
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

      <main
        className={`flex-1 flex flex-col transition-colors duration-300 ${
          isDarkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-pink-50 via-rose-100 to-peach-100"
        }`}
      >
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p
                className={`text-center ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                💬 No conversations yet. Start by sending a message!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-end ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "ai" && (
                  <img
                    src={chatbotAvatar}
                    alt="Chatbot"
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs shadow flex flex-col ${
                    msg.sender === "user"
                      ? "bg-pink-500 text-white"
                      : isDarkMode
                      ? "bg-gray-800 text-gray-100 border border-gray-700"
                      : "bg-white text-gray-800 border border-pink-200"
                  }`}
                >
                  <span>{msg.text}</span>
                  <span
                    className={`text-xs mt-1 self-end ${
                      msg.sender === "user"
                        ? "text-pink-100"
                        : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {msg.sender === "user" && (
                  <img
                    src={user?.avatar_url}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full ml-2 object-cover border border-pink-300"
                  />
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start">
              <Lottie
                animationData={chatbotAnimation}
                loop={false}
                style={{ width: 68, height: 68 }}
                onComplete={handleAnimationComplete}
              />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div
          className={`p-4 border-t flex items-center gap-2 transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-pink-50 border-pink-200"
          }`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-pink-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-pink-400"
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-2 rounded-xl transition-colors duration-300 ${
              isDarkMode
                ? "bg-pink-400 hover:bg-pink-500 text-gray-900"
                : "bg-pink-500 hover:bg-pink-600 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-2xl shadow-lg w-80 transition-colors duration-300 ${
              isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"
            }`}
          >
            <h2 className="text-lg font-semibold mb-4">
              Are you sure you want to log out?
            </h2>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsSidebarOpen(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-pink-400 hover:bg-pink-500 text-gray-900"
                    : "bg-pink-500 hover:bg-pink-600 text-white"
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`p-4 rounded-xl shadow-lg flex items-center gap-3 transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-700"
            }`}
          >
            <div className="w-6 h-6 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Logging out...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
