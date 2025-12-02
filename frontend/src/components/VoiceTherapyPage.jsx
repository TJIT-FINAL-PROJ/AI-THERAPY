import React, { useEffect, useMemo, useRef, useState } from "react";
import useSTT from "../hooks/useSTT";
import useTTS from "../hooks/useTTS";
import { Mic, Send, XCircle } from "lucide-react";
import AnimatedOrb from "../components/AnimatedOrb";

// Settings (from Settings Page later)
const voiceSettings = {
  lang: "en-IN",
  preferredVoiceURI: "",
  proVoice: false,
  muted: false,
};

const VoiceTherapyPage = () => {
  const [input, setInput] = useState("");
  const [subtitles, setSubtitles] = useState("");
  const [uiListening, setUiListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Speech-to-Text (single utterance)
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

  // Text-to-Speech
  const { speak, speaking, voices, ready: ttsReady, cancelAll } = useTTS({
    onStart: () => setIsSpeaking(true),
    onEnd: () => setIsSpeaking(false),
  });

  // Keep UI in sync with STT hook
  useEffect(() => {
    if (!listening && uiListening) setUiListening(false);
  }, [listening]);

  useEffect(() => {
    setSTTLang?.(voiceSettings.lang);
  }, [voiceSettings.lang]);

  // Choose voice
  const selectedVoice = useMemo(() => {
    if (!ttsReady || !voices?.length) return null;
    const saved = voices.find(v => v.voiceURI === voiceSettings.preferredVoiceURI);
    if (saved) return saved;
    const lang = (voiceSettings.lang || "").toLowerCase();
    const matches = voices.filter(v => (v.lang || "").toLowerCase() === lang);
    if (matches.length)
      return matches.find(v => /female|google/i.test(v.name)) || matches[0];
    return voices.find(v => /en-/i.test(v.lang)) || voices[0];
  }, [ttsReady, voices]);

  // Accept final result on stop
  useEffect(() => {
    if (!final) return;
    if (uiListening) {
      setInput(final.trim());
      setUiListening(false);
    }
  }, [final, uiListening]);

  // Pause STT if TTS is speaking
  useEffect(() => {
    if (speaking || isSpeaking) {
      stop();
      setUiListening(false);
    }
  }, [speaking, isSpeaking, stop]);

  // Stop everything if tab hidden
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

  // Fetch dynamic AI reply (Groq API)
  const fetchAIResponse = async (message) => {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are an empathetic AI therapist offering emotional support, using simple, comforting, and natural language.",
            },
            ...chatHistory,
            { role: "user", content: message },
          ],
        }),
      });

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content || "I'm here to listen.";
      return reply;
    } catch (err) {
      console.error("Groq API Error:", err);
      return "I'm having trouble understanding right now. Could you repeat that?";
    }
  };

  // Play voice output
  const playWithWebTTS = (text) => {
    if (voiceSettings.muted || !text) return;
    const pitch = 1 + Math.random() * 0.12;
    const rate = 0.95 + Math.random() * 0.1;
    const voice = selectedVoice;
    speak(text, {
      voiceId: voice?.voiceURI,
      pitch,
      rate,
      lang: voice?.lang || voiceSettings.lang,
    });
  };

  const playWithProTTS = async (text) => {
    if (voiceSettings.muted || !text) return;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Pro TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      stop();
      setUiListening(false);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      playWithWebTTS(text);
    }
  };

  // Controls
  const handleStartSpeaking = () => {
    if (speaking || isSpeaking) return;
    resetTranscript();
    setUiListening(true);
    start();
  };

  const handleStopListening = () => {
    setUiListening(false);
    stop();
  };

  const handleDiscard = () => {
    setInput("");
    resetTranscript();
  };

  // Main Send
  const handleSend = async () => {
    const text = (input || "").trim();
    if (!text) return;

    setSubtitles(`You: ${text}\nTherapist: ...thinking...`);
    setInput("");
    handleStopListening();

    // Get AI reply
    const botReply = await fetchAIResponse(text);

    // Update subtitles
    setSubtitles(`You: ${text}\nTherapist: ${botReply}`);
    setChatHistory(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: botReply }]);

    // Speak reply
    if (voiceSettings.proVoice) playWithProTTS(botReply);
    else playWithWebTTS(botReply);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-pink-50 p-4">
      {!supported && (
        <p className="mb-2 text-sm text-red-600">
          Your browser does not support speech recognition.
        </p>
      )}

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <AnimatedOrb active={uiListening || isSpeaking || speaking} />

        {/* Input with Discard */}
        <div className="w-full relative">
          <textarea
            value={interim || input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Speak or type your message..."
            className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
            rows={3}
          />
          {!uiListening && (input || interim) ? (
            <button
              onClick={handleDiscard}
              className="absolute right-2 top-2 p-2 rounded-md text-rose-600 hover:bg-rose-50"
              title="Discard this line"
            >
              <XCircle className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        {/* Controls */}
        <div className="w-full flex gap-2">
          {!uiListening ? (
            <button
              onClick={handleStartSpeaking}
              disabled={speaking || isSpeaking}
              className={`flex-1 py-3 rounded-lg ${
                speaking || isSpeaking
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-pink-500 hover:bg-pink-600"
              } text-white flex items-center justify-center gap-2`}
            >
              <Mic className="w-5 h-5" />
              Start Speaking
            </button>
          ) : (
            <button
              onClick={handleStopListening}
              className="flex-1 py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center gap-2"
            >
              Stop Listening
            </button>
          )}

          <button
            onClick={handleSend}
            className="flex-1 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>

        {/* Subtitles */}
        <div className="w-full mt-2 p-3 bg-white border border-gray-200 rounded-lg min-h-[56px] whitespace-pre-wrap">
          <p className="text-gray-800">{subtitles}</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceTherapyPage;
