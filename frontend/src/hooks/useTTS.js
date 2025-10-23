import { useEffect, useRef, useState, useCallback } from 'react';

const LS = {
  voiceId: 'vm_voiceId',
  rate: 'vm_rate',
  pitch: 'vm_pitch',
};

export default function useTTS() {
  const [voices, setVoices] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakRef = useRef({ utter: null });

  // Load voices
  useEffect(() => {
    const updateVoices = () => {
      const vs = speechSynthesis.getVoices();
      setVoices(vs);
      setLoaded(true);
    };
    updateVoices();
    speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () =>
      speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  // Get saved settings from localStorage
  const getSaved = () => ({
    voiceId: localStorage.getItem(LS.voiceId) || null,
    rate: parseFloat(localStorage.getItem(LS.rate)) || 1,
    pitch: parseFloat(localStorage.getItem(LS.pitch)) || 1,
  });

  // Save settings to localStorage
  const saveSettings = ({ voiceId, rate, pitch }) => {
    if (voiceId != null) localStorage.setItem(LS.voiceId, voiceId);
    if (rate != null) localStorage.setItem(LS.rate, String(rate));
    if (pitch != null) localStorage.setItem(LS.pitch, String(pitch));
  };

  // Speak function
  const speak = useCallback(
    (text, opts = {}) => {
      if (!text) return;

      // Stop any current speech
      speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      const saved = getSaved();

      const voiceId = opts.voiceId ?? saved.voiceId;
      const rate = opts.rate ?? saved.rate ?? 1;
      const pitch = opts.pitch ?? saved.pitch ?? 1;

      // Better voice fallback
      const chosen =
        voices.find((v) => v.voiceURI === voiceId) ||
        voices.find((v) => v.default) ||
        voices[0];

      if (chosen) utter.voice = chosen;
      utter.rate = rate;
      utter.pitch = pitch;

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      speakRef.current.utter = utter;
      speechSynthesis.speak(utter);

      return utter;
    },
    [voices]
  );

  // Stop speaking
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    voices,
    loaded,
    speak,
    stop,
    getSaved,
    saveSettings,
    isSpeaking,
  };
}
