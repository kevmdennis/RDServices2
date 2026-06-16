import OpenAI from "openai";

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  return new OpenAI({ apiKey });
}
