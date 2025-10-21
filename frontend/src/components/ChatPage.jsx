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

// Improved: generateTitleFromMessages(messages)
// messages = [{ role: 'user'|'bot', text: '...' }, ...]
const generateTitleFromMessages = (messages) => {
  // category => list of keywords (single words or short phrases)
  const lex = {
    Happiness: ["happy","joy","excited","great","awesome","grateful","amazing","cheerful","delighted","glad","content","yay","fantastic"],
    Peace: ["peace","calm","relaxed","serene","chill","comfortable","stable","balanced","zen"],
    Sadness: ["sad","unhappy","depress","down","hopeless","lonely","cry","disappointed","hurt","sorrow","miserable"],
    Anger: ["angry","mad","furious","frustrat","irritat","annoyed","upset","rage","pissed"],
    Anxiety: ["anxious","worried","nervous","scared","afraid","stress","tense","uneasy","panic","panicattack"],
    Fatigue: ["tired","sleepy","exhausted","drained","lazy","fatigued","burnt out","burned out"],
    Thoughtful: ["thinking","wonder","reflect","ponder","confused","curious","considering"],
    Love: ["love","care","affection","kind","support","thankful","appreciate","adoring"]
  };

  // Precompile regex for each word with word boundaries to avoid substring matches
  const compiled = {};
  for (const [cat, words] of Object.entries(lex)) {
    compiled[cat] = words.map(w => new RegExp(`\\b${escapeRegex(w)}\\b`, "i"));
  }

  // helper
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // normalize & tokenize — but keep whole-message strings for phrase matching
  const joinText = (m) => (m.text || "").toString().replace(/\s+/g, " ").trim();

  // scoring
  const scores = {};
  for (const k of Object.keys(lex)) scores[k] = 0;

  // config (tuneable)
  const USER_WEIGHT = 2;   // user messages count more
  const BOT_WEIGHT = 1;
  const NEGATION_WINDOW = 3; // how many tokens before a match to look for negation
  const NEGATION_PENALTY = -1; // invert or penalize if negated
  const MIN_CONFIDENCE = 1; // minimal score to choose a category

  // common negation tokens
  const negations = new Set(["not","no","never","n't","dont","don't","didn't","cannot","can't","hardly","rarely"]);

  // process each message
  for (const msg of messages) {
    const text = joinText(msg).toLowerCase();
    if (!text) continue;
    const weight = (msg.role === "user") ? USER_WEIGHT : BOT_WEIGHT;

    // split tokens for negation detection
    const tokens = text.replace(/[^\w\s']/g, " ").split(/\s+/).filter(Boolean);

    // for every category and regex, run matches
    for (const [cat, regexList] of Object.entries(compiled)) {
      for (const r of regexList) {
        // find all matches (global not used; use exec loop)
        let m;
        const re = new RegExp(r.source, "ig");
        while ((m = re.exec(text)) !== null) {
          // get position => compute token index for negation check
          const charIndex = m.index;
          // compute approximate token index by counting spaces up to charIndex
          const prefix = text.slice(0, charIndex);
          const tokensBefore = prefix.split(/\s+/).filter(Boolean);
          const tokenIdx = tokensBefore.length - 1;
          // look back NEGATION_WINDOW tokens to see negation
          let negated = false;
          for (let j = Math.max(0, tokenIdx - NEGATION_WINDOW + 1); j <= tokenIdx; j++) {
            if (negations.has((tokens[j] || "").replace(/[^a-z0-9']/g,""))) {
              negated = true;
              break;
            }
          }

          if (negated) {
            scores[cat] += NEGATION_PENALTY * weight;
          } else {
            scores[cat] += 1 * weight;
          }
        }
      }
    }
  }

  // decide winner
  // convert to array sorted by score desc
  const sorted = Object.entries(scores).sort((a,b) => b[1] - a[1]);
  const [bestCat, bestScore] = sorted[0] || ["Neutral", 0];
  // check if best score is strong enough and not tied
  const secondScore = (sorted[1] && sorted[1][1]) || 0;

  if (bestScore >= MIN_CONFIDENCE && (bestScore - secondScore) >= 1) {
    return bestCat;
  }
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
