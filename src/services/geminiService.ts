import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
      throw new Error("Gemini API key is missing or invalid. Please ensure GEMINI_API_KEY is configured in your project settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface SubtitleConfig {
  sourceLanguage: string;
  targetLanguage1: string;
  targetLanguage2?: string; // Optional for bilingual
  isBilingual: boolean;
}

export async function generateTranscript(
  fileData: string, // base64 encoded
  mimeType: string,
  targetLang: string
): Promise<string> {
  const ai = getAi();

  let prompt = `Transcribe the following audio into high-quality text in ${targetLang}.`;

  prompt += `
CRITICAL RULES:
1. MULTI-SPEAKER IDENTIFICATION: Identify different speakers using SHORT labels (e.g., A, B, C or M, F if gender is clear). Use consistent labels.
2. DIALOGUE FORMAT: Format the output as a clear dialogue (e.g., "A: Hello. \nB: Hi there.").
3. PURE TEXT ONLY: Do NOT include any timestamps.
4. EXHAUSTIVE: Transcribe every spoken word.
5. NO MARKDOWN: Output only raw text.
`;

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: {
      parts: [
        {
          inlineData: {
            data: fileData,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  return response.text || "";
}

export async function generateSubtitles(
  fileData: string, // base64 encoded
  mimeType: string,
  config: SubtitleConfig
): Promise<string> {
  const { sourceLanguage, targetLanguage1, targetLanguage2, isBilingual } = config;
  const ai = getAi();

  let prompt = `Transcribe the following audio/video into SRT (SubRip) format.
Source Language: ${sourceLanguage || "Auto-detect"}
Primary Subtitle Language: ${targetLanguage1}
`;

  if (isBilingual && targetLanguage2) {
    prompt += `Secondary Subtitle Language: ${targetLanguage2}
Requirement: Provide BILINGUAL subtitles. For EVERY time block, you MUST provide text in both languages.
Format for each block:
[Index]
[Start Time] --> [End Time]
${targetLanguage1} text
${targetLanguage2} text

DO NOT combine them into one line. Put ${targetLanguage1} on the first line and ${targetLanguage2} on the second line.
`;
  } else {
    prompt += `Requirement: Provide subtitles ONLY in ${targetLanguage1}.
`;
  }

  prompt += `
CRITICAL RULES:
1. DIALOGUE MARKING: If multiple people are speaking, use SHORT distinct indicators (like "A: ", "B: ", or "M: ", "F: " if gender is clear) to show it is a dialogue. Avoid long labels.
2. EXHAUSTIVE TRANSCRIPTION: Transcribe EVERY SINGLE SPOKEN WORD.
3. TEMPORAL CONSISTENCY: Maintain absolute timestamp accuracy. Ensure no "drift" occurs towards the end of the file.
4. CONTINUOUS COVERAGE: Subtitles must cover the entire audio timeline.
5. Output Format: Output ONLY raw SRT content. No markdown.
6. PRECISION TIMING: 
   - [Start Time] MUST be the exact millisecond speech begins.
   - [End Time] MUST be the exact millisecond speech ends.
   - DO NOT cut off subtitles while the speaker is still finishing.
7. QUALITY: If translating, ensure tone matches context.
`;

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: {
      parts: [
        {
          inlineData: {
            data: fileData,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
  });

  return response.text || "";
}
