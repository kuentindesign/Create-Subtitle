import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SubtitleConfig {
  sourceLanguage: string;
  targetLanguage1: string;
  targetLanguage2?: string; // Optional for bilingual
  isBilingual: boolean;
}

export async function generateSubtitles(
  fileData: string, // base64 encoded
  mimeType: string,
  config: SubtitleConfig
): Promise<string> {
  const { sourceLanguage, targetLanguage1, targetLanguage2, isBilingual } = config;

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
1. Output ONLY the SRT content. Do not include any introductory text, markdown formatting (like \`\`\`srt), or explanations.
2. DO NOT include speaker labels like "Speaker A", "[Music]", or "Man:". Just the spoken content.
3. Every time block must be strictly formatted according to SRT standards:
   [Index]
   [Start Time] --> [End Time]
   [Subtitle Text Line 1]
   [Subtitle Text Line 2 (only if bilingual)]

4. Ensure accurate timing sync with the audio.
5. If the source language is different from the target language, perform high-quality translation while maintaining the flow and timing.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
