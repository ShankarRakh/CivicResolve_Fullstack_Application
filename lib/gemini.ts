import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

/**
 * Generate an embedding using Gemini text-embedding-004
 * @param text The text to embed
 * @param isQuery True if checking for duplicates, false if saving a new document
 * @returns Array of 768 floats
 */
export async function generateEmbedding(text: string, isQuery: boolean = false): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent({
      content: { role: "user", parts: [{ text }] },
      taskType: isQuery ? TaskType.RETRIEVAL_QUERY : TaskType.RETRIEVAL_DOCUMENT,
      outputDimensionality: 768,
    } as any);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}
