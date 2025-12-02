// src/components/SystemSettings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import useTTS from "../../hooks/useTTS"; // adjust path if needed
import { supabase } from "../../supabaseClient"; // keep as you had

const SystemSettings = ({ preferences, setPreferences }) => {
  const { theme, changeTheme } = useTheme();

  const tts = useTTS();
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [availableLangs, setAvailableLangs] = useState([]);

  useEffect(() => {
    if (tts.loaded) setVoicesLoaded(true);
  }, [tts.loaded]);

  // update language list when TTS voices load or change
  useEffect(() => {
    if (!tts) return;
    try {
      const langs = tts.availableLanguages ? tts.availableLanguages() : [];
      setAvailableLangs(langs);
    } catch (e) {
      setAvailableLangs([]);
    }
  }, [tts, tts.loaded, tts.voices]);

  // When voices become available, set sensible defaults (without changing UI structure)
  useEffect(() => {
    if (!voicesLoaded) return;

    // default language if not set
    if (!preferences.language) {
      const defaultLang = availableLangs.includes("en-US") ? "en-US" : availableLangs[0] || "en-US";
      setPreferences((p) => ({ ...p, language: defaultLang }));
      tts.saveSettings({ lang: defaultLang });
      // pick and persist voice for that language
      const pick = tts.pickVoiceFor(preferences.voice || "Female", defaultLang);
      if (pick && pick.voiceURI) {
        tts.saveSettings({ voiceId: pick.voiceURI });
      }
    }

    // Ensure playbackSpeed exists
    if (preferences.playbackSpeed == null) {
      setPreferences((p) => ({ ...p, playbackSpeed: p.playbackSpeed || 1.0 }));
    }

    // Ensure voice default
    if (!preferences.voice) {
      setPreferences((p) => ({ ...p, voice: "Female" }));
      tts.saveSettings({ gender: preferences.voice || "Female" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicesLoaded, availableLangs]);

  // Called when language changes
  const onLanguageChange = (lang) => {
    setPreferences({ ...preferences, language: lang });
    // persist to TTS hook
    tts.saveSettings({ lang });

    // pick a best match voice for chosen language & current gender preference
    const genderPref = preferences.voice || "Female";
    const pick = tts.pickVoiceFor(genderPref, lang);
    if (pick && pick.voiceURI) {
      tts.saveSettings({ voiceId: pick.voiceURI });
      // optionally store voiceId in preferences if you want (not required by UI)
      setPreferences((p) => ({ ...p, voiceId: pick.voiceURI }));
    }
  };

  // Called when voice (Male/Female) changed
  const onVoiceChange = (voiceGender) => {
    setPreferences({ ...preferences, voice: voiceGender });
    tts.saveSettings({ gender: voiceGender });

    // choose a better voice for current language
    const lang = preferences.language || (availableLangs[0] || null);
    const pick = tts.pickVoiceFor(voiceGender, lang);
    if (pick && pick.voiceURI) {
      tts.saveSettings({ voiceId: pick.voiceURI });
      setPreferences((p) => ({ ...p, voiceId: pick.voiceURI }));
    }
  };

  // Called when playback speed changed
  const onPlaybackSpeedChange = (speed) => {
    const parsed = parseFloat(speed);
    setPreferences({ ...preferences, playbackSpeed: parsed });
    tts.saveSettings({ rate: parsed });
  };

  // Test voice using current preferences (calls the hook)
  const handleTestVoice = () => {
    const gender = preferences.voice || "Female";
    const rate = preferences.playbackSpeed || 1.0;
    const lang = preferences.language || (availableLangs[0] || "en-US");
    const sample =
      preferences.tone === "Calm"
        ? "This is a calm voice test."
        : preferences.tone === "Motivational"
        ? "You can do this. Let's go."
        : preferences.tone === "Empathetic"
        ? "I hear you. It's okay to feel that way."
        : "This is a sample.";

    tts.speakTest({ text: sample, gender, rate, lang });
  };

  return (
    <div className="space-y-6 text-sm text-gray-900 dark:text-gray-50 transition-colors duration-300">
      <h3 className="text-xl font-semibold text-pink-700 dark:text-pink-400">Preferences</h3>

      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Tone */}
        <div>
          <label className="font-medium">Tone</label>
          <select
            value={preferences.tone}
            onChange={(e) => setPreferences({ ...preferences, tone: e.target.value })}
            className="w-full border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 transition-colors duration-300"
          >
            <option>Calm</option>
            <option>Motivational</option>
            <option>Empathetic</option>
            <option>Neutral</option>
          </select>
        </div>

        {/* Default Mode */}
        <div>
          <label className="font-medium">Default Mode</label>
          <select
            value={preferences.defaultMode}
            onChange={(e) => setPreferences({ ...preferences, defaultMode: e.target.value })}
            className="w-full border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 transition-colors duration-300"
          >
            <option>Conversation</option>
            <option>Voice-only</option>
          </select>
        </div>

        {/* Session Length */}
        <div>
          <label className="font-medium">Session Length</label>
          <select
            value={preferences.sessionLength || "No limit"}
            onChange={(e) => setPreferences({ ...preferences, sessionLength: e.target.value })}
            className="w-full border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 transition-colors duration-300"
          >
            <option>No limit</option>
            <option>30 min</option>
            <option>Custom</option>
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="font-medium">Theme</label>
          <select
            value={theme === "dark" ? "Dark" : "Light"}
            onChange={(e) => {
              const newTheme = e.target.value === "Dark" ? "dark" : "light";
              changeTheme(newTheme);
              setPreferences({ ...preferences, theme: e.target.value });
            }}
            className="w-full border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 transition-colors duration-300"
          >
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>
      </motion.div>

      {/* Auto-Greet */}
      <motion.div className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <input
          type="checkbox"
          checked={preferences.autoGreet}
          onChange={(e) => setPreferences({ ...preferences, autoGreet: e.target.checked })}
          className="accent-pink-500 dark:accent-pink-400"
        />
        <span>Auto-greet on session start</span>
      </motion.div>

      {/* Notifications */}
      <motion.div className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
        <input
          type="checkbox"
          checked={preferences.notifications}
          onChange={async (e) => {
            const checked = e.target.checked;
            setPreferences({ ...preferences, notifications: checked });
            if (checked) {
              try {
                const { data: authData } = await supabase.auth.getUser();
                const userEmail = authData?.user?.email;
                if (!userEmail) return;
                await fetch("/api/send-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: userEmail, subject: "Daily Check-In", content: "Your daily reminder." }),
                });
              } catch (err) {
                console.error("Failed to trigger notification:", err);
              }
            }
          }}
          className="accent-pink-500 dark:accent-pink-400"
        />
        <span>Enable daily check-in & reminders</span>
      </motion.div>

      {/* Voice Settings */}
      <motion.div className="grid grid-cols-3 gap-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div>
          <label className="font-medium">Voice</label>
          <select
            value={preferences.voice || "Female"}
            onChange={(e) => onVoiceChange(e.target.value)}
            className="w-full border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 transition-colors duration-300"
          >
            <option>Female</option>
            <option>Male</option>
          </select>
        </div>

        <div>
          <label className="font-medium">Playback Speed</label>
          <select
            value={preferences.playbackSpeed || 1.0}
            onChange={(e) => onPlaybackSpeedChange(e.target.value)}
            className="w-full border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 transition-colors duration-300"
          >
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
          </select>
        </div>

        <div>
          <label className="font-medium">Language</label>
          <select
            value={preferences.language || (availableLangs[0] || "en-US")}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 transition-colors duration-300"
          >
            {availableLangs.length === 0 && <option>en-US</option>}
            {availableLangs.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Autoplay reply checkbox */}
        <div className="flex items-center gap-2 mt-6 col-span-1">
          <input
            type="checkbox"
            checked={preferences.autoplayReply}
            onChange={(e) => setPreferences({ ...preferences, autoplayReply: e.target.checked })}
            className="accent-pink-500 dark:accent-pink-400"
          />
          <span>Autoplay reply</span>
        </div>
      </motion.div>

      {/* Test controls */}
      <div className="flex items-center gap-2 mt-2">
        <button onClick={handleTestVoice} className="px-3 py-2 rounded bg-pink-500 hover:bg-pink-600 text-white">
          Test Voice
        </button>
        <div className="text-xs text-gray-500 dark:text-gray-400">{voicesLoaded ? "Voices loaded from browser" : "Loading voices..."}</div>
      </div>
    </div>
  );
};

export default SystemSettings;
