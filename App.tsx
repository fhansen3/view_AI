import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraMode, AppState, DetailedAnalysis } from './types';
import { analyzeImage } from './services/geminiService';

// Icons
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const SwitchCameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 11.03a.75.75 0 01.8.192l.104.123 1.25 1.76a.75.75 0 01-1.226.87l-.92-1.295-.92 1.295a.75.75 0 01-1.226-.87l1.25-1.76a.75.75 0 01.693-.315z" clipRule="evenodd" />
  </svg>
);

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [cameraMode, setCameraMode] = useState<CameraMode>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DetailedAnalysis | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (appState !== AppState.IDLE && appState !== AppState.CAPTURING) return;
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setAppState(AppState.CAPTURING);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setAppState(AppState.ERROR);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraMode, appState]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      setAppState(AppState.ANALYZING);
      
      // Trigger analysis
      handleAnalysis(imageData);
    }
  }, []);

  const handleAnalysis = async (imageData: string) => {
    try {
      const result = await analyzeImage(imageData);
      setAnalysisResult(result);
      setAppState(AppState.RESULTS);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setAppState(AppState.IDLE); // This triggers the useEffect to restart camera
  };

  const toggleCamera = () => {
    setCameraMode(prev => prev === 'user' ? 'environment' : 'user');
    // Briefly go to IDLE to re-trigger the camera effect
    setAppState(AppState.IDLE);
  };

  // ---------------- Render Views ----------------

  if (appState === AppState.ERROR) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 text-center">
        <div className="bg-red-900/30 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
        <p className="text-gray-400 mb-6">No pudimos acceder a la cámara o analizar la imagen.</p>
        <button 
          onClick={resetApp}
          className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (appState === AppState.RESULTS && analysisResult && capturedImage) {
    return (
      <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
        {/* Header Image */}
        <div className="relative h-1/3 w-full shrink-0">
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent"></div>
          <button 
            onClick={resetApp} 
            className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-20 -mt-10 relative z-10 no-scrollbar">
          <div className="flex flex-col gap-1">
            <span className="text-indigo-400 text-sm font-medium uppercase tracking-wider">{analysisResult.category}</span>
            <h1 className="text-4xl font-bold text-white leading-tight">{analysisResult.name}</h1>
            {analysisResult.scientificName && (
              <p className="text-gray-400 italic text-lg font-serif">{analysisResult.scientificName}</p>
            )}
          </div>

          <div className="mt-6 space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <SparklesIcon />
                Descripción
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm text-justify">
                {analysisResult.description}
              </p>
            </section>

            <div className="grid grid-cols-2 gap-3">
              {analysisResult.attributes.map((attr, idx) => (
                <div key={idx} className="bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase font-semibold">{attr.label}</p>
                  <p className="text-white font-medium text-sm mt-1">{attr.value}</p>
                </div>
              ))}
            </div>

            <section className="bg-indigo-950/30 rounded-2xl p-5 border border-indigo-900/50">
              <h3 className="text-lg font-semibold text-indigo-300 mb-3">¿Sabías qué?</h3>
              <ul className="space-y-3">
                {analysisResult.funFacts.map((fact, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-300 text-sm">
                    <span className="text-indigo-500 font-bold">•</span>
                    {fact}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Floating Action Button for New Scan */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button 
            onClick={resetApp}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg shadow-indigo-900/20 hover:bg-gray-100 transition"
          >
            <CameraIcon />
            <span>Escanear otro</span>
          </button>
        </div>
      </div>
    );
  }

  // Camera & Analyzing State
  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`w-full h-full object-cover ${appState === AppState.ANALYZING ? 'blur-sm opacity-50 scale-105 transition duration-1000' : ''}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 safe-area-inset">
        <div className="flex justify-between items-start">
          <div className="bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/10">
            <span className="text-xs font-semibold tracking-wider text-white/90">VisionAI</span>
          </div>
          <button 
            onClick={toggleCamera} 
            disabled={appState === AppState.ANALYZING}
            className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition disabled:opacity-0"
          >
            <SwitchCameraIcon />
          </button>
        </div>

        {/* Scanning Overlay Grid */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`w-64 h-64 border-2 border-white/50 rounded-3xl relative transition-all duration-500 ${appState === AppState.ANALYZING ? 'w-24 h-24 border-indigo-500 animate-pulse' : ''}`}>
              {!appState && <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl-lg"></div>}
              {appState === AppState.ANALYZING ? (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                 </div>
              ) : (
                <>
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white -mt-0.5 -ml-0.5 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white -mt-0.5 -mr-0.5 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white -mb-0.5 -ml-0.5 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white -mb-0.5 -mr-0.5 rounded-br-xl"></div>
                </>
              )}
            </div>
        </div>

        {appState === AppState.ANALYZING ? (
          <div className="text-center mb-10 animate-pulse">
            <h2 className="text-2xl font-bold text-white mb-2">Analizando...</h2>
            <p className="text-indigo-300 text-sm">Identificando objeto y recopilando datos</p>
          </div>
        ) : (
          <div className="flex justify-center mb-8">
            <button 
              onClick={captureImage}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/40 transition active:scale-95"
            >
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
