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
  const [sessionFinal, setSessionFinal] = useState('');

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

    // Start event
    rec.onstart = () => {
      console.log('🎙️ STT started');
      setListening(true);
    };

    // End event — auto restart if in continuous mode
    rec.onend = () => {
      console.log('🛑 STT ended');
      setListening(false);

      if (continuous) {
        console.log('🔁 Auto-restarting recognition...');
        try {
          rec.start();
        } catch (err) {
          console.warn('Restart error:', err);
        }
      }
    };

    // Handle errors
    rec.onerror = (e) => {
      console.warn('⚠️ STT error', e);
      setListening(false);

      // Restart automatically except for "no-speech" or "aborted"
      if (continuous && e.error !== 'no-speech' && e.error !== 'aborted') {
        console.log('Retrying after error...');
        setTimeout(() => {
          try {
            rec.start();
          } catch (err) {
            console.warn('Error restarting after error:', err);
          }
        }, 500);
      }
    };

    // Handle results
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

    // Cleanup
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
      console.log('🎤 STT manually started');
    } catch (e) {
      console.warn('Error starting STT:', e);
    }
  }, [listening]);

  // Stop listening
  const stop = useCallback(() => {
    try {
      recognitionRef.current && recognitionRef.current.stop();
      console.log('🧏 STT manually stopped');
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

  // Confirm final text (like user taps “send”)
  const confirmFinal = useCallback(() => {
    setSessionFinal(finalText);
    resetTranscript();
  }, [finalText, resetTranscript]);

  return {
    supported,
    listening,
    interim,        // Live partial text
    final: finalText, // Collected full text
    confirmed: sessionFinal, // Confirmed after send
    start,
    stop,
    resetTranscript,
    confirmFinal,
  };
}
