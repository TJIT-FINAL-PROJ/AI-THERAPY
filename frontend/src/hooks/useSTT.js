import { useEffect, useRef, useState, useCallback } from 'react';

export default function useSTT({
  lang = 'en-US',
  continuous = false,
  interimResults = true,
} = {}) {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [finalText, setFinalText] = useState('');
  const [sessionFinal, setSessionFinal] = useState(''); // for confirmed text

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      console.warn('STT error', e);
      setListening(false);
    };

    rec.onresult = (ev) => {
      let interimText = '';
      let finalAccum = '';

      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (result.isFinal) finalAccum += result[0].transcript;
        else interimText += result[0].transcript;
      }

      setInterim(interimText);

      if (finalAccum) {
        setFinalText((prev) => (prev ? prev + ' ' + finalAccum : finalAccum));
      }
    };

    recognitionRef.current = rec;

    return () => {
      try {
        recognitionRef.current && recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping STT:', e);
      }
      recognitionRef.current = null;
    };
  }, [lang, continuous, interimResults]);

  // Start listening
  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn('Error starting STT:', e);
    }
  }, [listening]);

  // Stop listening
  const stop = useCallback(() => {
    try {
      recognitionRef.current && recognitionRef.current.stop();
    } catch (e) {
      console.warn('Error stopping STT:', e);
    }
  }, []);

  // Reset both interim and final text
  const resetTranscript = useCallback(() => {
    setInterim('');
    setFinalText('');
    setSessionFinal('');
  }, []);

  // Confirm final text (like user taps “send” after preview)
  const confirmFinal = useCallback(() => {
    setSessionFinal(finalText); // save confirmed final text
    resetTranscript(); // reset interim & final for next recording
  }, [finalText, resetTranscript]);

  return {
    supported,
    listening,
    interim,       // live text while speaking
    final: finalText,  // cumulative text while speaking
    confirmed: sessionFinal, // user-confirmed final text
    start,
    stop,
    resetTranscript,
    confirmFinal, // call this when user presses "send" after preview
  };
}
