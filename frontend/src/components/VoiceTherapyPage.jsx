// VoiceTherapyPage.jsx
import React, { useEffect, useState } from "react";
import useSTT from "../hooks/useSTT";
import useTTS from "../hooks/useTTS";
import { Mic, Send } from "lucide-react";
import AnimatedOrb from "../components/AnimatedOrb";

const VoiceTherapyPage = () => {
  const [input, setInput] = useState("");
  const [subtitles, setSubtitles] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // STT Hook (continuous listening)
  const {
    supported,
    listening,
    interim,
    final,
    start,
    stop,
    resetTranscript,
  } = useSTT({ lang: "en-US", continuous: true, interimResults: true });

  // TTS Hook
  const { speak, speaking, voices } = useTTS({
    onStart: () => setIsSpeaking(true),
    onEnd: () => {
      setIsSpeaking(false);
      start(); // auto-restart listening after speaking
    },
  });

  // Update input whenever final STT text changes
  useEffect(() => {
    if (final) setInput(final.trim());
  }, [final]);

  // Simple AI response logic
  const generateResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("hello")) return "Hello! How are you feeling today?";
    if (lower.includes("sad")) return "I'm here for you. Let's take a deep breath together.";
    if (lower.includes("fine")) return "That’s wonderful to hear!";
    if (lower.includes("angry")) return "It’s okay to feel angry. Let’s talk it out.";
    if (lower.includes("bye")) return "Goodbye! Remember, you’re doing great.";
    return "I understand. Tell me more about how you feel.";
  };

  // Microphone click
  const handleMicClick = () => {
    if (listening) stop();
    else {
      resetTranscript();
      start();
    }
  };

  // Send button (or manual trigger)
  const handleSend = () => {
    if (!input.trim()) return;

    const botReply = generateResponse(input);

    // Show subtitles temporarily
    setSubtitles(`You said: ${input}`);
    setInput("");

    // Stop listening while speaking
    stop();

    // Pick female voice if available
    const femaleVoice = voices.find((v) => v.name.toLowerCase().includes("female")) || voices[0];

    // Slight variation in pitch & rate for natural sound
    const pitch = 1 + Math.random() * 0.2; // 1 → 1.2
    const rate = 0.9 + Math.random() * 0.2; // 0.9 → 1.1

    speak(botReply, { voiceId: femaleVoice?.voiceURI, pitch, rate });
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-pink-50 p-4">
      {!supported && <p>Your browser does not support speech recognition.</p>}

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        {/* Animated orb */}
        <AnimatedOrb active={listening || isSpeaking || speaking} />

        {/* Live text preview */}
        <textarea
          value={interim || input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak or type your message..."
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          rows={3}
        />

        {/* Buttons */}
        <div className="w-full flex gap-2">
          <button
            onClick={handleMicClick}
            className={`flex-1 py-3 rounded-lg text-white ${
              listening ? "bg-pink-400 animate-pulse" : "bg-pink-500 hover:bg-pink-600"
            } flex items-center justify-center gap-2`}
          >
            <Mic className="w-5 h-5" />
            {listening ? "Listening..." : "Start Speaking"}
          </button>

          <button
            onClick={handleSend}
            className="flex-1 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>

        {/* Subtitles */}
        <div className="w-full mt-4 p-3 bg-white border border-gray-200 rounded-lg min-h-[50px]">
          <p className="text-gray-800">{subtitles}</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceTherapyPage;
