import React, { useState, useEffect, useRef } from "react";
import { generateSubtitles, SubtitleConfig } from "./services/geminiService";
import { 
  Upload, 
  Download, 
  Loader2, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  History,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "ja", name: "Japanese" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "it", name: "Italian" },
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang1, setTargetLang1] = useState("en");
  const [targetLang2, setTargetLang2] = useState("zh");
  const [isBilingual, setIsBilingual] = useState(true);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [srtResult, setSrtResult] = useState("");
  const [progress, setProgress] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus("idle");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const toBase64 = (file: Blob): Promise<string> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = error => reject(error);
    });

  const generate = async () => {
    setStatus("processing");
    setProgress("Initializing...");
    setSrtResult("");
    
    try {
      let base64Data = "";
      let mimeType = "";

      if (file) {
        setProgress("Reading file...");
        base64Data = await toBase64(file);
        mimeType = file.type;
      } else {
        throw new Error("Please provide a file");
      }

      setProgress("AI generating subtitles (Gemini)...");
      const config: SubtitleConfig = {
        sourceLanguage: sourceLang,
        targetLanguage1: targetLang1,
        targetLanguage2: isBilingual ? targetLang2 : undefined,
        isBilingual,
      };

      const result = await generateSubtitles(base64Data, mimeType, config);
      
      // Sanitize result to strip markdown code blocks if present
      const sanitized = result.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
      
      setSrtResult(sanitized);
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred");
      setStatus("error");
    }
  };

  const downloadSrt = () => {
    const blob = new Blob([srtResult], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subtitles_${new Date().getTime()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black flex flex-col selection:bg-moma-blue selection:text-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-end gap-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-moma-blue leading-none">
            CREATE<br />SUBTITLE
          </h1>
          <div className="hidden md:block border-l-2 border-moma-blue pl-6 py-0.5 ml-14">
            <p className="text-[7px] font-black uppercase tracking-[0.3em] text-moma-blue mb-0.5">Generative Intelligence</p>
            <p className="text-xs font-medium text-black leading-tight tracking-tight">
              High-precision transcription service.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-12 space-y-12">
        
        {/* Step 01 & 02 Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-x-20 items-stretch relative">
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gray-100 -translate-x-1/2" />
          
          {/* Step 01: Input Selection */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <span className="w-2 h-2 bg-moma-blue" /> 01 / Input
            </h2>
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative flex-1 group border-4 border-black p-10 flex items-center justify-center transition-all cursor-pointer overflow-hidden ${isDragging ? "bg-moma-blue" : "hover:bg-moma-blue"}`}
            >
              <div className={`absolute inset-0 bg-black transition-transform duration-300 ${isDragging ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`} />
              <input
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className="relative z-10 flex items-center gap-6">
                {file ? (
                  <>
                    <CheckCircle2 size={24} className={`${isDragging ? "text-white" : "text-moma-blue"} group-hover:text-white shrink-0`} />
                    <div className="min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isDragging ? "text-white" : "text-moma-blue"} group-hover:text-white mb-0.5`}>Selected</p>
                      <p className={`text-lg font-black uppercase tracking-tighter truncate ${isDragging ? "text-white" : "text-black"} group-hover:text-white`}>{file.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={24} className={`${isDragging ? "text-white" : "text-black"} group-hover:text-white shrink-0`} />
                    <p className={`text-base font-black uppercase tracking-[0.2em] ${isDragging ? "text-white" : "text-black"} group-hover:text-white`}>
                      {isDragging ? "Release to Drop" : "Drop Media Source"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Step 02: Configuration */}
          <section className="space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <span className="w-2 h-2 bg-moma-blue" /> 02 / Config
            </h2>
            
            <div className="space-y-8">
              <div className="border-b-2 border-black pb-3 relative">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] block mb-2 text-moma-blue">Source Detection</label>
                <div className="relative">
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full h-12 bg-transparent text-lg font-bold focus:outline-none appearance-none cursor-pointer pr-10"
                  >
                    <option value="auto">Auto-detect Language</option>
                    {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-black" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 border-b-2 border-black pb-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-moma-blue">Primary Target</label>
                  <div className="relative">
                    <select
                      value={targetLang1}
                      onChange={(e) => setTargetLang1(e.target.value)}
                      className="w-full h-12 bg-transparent text-lg font-bold focus:outline-none appearance-none cursor-pointer pr-10"
                    >
                      {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-black" size={20} />
                  </div>
                </div>
                <div className="space-y-2 border-b-2 border-black pb-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-moma-blue">Bilingual Mode</label>
                    <button 
                      onClick={() => setIsBilingual(!isBilingual)}
                      className={`text-[9px] px-2 py-1 font-black uppercase tracking-widest border-2 transition-all ${
                        isBilingual ? "bg-black text-white border-black" : "bg-transparent text-gray-300 border-gray-200"
                      }`}
                    >
                      {isBilingual ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={targetLang2}
                      disabled={!isBilingual}
                      onChange={(e) => setTargetLang2(e.target.value)}
                      className={`w-full h-12 bg-transparent text-lg font-bold focus:outline-none appearance-none cursor-pointer pr-10 ${!isBilingual ? "opacity-10 cursor-not-allowed" : ""}`}
                    >
                      {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                    </select>
                    <ChevronDown className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-black ${!isBilingual ? "opacity-10" : ""}`} size={20} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <button
          disabled={status === "processing" || !file}
          onClick={generate}
          className="group relative w-full bg-moma-blue text-white font-black h-16 text-lg tracking-[0.2em] uppercase transition-all hover:bg-black active:scale-[0.98] disabled:bg-moma-blue/40 disabled:text-white/60 overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {status === "processing" ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {progress}
              </>
            ) : (
              "Generate Subtitles"
            )}
          </span>
        </button>

        {/* Step 03: Result Output (Only shown when active) */}
        <AnimatePresence>
          {status !== "idle" && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border-t-8 border-black pt-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                  <span className="w-2 h-2 bg-moma-blue" /> 03 / Output
                </h2>
                {status === "success" && (
                  <button
                    onClick={downloadSrt}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-moma-blue hover:text-black transition-colors"
                  >
                    <Download size={14} />
                    Export.srt
                  </button>
                )}
              </div>

              <div className="border-4 border-black relative bg-[#F9F9F9] overflow-hidden min-h-[400px]">
                <AnimatePresence mode="wait">
                  {status === "success" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 overflow-auto p-8 font-mono text-[11px] leading-relaxed"
                    >
                      <pre className="whitespace-pre-wrap selection:bg-moma-blue selection:text-white">{srtResult}</pre>
                    </motion.div>
                  ) : status === "processing" ? (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                    >
                      <div className="w-12 h-12 border-4 border-black border-t-moma-blue animate-spin" />
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-moma-blue animate-pulse">{progress}</p>
                    </motion.div>
                  ) : status === "error" ? (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                    >
                      <AlertCircle size={32} className="text-red-600 mb-3" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-1">Error</h3>
                      <p className="text-[10px] text-gray-400 mb-4 max-w-[200px] mx-auto">{errorMsg}</p>
                      <button onClick={() => setStatus("idle")} className="text-[8px] font-black uppercase tracking-[0.3em] border-2 border-black px-3 py-1.5 hover:bg-black hover:text-white transition-all">Retry</button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between shrink-0 pt-2 opacity-50">
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[6px] font-black uppercase tracking-widest text-gray-400">Processor</span>
                    <span className="text-[8px] font-black">CORTEX GEN-2</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[6px] font-black uppercase tracking-widest text-gray-400">Environment</span>
                    <span className="text-[8px] font-black">LIVE</span>
                  </div>
                </div>
                <div className="h-3 w-3 bg-moma-blue animate-pulse" />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-8 md:p-16 bg-black text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tighter">CREATE SUBTITLE</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">System Release v4.2.0 / Modernist Edition</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} ARCHIVE EDITION</p>
            <p className="text-[10px] font-bold italic text-moma-blue">Curated & Developed by Yang Charlotte</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
