import { GoogleGenAI, Content, Part } from "@google/genai";
import { ContextItem, GenerationConfig } from "../types";

// Initialize the client outside the function to avoid recreation, 
// but ensure we pull the key from env every time we might need to check it (though ideally fixed).
// Note: In a real app, we'd handle key rotation or user input if needed.
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamGeminiResponse = async (
  prompt: string,
  contextItems: ContextItem[],
  config: GenerationConfig,
  onChunk: (text: string) => void
): Promise<string> => {
  const ai = getClient();
  
  // 1. Construct the system instruction based on "RAG" context
  let systemInstructionText = `You are Arch.io, a senior software architect mentor. 
  Your goal is to help software engineers learn complex concepts, design systems, and debug code.
  - Be technical, precise, and concise.
  - Use analogies for abstract concepts.
  - Format your response in Markdown.
  - Use code blocks for all code examples.`;

  // Filter active context items for the "RAG" simulation
  const activeContext = contextItems.filter(item => item.isActive);
  
  if (config.useContext && activeContext.length > 0) {
    systemInstructionText += `\n\n=== RELEVANT CONTEXT ===\nUse the following provided context to answer the user's query. If the answer is not in the context, use your general knowledge but mention that the provided context didn't contain the specific details.\n\n`;
    
    activeContext.forEach((item, index) => {
      systemInstructionText += `--- Source ${index + 1}: ${item.title} ---\n${item.content}\n\n`;
    });
  }

  try {
    const modelId = config.thinkingBudget > 0 ? "gemini-2.5-flash" : "gemini-2.5-flash"; 
    // Note: Thinking budget is available on 2.5 Flash.

    const generationConfig: any = {
       systemInstruction: systemInstructionText,
    };

    if (config.thinkingBudget > 0) {
      generationConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
    }

    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: generationConfig
    });

    let fullText = "";

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
