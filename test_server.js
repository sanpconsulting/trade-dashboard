import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

app.post("/test", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      console.log("SERVER API KEY:", apiKey ? `Length: ${apiKey.length}, startsWith: ${apiKey.substring(0, 3)}` : "UNDEFINED");
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: req.body.prompt
      });
      res.json({ synthesis: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
});
app.listen(3001, () => {
    console.log("Running on 3001");
});
