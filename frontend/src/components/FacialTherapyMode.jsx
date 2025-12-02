// src/components/FacialTherapyMode.jsx
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const MODEL_PATH = "/models"; // models must be in public/models/

const FacialTherapyMode = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState("loading"); 
  const [topExpression, setTopExpression] = useState(null);
  const [allExpressions, setAllExpressions] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Debug / device states
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [debug, setDebug] = useState([]);

  const pushDebug = (msg) => {
    setDebug((d) => [...d.slice(-80), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    let mounted = true;
    const loadModels = async () => {
      try {
        pushDebug("Loading face-api models...");
        setStatus("loading");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH);

        if (!mounted) return;
        setModelsLoaded(true);
        setStatus("ready");
        pushDebug("Models loaded");

        refreshDevices();
      } catch (err) {
        console.error("Model load error:", err);
        setErrorMsg("Failed to load face models. Check /public/models.");
        setStatus("error");
        pushDebug(`Model load error: ${err?.message || err}`);
      }
    };

    loadModels();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (cameraOn && modelsLoaded) startCamera();
    else stopCamera();

    return () => stopCamera();
  }, [cameraOn, modelsLoaded, selectedDeviceId]);

  const refreshDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      pushDebug(`Found ${cams.length} video device(s)`);

      if (!selectedDeviceId && cams.length > 0) {
        setSelectedDeviceId(cams[0].deviceId);
      }
    } catch (err) {
      pushDebug("enumerateDevices error: " + (err?.message || err));
    }
  };

  const startCamera = async () => {
    try {
      pushDebug("Requesting camera stream...");
      setErrorMsg("");
      setStatus("loading");

      const constraints = selectedDeviceId
        ? { video: { deviceId: { exact: selectedDeviceId } } }
        : { video: { facingMode: "user" } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!stream) {
        pushDebug("getUserMedia returned no stream");
        setErrorMsg("No camera stream available.");
        setStatus("error");
        setCameraOn(false);
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }

      await new Promise((resolve) => {
        const v = videoRef.current;
        if (!v) return resolve();
        let done = false;

        const onLoaded = () => {
          if (done) return;
          done = true;
          v.removeEventListener("loadeddata", onLoaded);
          pushDebug(`Video ready: ${v.videoWidth}x${v.videoHeight}`);
          resolve();
        };

        v.addEventListener("loadeddata", onLoaded);

        setTimeout(() => {
          if (done) return;
          done = true;
          try {
            v.removeEventListener("loadeddata", onLoaded);
          } catch {}
          pushDebug("loadeddata timeout.");
          resolve();
        }, 4000);
      });

      const tracks = stream.getVideoTracks();
      if (!tracks.length) {
        setErrorMsg("No video tracks in stream.");
        setStatus("error");
        setCameraOn(false);
        return;
      }

      pushDebug(`Using device: ${tracks[0].label || tracks[0].deviceId}`);
      setStatus("ready");
      runDetectionLoop();
      refreshDevices();
    } catch (err) {
      const msg = err?.message || String(err);
      setErrorMsg(msg);
      setStatus("error");
      pushDebug("getUserMedia error: " + msg);
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    try {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      setTopExpression(null);
      setAllExpressions(null);
      setStatus(modelsLoaded ? "ready" : "loading");
      pushDebug("Camera stopped");
    } catch (err) {
      pushDebug("stopCamera error: " + (err?.message || err));
    }
  };

  const runDetectionLoop = async () => {
    const loop = async () => {
      try {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.45,
        });

        const results = await faceapi
          .detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceExpressions();

        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (!results || results.length === 0) {
          setTopExpression(null);
          setAllExpressions(null);
          setStatus("no-face");
        } else {
          const resized = faceapi.resizeResults(results, {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          });

          if (canvasRef.current) {
            faceapi.draw.drawDetections(canvasRef.current, resized);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
          }

          const first = results[0];
          const expr = first.expressions || null;
          setAllExpressions(expr);

          if (expr) {
            let best = { name: null, value: -1 };
            Object.entries(expr).forEach(([k, v]) => {
              if (v > best.value) best = { name: k, value: v };
            });
            setTopExpression(best);
            setStatus("ready");
          }
        }
      } catch (err) {
        setErrorMsg("Detection error.");
        setStatus("error");
      } finally {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
  };

  const prettyPercent = (v) => `${Math.round(v * 100)}%`;

  const takeSnapshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `face_snapshot_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-pink-50">
      <h2 className="text-2xl font-bold text-pink-700 mb-2">Facial Therapy Mode </h2>

      <p className="text-sm text-pink-600 mb-4">
        This mode runs locally in your browser and detects facial expressions.
      </p>

      <div className="flex gap-3 items-center mb-4">
        <button
          onClick={() => setCameraOn((p) => !p)}
          className={`px-4 py-2 rounded-lg font-medium ${
            cameraOn
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          {cameraOn ? "Stop Camera" : "Start Camera"}
        </button>

        <button
          onClick={() => {
            stopCamera();
            setCameraOn(false);
            setStatus(modelsLoaded ? "ready" : "loading");
          }}
          className="px-4 py-2 rounded-lg bg-pink-200 text-pink-900 hover:bg-pink-300"
        >
          Clear
        </button>

        <div className="ml-auto text-sm text-pink-600">
          {status === "loading" && "Loading models..."}
          {status === "ready" && "Ready"}
          {status === "no-face" && "No face detected"}
          {status === "error" && "Error"}
        </div>
      </div>

      {/* Device selector */}
      <div className="mb-4 bg-white p-3 rounded shadow border border-pink-200">
        <div className="flex items-center gap-3">
          <label className="text-sm text-pink-700">Camera device:</label>

          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="px-2 py-1 border rounded border-pink-300"
          >
            {devices.length === 0 && <option value="">Default</option>}

            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || d.deviceId}
              </option>
            ))}
          </select>

          <button
            onClick={() => refreshDevices()}
            className="px-2 py-1 bg-pink-100 rounded hover:bg-pink-200 text-pink-700"
          >
            Refresh
          </button>

          <div className="ml-auto text-xs text-pink-600">
            Model status:{" "}
            {modelsLoaded ? (
              <span className="text-pink-700 font-semibold">Loaded</span>
            ) : (
              <span className="text-pink-500">Loading</span>
            )}
          </div>
        </div>

        <div className="mt-3 max-h-28 overflow-auto text-xs text-pink-600 bg-pink-50 p-2 rounded">
          {debug.length === 0 ? (
            <div className="text-pink-400">No debug logs yet</div>
          ) : (
            debug
              .slice()
              .reverse()
              .map((d, i) => <div key={i}>{d}</div>)
          )}
        </div>
      </div>

      {errorMsg && <div className="mb-3 text-sm text-red-500">{errorMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video */}
        <div className="bg-white rounded-lg p-3 shadow border border-pink-200">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full rounded bg-black"
              playsInline
              muted
              autoPlay
            />
            <canvas
              ref={canvasRef}
              className="absolute left-0 top-0 w-full h-full pointer-events-none"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-pink-600">
              Tip: allow camera permission and close other apps using the camera.
            </div>

            <button
              onClick={takeSnapshot}
              className="px-3 py-1 rounded bg-pink-500 text-white text-sm hover:bg-pink-600"
            >
              Snapshot
            </button>
          </div>
        </div>

        {/* Expressions */}
        <div className="bg-white rounded-lg p-4 shadow border border-pink-200">
          <h3 className="text-lg font-semibold text-pink-700 mb-2">Detected Expression</h3>

          {topExpression ? (
            <>
              <div className="text-3xl font-bold text-pink-600 mb-1">
                {topExpression.name.toUpperCase()}
              </div>

              <div className="text-sm text-pink-500 mb-4">
                Confidence: {prettyPercent(topExpression.value)}
              </div>

              <div className="space-y-3">
                {allExpressions &&
                  Object.entries(allExpressions)
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-28 capitalize text-sm text-pink-800">
                          {key}
                        </div>
                        <div className="flex-1 bg-pink-100 h-2 rounded overflow-hidden">
                          <div
                            style={{ width: `${val * 100}%` }}
                            className="h-full bg-pink-500"
                          />
                        </div>
                        <div className="w-10 text-right text-xs text-pink-700">
                          {Math.round(val * 100)}%
                        </div>
                      </div>
                    ))}
              </div>
            </>
          ) : status === "no-face" ? (
            <div className="text-sm text-pink-500">
              No face detected — center your face in the camera.
            </div>
          ) : status === "loading" ? (
            <div className="text-sm text-pink-500">Loading...</div>
          ) : (
            <div className="text-sm text-pink-500">—</div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-pink-500">
        Tip: good lighting improves detection. Runs locally — no uploads.
      </div>
    </div>
  );
};

export default FacialTherapyMode;
