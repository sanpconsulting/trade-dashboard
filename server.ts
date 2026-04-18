import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json());

  // Market Data Proxy to Yahoo Finance to bypass CORS and get real stocks/forex/crypto
  app.get("/api/yahoo", async (req, res) => {
    try {
      const symbol = req.query.symbol || 'BTC-USD';
      const interval = req.query.interval || '15m';
      const range = req.query.range || '2d';
      
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });
      if (!response.ok) throw new Error(`Yahoo API error: ${response.statusText}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // News Data Proxy using Yahoo Finance RSS
  app.get("/api/news", async (req, res) => {
    try {
      const symbol = req.query.symbol || 'BTC-USD';
      // Some forex/crypto symbols might need formatting for Yahoo RSS, but basic ones work
      const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/xml"
        }
      });
      if (!response.ok) throw new Error(`Yahoo News API error: ${response.statusText}`);
      const data = await response.text();
      res.send(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Local AI (LLaMA) Proxy
  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt } = req.body;
      // Default to host.docker.internal for local Ollama outside container
      const llmUrl = process.env.LLM_API_URL || 'http://host.docker.internal:11434/api/generate';
      const model = process.env.LLM_MODEL_NAME || 'llama3';

      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false // Request full response directly, avoid SSE parsing for simplicity in UI
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      // Robust payload parsing for Ollama (/api/generate) vs OpenAI compat (/v1/completions)
      const text = data.response || data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "No response received from model.";
      
      res.json({ text });
    } catch (error: any) {
      console.error('LLM Proxy Error:', error);
      // Extraire la vraie cause (ex: EAI_AGAIN, ECONNREFUSED) pour le front-end
      const errorDetail = error.cause ? `${error.message} (${error.cause.message})` : error.message;
      res.status(500).json({ error: errorDetail });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
