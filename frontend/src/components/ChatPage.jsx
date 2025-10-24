// ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Send, Mic } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../contexts/ThemeContext";
import dayjs from "dayjs";

const ChatPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // ✅ Added sidebar + voice mode state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [voiceModeOn, setVoiceModeOn] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState(null);
  const [listeningText, setListeningText] = useState("");
  const silenceTimer = useRef(null);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return navigate("/");
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data.user.id)
        .single();
      setUser({
        ...data.user,
        full_name: profile?.full_name || "User",
        avatar_url: profile?.avatar_url || null,
      });
      fetchSessions(data.user.id);
    };
    getUser();
  }, [navigate]);

  const fetchSessions = async (uid) => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) {
      setSessions(data);
      if (data.length && !currentSessionId) setCurrentSessionId(data[0].id);
    }
  };

  const fetchMessages = async () => {
    if (!userId || !currentSessionId) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .eq("session_id", currentSessionId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
  }, [userId, currentSessionId]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
    setListeningText("");
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
  }, []);

  const startRecording = async () => {
    if (recording) {
      stopRecording();
      return;
    }

    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("Speech Recognition not supported on this browser!");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    setRecording(true);
    setListeningText("Listening...");
    let finalTranscript = "";

    recognition.onresult = (event) => {
      const interimTranscript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setInput(interimTranscript);

      if (event.results[event.results.length - 1].isFinal) {
        finalTranscript = interimTranscript.trim();
        setTranscriptPreview(finalTranscript);
      }

      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => stopRecording(), 3000);
    };

    recognition.onend = () => {
      stopRecording();
      if (finalTranscript) handleSend(finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      stopRecording();
    };

    recognition.start();
  };

  const handleSend = async (overrideText) => {
    const text = (overrideText || input || transcriptPreview)?.trim();
    if (!text || !userId || !currentSessionId) return;

    setInput("");
    setTranscriptPreview(null);

    const userMessage = {
      user_id: userId,
      session_id: currentSessionId,
      sender: "user",
      text,
    };
    const { data: savedMsg } = await supabase.from("messages").insert([userMessage]).select();
    setMessages((prev) => [...prev, savedMsg[0]]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const aiMsg = {
        user_id: userId,
        session_id: currentSessionId,
        sender: "ai",
        text: data.reply || "⚠️ No response",
      };
      const { data: savedAiMsg } = await supabase.from("messages").insert([aiMsg]).select();
      setMessages((prev) => [...prev, savedAiMsg[0]]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`h-screen flex ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-pink-50 text-gray-800"}`}>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        handleNewConversation={() => {}}
        setShowModal={() => {}}
        setSessions={setSessions}
        user={user}
        voiceModeOn={voiceModeOn}         // ✅ Added
        setVoiceModeOn={setVoiceModeOn}   // ✅ Added
      />

      <main className="flex-1 flex flex-col">
        {/* Chat area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs sm:max-w-md shadow transition-all ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-tr-none"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none"
                    : "bg-white border border-pink-200 text-gray-800 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {dayjs(msg.created_at).format("h:mm A")}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center space-x-1 text-gray-400">
              <span className="text-lg animate-pulse">...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          className={`p-4 border-t flex flex-col gap-2 ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-pink-50 border-pink-200"
          }`}
        >
          {recording && (
            <p className="text-center text-sm text-pink-500 font-medium transition-all">
              🎤 {listeningText}
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or use mic..."
              className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-800"
              }`}
            />
            <button
              onClick={startRecording}
              className={`relative p-3 rounded-xl transition-all ${
                recording ? "bg-pink-500 text-white shadow-lg" : "bg-pink-500 hover:bg-pink-600 text-white"
              }`}
            >
              <Mic className="w-5 h-5" />
              {recording && (
                <span className="absolute inset-0 rounded-xl border-2 border-pink-400 opacity-70" />
              )}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
