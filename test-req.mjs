import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Who won the IPL in 2024?" }] }],
      tools: [{ googleSearch: {} }]
    });
    console.log(result.response.text());
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
