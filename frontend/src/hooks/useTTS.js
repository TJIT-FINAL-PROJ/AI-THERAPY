// src/hooks/useTTS.js
import { useCallback, useEffect, useRef, useState } from "react";

const LS = {
  voiceId: "vm_voiceId",
  rate: "vm_rate",
  pitch: "vm_pitch",
  lang: "vm_lang",
  gender: "vm_gender",
};

// small helper for persisted settings
const getSaved = () => ({
  voiceId: localStorage.getItem(LS.voiceId) || null,
  rate: parseFloat(localStorage.getItem(LS.rate)) || 1,
  pitch: parseFloat(localStorage.getItem(LS.pitch)) || 1,
  lang: localStorage.getItem(LS.lang) || null,
  gender: localStorage.getItem(LS.gender) || null,
});

const saveSettings = ({ voiceId, rate, pitch, lang, gender }) => {
  if (voiceId != null) localStorage.setItem(LS.voiceId, voiceId);
  if (rate != null) localStorage.setItem(LS.rate, String(rate));
  if (pitch != null) localStorage.setItem(LS.pitch, String(pitch));
  if (lang != null) localStorage.setItem(LS.lang, lang);
  if (gender != null) localStorage.setItem(LS.gender, gender);
};

export default function useTTS() {
  const [voices, setVoices] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakRef = useRef({ utter: null });

  // Load voices (handle onvoiceschanged)
  useEffect(() => {
    const loadVoices = () => {
      const vs = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
      setVoices(vs);
      setLoaded(true);
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    // cleanup
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Utility: get unique language codes present in voices (sorted)
  const availableLanguages = useCallback(() => {
    const langs = Array.from(new Set(voices.map((v) => v.lang))).sort();
    return langs;
  }, [voices]);

  // Filter voices by language code prefix (e.g. "en" or "en-US")
  const voicesByLanguage = useCallback(
    (langPrefix) => {
      if (!voices || voices.length === 0) return [];
      if (!langPrefix) return voices;
      return voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
    },
    [voices]
  );

  // Heuristic pick of voice by gender hint (best-effort)
  const pickVoiceFor = useCallback(
    (gender = "Female", lang = null) => {
      const pool = lang ? voicesByLanguage(lang) : voices;
      if (!pool || pool.length === 0) return null;

      const hintsFemale = ["female", "woman", "zira", "samantha", "victoria", "alloy", "aria", "google", "amazon", "apple"];
      const hintsMale = ["male", "man", "david", "mark", "alex", "michael", "john", "en-us", "google", "amazon", "apple"];

      const hints = (gender || "Female").toLowerCase().startsWith("f") ? hintsFemale : hintsMale;

      // 1) name includes hint
      for (const hint of hints) {
        const found = pool.find((v) => v.name && v.name.toLowerCase().includes(hint));
        if (found) return found;
      }

      // 2) voiceURI includes hint
      for (const hint of hints) {
        const found = pool.find((v) => v.voiceURI && v.voiceURI.toLowerCase().includes(hint));
        if (found) return found;
      }

      // 3) branded voices (Google/Microsoft/Amazon etc.)
      const branded = pool.find((v) => /google|microsoft|amazon|apple/i.test(v.name || v.voiceURI));
      if (branded) return branded;

      // 4) fallback: non-default first, then first
      const nonDefault = pool.find((v) => !v.default);
      return nonDefault || pool[0];
    },
    [voices, voicesByLanguage]
  );

  // Speak text using chosen options (voiceId optional)
  const speak = useCallback(
    (text, opts = {}) => {
      if (!("speechSynthesis" in window)) {
        console.warn("SpeechSynthesis not supported in this browser.");
        return null;
      }
      if (!text || text.trim() === "") return null;

      // cancel any current speech
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      const saved = getSaved();

      const rate = opts.rate ?? saved.rate ?? 1;
      const pitch = opts.pitch ?? saved.pitch ?? 1;
      const lang = opts.lang ?? saved.lang ?? null;
      const gender = opts.gender ?? saved.gender ?? null;
      const voiceId = opts.voiceId ?? saved.voiceId ?? null;

      let chosen = null;
      if (voiceId) {
        chosen = voices.find((v) => v.voiceURI === voiceId || v.name === voiceId) || null;
      }
      if (!chosen) {
        chosen = pickVoiceFor(gender || "Female", lang || null) || voices[0] || null;
      }

      if (chosen) {
        utter.voice = chosen;
        // keep language if available
        if (lang) utter.lang = lang;
      }
      utter.rate = rate;
      utter.pitch = pitch;

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      speakRef.current.utter = utter;
      window.speechSynthesis.speak(utter);

      return utter;
    },
    [voices, pickVoiceFor]
  );

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speakTest = useCallback(
    ({ text = "This is a voice test", gender = "Female", rate = 1, pitch = 1, lang = null } = {}) => {
      // small wrapper to speak with given prefs
      if (!voices || voices.length === 0) {
        console.warn("No voices available for test.");
      }
      return speak(text, { gender, rate, pitch, lang });
    },
    [speak, voices]
  );

  // Expose save/get settings helpers
  const save = useCallback((settings) => saveSettings(settings), []);
  const getSavedSettings = useCallback(() => getSaved(), []);

  return {
    voices,
    loaded,
    isSpeaking,
    speak,
    stop,
    speakTest,
    availableLanguages,
    voicesByLanguage,
    pickVoiceFor,
    getSaved: getSavedSettings,
    saveSettings: save,
  };
}
