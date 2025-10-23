// VoiceTherapyPage.jsx
import React, { useState, useRef } from "react";
import useSTT from "../hooks/useSTT";
import { Mic, Send } from "lucide-react";
import AnimatedOrb from "../components/AnimatedOrb";

const VoiceTherapyPage = () => {
  const [input, setInput] = useState("");
  const [subtitles, setSubtitles] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const { start, stop, supported } = useSTT({
    onFinalResult: (text) => setInput(text),
  });

  const synthRef = useRef(window.speechSynthesis);

  const handleMicClick = () => {
    if (isListening) {
      stop();
      setIsListening(false);
    } else {
      start();
      setIsListening(true);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Clear previous subtitles
    setSubtitles("");

    // Speak the input (simulate AI reply)
    const utterance = new SpeechSynthesisUtterance(input);
    utterance.lang = "en-US";
    utterance.rate = 1; // speed of speech

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    // Real-time subtitle sync
    utterance.onboundary = (event) => {
      if (event.name === "word" || event.name === undefined) {
        const spoken = input.slice(0, event.charIndex + event.charLength);
        setSubtitles(spoken);
      }
    };

    synthRef.current.speak(utterance);
    setInput(""); // clear input after sending
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-pink-50 p-4">
      {!supported && <p>Your browser does not support speech recognition.</p>}

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <AnimatedOrb active={isListening || isSpeaking} />

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Your speech will appear here..."
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          rows={3}
        />

        <div className="w-full flex gap-2">
          <button
            onClick={handleMicClick}
            className={`flex-1 py-3 rounded-lg text-white ${
              isListening ? "bg-pink-400 animate-pulse" : "bg-pink-500 hover:bg-pink-600"
            } flex items-center justify-center gap-2`}
          >
            <Mic className="w-5 h-5" />
            {isListening ? "Recording..." : "Start Recording"}
          </button>

          <button
            onClick={handleSend}
            className="flex-1 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>

        <div className="w-full mt-4 p-3 bg-white border border-gray-200 rounded-lg min-h-[50px]">
          <p className="text-gray-800">{subtitles}</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceTherapyPage;
