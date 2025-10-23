import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Send, Mic } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Lottie from "lottie-react";
import chatbotAnimation from "../assets/chatbot.json";
import chatbotAvatar from "../assets/avatars/avatarchatbot.png";
import { useTheme } from "../contexts/ThemeContext";
import dayjs from "dayjs";
import useSTT from "../hooks/useSTT";
import useTTS from "../hooks/useTTS";

const generateTitleFromMessages = (messages) => {
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

  const compiled = {};
  for (const [cat, words] of Object.entries(lex)) {
    compiled[cat] = words.map(w => new RegExp(`\\b${escapeRegex(w)}\\b`, "i"));
  }
  function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  const joinText = (m) => (m.text || "").toString().replace(/\s+/g, " ").trim();
  const scores = {}; for (const k of Object.keys(lex)) scores[k] = 0;

  const USER_WEIGHT = 2;
  const BOT_WEIGHT = 1;
  const NEGATION_WINDOW = 3;
  const NEGATION_PENALTY = -1;
  const MIN_CONFIDENCE = 1;
  const negations = new Set(["not","no","never","n't","dont","don't","didn't","cannot","can't","hardly","rarely"]);

  for (const msg of messages) {
    const text = joinText(msg).toLowerCase();
    if (!text) continue;
    const weight = (msg.role === "user") ? USER_WEIGHT : BOT_WEIGHT;
    const tokens = text.replace(/[^\w\s']/g, " ").split(/\s+/).filter(Boolean);
    for (const [cat, regexList] of Object.entries(compiled)) {
      for (const r of regexList) {
        let m; const re = new RegExp(r.source, "ig");
        while ((m = re.exec(text)) !== null) {
          const charIndex = m.index;
          const prefix = text.slice(0, charIndex);
          const tokensBefore = prefix.split(/\s+/).filter(Boolean);
          const tokenIdx = tokensBefore.length - 1;
          let negated = false;
          for (let j = Math.max(0, tokenIdx - NEGATION_WINDOW + 1); j <= tokenIdx; j++) {
            if (negations.has((tokens[j] || "").replace(/[^a-z0-9']/g,""))) { negated = true; break; }
          }
          if (negated) scores[cat] += NEGATION_PENALTY * weight;
          else scores[cat] += 1 * weight;
        }
      }
    }
  }

  const sorted = Object.entries(scores).sort((a,b) => b[1] - a[1]);
  const [bestCat, bestScore] = sorted[0] || ["Neutral", 0];
  const secondScore = (sorted[1] && sorted[1][1]) || 0;
  if (bestScore >= MIN_CONFIDENCE && (bestScore - secondScore) >= 1) return bestCat;
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
  const [voiceModeOn, setVoiceModeOn] = useState(false); // new state

  const { start, stop, listening, interim, final, resetTranscript } = useSTT();
  const { speak } = useTTS();

  const sendMessage = async (text) => {
    if (!text.trim() || !userId || !currentSessionId) return;
    const plainText = text.trim();
    setInput("");
    resetTranscript();
    const userMessage = {
      user_id: userId,
      session_id: currentSessionId,
      sender: "user",
      text: plainText,
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
        body: JSON.stringify({ message: plainText }),
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

  const handleSend = () => sendMessage(input);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentSessionId, isTyping]);

  const prevListeningRef = useRef(false);
  useEffect(() => {
    if (prevListeningRef.current && !listening) {
      const textToSend = (final || interim || "").trim();
      if (textToSend) setTimeout(() => sendMessage(textToSend), 50);
    }
    prevListeningRef.current = listening;
  }, [listening, interim, final]);

  useEffect(() => { if (interim) setInput(interim); }, [interim]);

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
      supabase.from("sessions").update({ title: newTitle }).eq("id", currentSessionId)
        .then(() => setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, title: newTitle } : s)))
        .catch((err) => console.error("Auto-title update failed:", err));
    }
  }, [messages, currentSessionId, sessions]);

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
        speak(savedAiMsg[0].text);
      }
      pendingAiReply.current = null;
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate("/");
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

  const handleVoiceHoldStart = () => start();
  const handleVoiceHoldEnd = () => stop();

  return (
    <div className={`h-screen flex transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-pink-50 text-gray-800"}`}>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        handleNewConversation={handleNewConversation}
        setShowModal={setShowModal}
        setSessions={setSessions}
        user={user}
        voiceModeOn={voiceModeOn} // added
        setVoiceModeOn={setVoiceModeOn} // added
      />

      <main className={`flex-1 flex flex-col transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-pink-50 via-rose-100 to-peach-100"}`}>
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>💬 No conversations yet. Start by sending a message!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex items-end ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "ai" && <img src={chatbotAvatar} alt="Chatbot" className="w-8 h-8 rounded-full mr-2" />}
                <div className={`px-4 py-2 rounded-2xl max-w-xs shadow flex flex-col ${msg.sender === "user" ? "bg-pink-500 text-white" : isDarkMode ? "bg-gray-800 text-gray-100 border border-gray-700" : "bg-white text-gray-800 border border-pink-200"}`}>
                  <span>{msg.text}</span>
                  <span className={`text-xs mt-1 self-end ${msg.sender === "user" ? "text-pink-100" : isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {msg.sender === "user" && <img src={user?.avatar_url} alt="User avatar" className="w-8 h-8 rounded-full ml-2 object-cover border border-pink-300" />}
              </div>
            ))
          )}

          {isTyping && <div className="flex justify-start"><Lottie animationData={chatbotAnimation} loop={false} style={{ width: 68, height: 68 }} onComplete={handleAnimationComplete} /></div>}
          <div ref={bottomRef} />
        </div>

        {/* input + mic area */}
        <div className={`p-4 border-t flex flex-col gap-2 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-pink-50 border-pink-200"}`}>
          {/* live interim preview + waveform when listening */}
          <div className="flex flex-col gap-1">
            {listening && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-pink-500 text-white">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Listening…</div>
                    {/* interim + final preview */}
                    <div className="text-xs text-pink-100/90">
                      {interim || final || "Say something..."}
                    </div>
                  </div>
                </div>
                {/* waveform (smooth line) */}
                <div className="ml-4 flex-1">
                  <div className="wave-line h-6 w-full overflow-hidden">
                    {/* bars will be CSS-animated */}
                    <div className="wave-bars">
                      {/* many thin spans that animate up/down to simulate smooth wave */}
                      {Array.from({length: 24}).map((_, i) => (
                        <span key={i} className={`wave-bar bar-${i}`}></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-colors duration-300 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-pink-400" : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-pink-400"}`}
            />

            {/* Mic Button (hold) */}
            <button
              onMouseDown={handleVoiceHoldStart}
              onMouseUp={handleVoiceHoldEnd}
              onTouchStart={handleVoiceHoldStart}
              onTouchEnd={handleVoiceHoldEnd}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${listening ? "bg-pink-400 animate-pulse" : isDarkMode ? "bg-pink-400" : "bg-pink-500"} text-white`}
            >
              <Mic className="w-5 h-5" />
              {listening && <span className="absolute w-full h-full rounded-full bg-pink-300 opacity-50 animate-ping"></span>}
            </button>

            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-2 rounded-xl transition-colors duration-300 ${isDarkMode ? "bg-pink-400 hover:bg-pink-500 text-gray-900" : "bg-pink-500 hover:bg-pink-600 text-white"} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className={`p-6 rounded-2xl shadow-lg w-80 transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"}`}>
            <h2 className="text-lg font-semibold mb-4">Are you sure you want to log out?</h2>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); setIsSidebarOpen(false); }} className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}>Cancel</button>
              <button onClick={handleLogout} className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${isDarkMode ? "bg-pink-400 hover:bg-pink-500 text-gray-900" : "bg-pink-500 hover:bg-pink-600 text-white"}`}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-4 rounded-xl shadow-lg flex items-center gap-3 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-700"}`}>
            <div className="w-6 h-6 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Logging out...</span>
          </div>
        </div>
      )}

      {/* Waveform CSS (scoped to component) */}
      <style>{`
        .wave-line { display: flex; align-items: center; }
        .wave-bars { display:flex; gap:4px; align-items:flex-end; height:100%; }
        .wave-bar {
          display:block;
          width:3px;
          background: linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.25));
          border-radius:2px;
          transform-origin: bottom center;
          height: 8px;
          opacity: 0.95;
          animation: wave 900ms linear infinite;
        }
        /* staggered delays for smooth wave */
        ${Array.from({length:24}).map((_,i)=>`.wave-bar.bar-${i}{ animation-delay: ${i*40}ms; }`).join('\n')}

        @keyframes wave {
          0% { transform: scaleY(0.3); opacity:0.6; }
          25% { transform: scaleY(1); opacity:1; }
          50% { transform: scaleY(0.5); opacity:0.8; }
          75% { transform: scaleY(0.9); opacity:0.95; }
          100% { transform: scaleY(0.35); opacity:0.65; }
        }

        /* make bars taller in dark mode */
        .dark .wave-bar { height: 10px; }
      `}</style>
    </div>
  );
};

export default ChatPage;
