import React, { useEffect, useMemo, useState } from "react";
import useSTT from "../hooks/useSTT";
import useTTS from "../hooks/useTTS";
import { Mic, Send, XCircle } from "lucide-react";
import AnimatedOrb from "../components/AnimatedOrb";
import { useTheme } from "../contexts/ThemeContext";

// Settings stub (wire to Settings page later)
const voiceSettings = {
  lang: "en-IN",
  preferredVoiceURI: "",
  proVoice: false,   // if you later use /api/tts natural voices
  muted: false,
};

const VoiceTherapyPage = () => {
  const { theme } = useTheme?.() || { theme: "light" };
  const isDark = theme === "dark";

  const [input, setInput] = useState("");
  const [subtitles, setSubtitles] = useState("");
  const [uiListening, setUiListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // STT: one utterance per start; no auto-restart
  const {
    supported,
    listening,
    interim,
    final,
    start,
    stop,
    resetTranscript,
    setLang: setSTTLang,
  } = useSTT({ lang: voiceSettings.lang, continuous: false, interimResults: true });

  // TTS: web speech
  const { speak, speaking, voices, ready: ttsReady, cancelAll } = useTTS({
    onStart: () => setIsSpeaking(true),
    onEnd: () => setIsSpeaking(false),
  });

  // sync UI with hook: if browser ended recognition, reflect it
  useEffect(() => {
    if (!listening && uiListening) setUiListening(false);
  }, [listening]);

  useEffect(() => {
    setSTTLang?.(voiceSettings.lang);
  }, [voiceSettings.lang]);

  // choose a voice
  const selectedVoice = useMemo(() => {
    if (!ttsReady || !voices?.length) return null;
    const saved = voices.find(v => v.voiceURI === voiceSettings.preferredVoiceURI);
    if (saved) return saved;
    const lang = (voiceSettings.lang || "").toLowerCase();
    const matches = voices.filter(v => (v.lang || "").toLowerCase() === lang);
    if (matches.length) {
      return matches.find(v => /female|google/i.test(v.name)) || matches[0];
    }
    return voices.find(v => /en-/i.test(v.lang)) || voices[0];
  }, [ttsReady, voices]);

  // Accept final once and stop listening (single speak → valid result)
  useEffect(() => {
    if (!final) return;
    if (uiListening) {
      setInput(final.trim());
      setUiListening(false);
    }
  }, [final, uiListening]);

  // If TTS is speaking, force-stop STT
  useEffect(() => {
    if (speaking || isSpeaking) {
      stop();
      setUiListening(false);
    }
  }, [speaking, isSpeaking, stop]);

  // Stop everything if tab hidden (prevents stuck states)
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stop();
        setUiListening(false);
        cancelAll?.();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [stop, cancelAll]);

  // Same logic as ChatPage: call your backend /api/chat
  const fetchAIResponse = async (message) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        console.error("API /api/chat failed:", res.status, await res.text());
        return "I’m here to listen. Could you say that again?";
      }
      const data = await res.json();
      return data?.reply || "I’m here to listen.";
    } catch (err) {
      console.error("Network error calling /api/chat:", err);
      return "I’m here to listen. Could you say that again?";
    }
  };

  // speak helper (web TTS)
  const playWithWebTTS = (text) => {
    if (voiceSettings.muted || !text) return;
    const pitch = 1 + Math.random() * 0.12;
    const rate  = 0.95 + Math.random() * 0.1;
    const voice = selectedVoice;
    speak(text, {
      voiceId: voice?.voiceURI,
      pitch,
      rate,
      lang: voice?.lang || voiceSettings.lang,
    });
  };

  // controls
  const handleStartSpeaking = () => {
    if (speaking || isSpeaking) return; // block while TTS talking
    resetTranscript();
    setUiListening(true);
    start(); // one utterance; browser will auto-end after final
  };

  const handleStopListening = () => {
    setUiListening(false);
    stop();
    // don't clear input; user can discard
  };

  const handleDiscard = () => {
    setInput("");
    resetTranscript();
  };

  const handleSend = async () => {
    const text = (input || "").trim();
    if (!text) return;

    setSubtitles(`You: ${text}\nTherapist: ...thinking...`);
    setInput("");
    handleStopListening();

    const botReply = await fetchAIResponse(text);

    setSubtitles(`You: ${text}\nTherapist: ${botReply}`);
    playWithWebTTS(botReply);
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${isDark ? "dark" : ""}`}>
      {/* Background */}
      <div className={`absolute inset-0 ${isDark ? "bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950" : "bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50"}`} />
      {/* Blobs */}
      <div className={`pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full ${isDark ? "bg-pink-300/10" : "bg-pink-300/30"} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-20 -right-16 h-96 w-96 rounded-full ${isDark ? "bg-amber-200/10" : "bg-amber-200/30"} blur-3xl`} />
      <div className={`pointer-events-none absolute top-1/3 right-1/3 h-64 w-64 rounded-full ${isDark ? "bg-rose-200/10" : "bg-rose-200/25"} blur-3xl`} />

      {/* Content container */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className={`w-full max-w-2xl rounded-3xl ${isDark ? "border-white/10 bg-white/5" : "border-white/60 bg-white/70"} border backdrop-blur-xl shadow-xl p-6 md:p-8`}>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                Voice Therapy
              </h1>
              <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                A gentle space to talk. I’ll listen, then respond softly.
              </p>
            </div>

            {/* Therapist orb + status */}
            <div className="flex items-center gap-3">
              <AnimatedOrb active={uiListening || isSpeaking || speaking} />
              <div
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  uiListening
                    ? (isDark ? "bg-pink-900/40 text-pink-200" : "bg-pink-100 text-pink-700")
                    : (isSpeaking || speaking)
                    ? (isDark ? "bg-amber-900/40 text-amber-200" : "bg-amber-100 text-amber-700")
                    : (isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600")
                }`}
              >
                {uiListening ? "Listening" : (isSpeaking || speaking) ? "Speaking" : "Idle"}
              </div>
            </div>
          </div>

          {/* Breathing guide bar (gentle animation) */}
          <div className="mb-5">
            <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-gray-200/80"}`}>
              <div className={`h-full w-24 animate-breathe rounded-full ${isDark ? "bg-pink-400/70" : "bg-pink-400/80"}`} />
            </div>
            <style>{`
              @keyframes breathe {
                0% { transform: translateX(0); }
                50% { transform: translateX(100%); }
                100% { transform: translateX(0); }
              }
              .animate-breathe { animation: breathe 6s ease-in-out infinite; }
            `}</style>
          </div>

          {/* Text area + discard */}
          <div className="relative">
            <label className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Your words
            </label>
            <textarea
              value={interim || input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak or type your message…"
              className={`w-full rounded-2xl border p-4 pr-12 shadow-sm outline-none transition
                ${isDark
                  ? "border-gray-700 bg-white/5 text-gray-100 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30"
                  : "border-pink-200/60 bg-white/80 text-gray-800 placeholder:text-gray-500 focus:border-pink-400 focus:ring-2 focus:ring-pink-200/70"
                }`}
              rows={4}
            />
            {!uiListening && (input || interim) ? (
              <button
                onClick={handleDiscard}
                className={`group absolute right-2 top-9 inline-flex items-center gap-1 rounded-full px-3 py-1 transition
                  ${isDark ? "bg-rose-900/30 text-rose-200 hover:bg-rose-900/50" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
                title="Discard this line"
              >
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Discard</span>
              </button>
            ) : null}
          </div>

          {/* Controls */}
          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            {!uiListening ? (
              <button
                onClick={handleStartSpeaking}
                disabled={speaking || isSpeaking}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-white transition shadow-sm
                  ${speaking || isSpeaking
                    ? "bg-gray-400/40 cursor-not-allowed"
                    : "bg-pink-500 hover:bg-pink-600"
                  }`}
              >
                <Mic className="h-5 w-5" />
                Start Speaking
              </button>
            ) : (
              <button
                onClick={handleStopListening}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-white transition shadow-sm
                  ${isDark ? "bg-rose-600 hover:bg-rose-500" : "bg-rose-500 hover:bg-rose-600"}`}
              >
                <Mic className="h-5 w-5 rotate-90" />
                Stop Listening
              </button>
            )}

            <button
              onClick={handleSend}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-white transition shadow-sm
                ${isDark ? "bg-pink-500 hover:bg-pink-400" : "bg-pink-500 hover:bg-pink-600"}`}
            >
              <Send className="h-5 w-5" />
              Send
            </button>
          </div>

          {/* Subtitles / Therapy note */}
          <div className={`mt-6 rounded-2xl p-4 shadow-sm border
            ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-pink-100"}`}>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-gray-200" : "text-gray-800"}`}>
              {subtitles || "Your conversation will appear here."}
            </p>
          </div>

          {/* Gentle footer tip */}
          <div className={`mt-4 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Tip: Speak one short thought at a time. You can discard and re-try anytime.
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTherapyPage;
