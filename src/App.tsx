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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
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
      <header className="p-8 md:p-16 border-b-2 border-black">
        <div className="max-w-7xl">
          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-moma-blue leading-[0.8] mb-8">
            CREATE<br />SUBTITLE
          </h1>
          <div className="max-w-xl border-l-4 border-moma-blue pl-8 py-2 ml-5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-moma-blue mb-4">Generative Audio Intelligence</p>
            <p className="text-xl font-medium text-black leading-snug tracking-tight">
              High-precision bilingual transcription. Minimalist architecture powered by advanced artificial intelligence.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-8 md:p-16 space-y-24">
        
        {/* Step 01: Input Selection */}
        <section className="space-y-12">
          <div className="border-t-8 border-black pt-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-moma-blue" /> Step 01 / Input
            </h2>
            <div className="relative group border-4 border-black p-12 md:p-20 hover:bg-moma-blue transition-all cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <input
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="relative z-10 flex flex-col items-start">
                {file ? (
                  <div className="flex items-center gap-6">
                    <CheckCircle2 size={40} className="text-moma-blue group-hover:text-white" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-moma-blue group-hover:text-white mb-1">File Selected</p>
                      <p className="text-xl font-black uppercase tracking-tighter truncate max-w-lg text-black group-hover:text-white">{file.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    <Upload size={40} className="text-black group-hover:text-white" />
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-black group-hover:text-white">Click or Drop Media Source</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Step 02: Configuration */}
        <section className="border-t-8 border-black pt-6 space-y-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
            <span className="w-2 h-2 bg-moma-blue" /> Step 02 / Config
          </h2>
          
          <div className="space-y-12">
            <div className="border-b-4 border-black pb-8 max-w-lg relative group">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] block mb-4 text-moma-blue">Source Detection</label>
              <div className="relative">
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full h-12 bg-transparent text-xl font-bold focus:outline-none appearance-none cursor-pointer pr-10"
                >
                  <option value="auto">Auto-detect Language</option>
                  {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-black" size={20} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
              <div className="space-y-4 border-b-4 border-black pb-4 relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-moma-blue">Primary Target</label>
                <div className="relative">
                  <select
                    value={targetLang1}
                    onChange={(e) => setTargetLang1(e.target.value)}
                    className="w-full h-12 bg-transparent text-xl font-bold focus:outline-none appearance-none cursor-pointer pr-10"
                  >
                    {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-black" size={20} />
                </div>
              </div>
              <div className="space-y-4 border-b-4 border-black pb-4 relative group">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-moma-blue">Secondary Target</label>
                  <button 
                    onClick={() => setIsBilingual(!isBilingual)}
                    className={`text-[8px] px-3 py-1 font-black uppercase tracking-widest border-2 transition-all ${
                      isBilingual ? "bg-black text-white border-black" : "bg-transparent text-gray-300 border-gray-200"
                    }`}
                  >
                    {isBilingual ? "Active" : "Off"}
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={targetLang2}
                    disabled={!isBilingual}
                    onChange={(e) => setTargetLang2(e.target.value)}
                    className={`w-full h-12 bg-transparent text-xl font-bold focus:outline-none appearance-none cursor-pointer pr-10 ${!isBilingual ? "opacity-10 cursor-not-allowed" : ""}`}
                  >
                    {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                  </select>
                  <ChevronDown className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-black ${!isBilingual ? "opacity-10" : ""}`} size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              disabled={status === "processing" || !file}
              onClick={generate}
              className="group relative w-full bg-moma-blue text-white font-black h-24 text-2xl tracking-tighter uppercase transition-all hover:opacity-90 disabled:bg-moma-blue/30 disabled:text-white/50 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-6">
                {status === "processing" ? (
                  <>
                    <Loader2 className="animate-spin" size={32} />
                    {progress}
                  </>
                ) : (
                  "Generate Subtitles"
                )}
              </span>
            </button>
          </div>
        </section>

        {/* Step 03: Result Output */}
        <section className="border-t-8 border-black pt-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <span className="w-2 h-2 bg-moma-blue" /> Step 03 / Output
            </h2>
            {status === "success" && (
              <button
                onClick={downloadSrt}
                className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-moma-blue hover:text-black transition-colors"
              >
                <Download size={20} />
                Export.srt
              </button>
            )}
          </div>

          <div className="min-h-[600px] border-4 border-black relative bg-[#F9F9F9] overflow-hidden group">
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 overflow-auto p-12 font-mono text-base leading-relaxed"
                >
                  <pre className="whitespace-pre-wrap selection:bg-moma-blue selection:text-white">{srtResult}</pre>
                </motion.div>
              ) : status === "processing" ? (
                <motion.div 
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center space-y-12"
                >
                  <div className="w-32 h-32 border-8 border-black border-t-moma-blue animate-spin" />
                  <p className="text-xl font-black uppercase tracking-[0.6em] text-moma-blue animate-pulse">{progress}</p>
                </motion.div>
              ) : status === "error" ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center"
                >
                  <AlertCircle size={80} className="text-red-600 mb-8" />
                  <h3 className="text-2xl font-black uppercase tracking-[0.3em] mb-4">Error / Failure</h3>
                  <p className="text-md leading-relaxed text-gray-400 mb-12 max-w-sm mx-auto">{errorMsg}</p>
                  <button onClick={() => setStatus("idle")} className="text-[13px] font-black uppercase tracking-[0.5em] border-4 border-black px-10 py-5 hover:bg-black hover:text-white transition-all">Clear Terminal</button>
                </motion.div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200 p-16 text-center">
                  <FileText size={120} className="mb-8 opacity-10" />
                  <p className="text-[12px] font-black uppercase tracking-[1em] mb-4">Terminal Standby</p>
                  <p className="text-[10px] font-bold opacity-30 tracking-[0.5em]">SYSTEM STATUS: AWAITING INPUT SEQUENCE</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-between border-b-2 border-black pb-6">
            <div className="flex items-center gap-12">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Processor</span>
                <span className="text-[11px] font-black text-black">CORTEX GEN-2</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Environment</span>
                <span className="text-[11px] font-black text-black">PRODUCTION-READY</span>
              </div>
            </div>
            <div className="h-6 w-6 bg-moma-blue animate-pulse" />
          </div>
        </section>
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
