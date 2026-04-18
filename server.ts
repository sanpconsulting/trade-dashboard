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
  app.get("/api/models", async (req, res) => {
    try {
      const customUrl = req.query.ollamaUrl as string;
      let llmUrl = customUrl || process.env.LLM_API_URL || 'http://host.docker.internal:11434/api/generate';
      // Normalize base URL
      const baseUrl = llmUrl.replace('/api/generate', '').replace('/api/tags', '');
      
      let response;
      let usedUrl = '';

      const fallbackUrls = customUrl 
        ? [`${baseUrl}/api/tags`]
        : [
          `${baseUrl}/api/tags`,
          'http://172.17.0.1:11434/api/tags',
          'http://172.18.0.1:11434/api/tags',
          'http://localhost:11434/api/tags'
        ];

      for (const url of fallbackUrls) {
        try {
          usedUrl = url;
          response = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (response.ok) break;
        } catch (e: any) {
          console.warn(`[Network Retry] Failed to get models at ${url}:`, e.message);
          response = null;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Impossible de lister les modèles Ollama sur ${usedUrl}.`);
      }

      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [process.env.LLM_MODEL_NAME || 'llama3'];
      res.json({ models, __debug: { source_url: usedUrl } });
    } catch (error: any) {
      console.error('LLM Proxy Error (Models):', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, selectedModel, ollamaUrl: customUrl } = req.body;
      const model = selectedModel || process.env.LLM_MODEL_NAME || 'llama3';
      
      // Default URL if passed in ENV or via UI
      let llmUrl = customUrl || process.env.LLM_API_URL || 'http://host.docker.internal:11434/api/generate';
      const baseUrl = llmUrl.replace('/api/generate', '').replace('/api/tags', '');
      const generationUrl = `${baseUrl}/api/generate`;

      let response;
      let usedUrl = generationUrl;

      const fallbackUrls = customUrl 
        ? [generationUrl]
        : [
            generationUrl,
            'http://172.17.0.1:11434/api/generate',
            'http://172.18.0.1:11434/api/generate',
            'http://localhost:11434/api/generate'
          ];

      for (const url of fallbackUrls) {
        try {
          console.log(`[LLM Proxy] Testing connection to ${url} with model ${model}...`);
          usedUrl = url;
          response = await fetch(url, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               model: model,
               prompt: prompt,
               stream: false 
             }),
             // 180s timeout - models can take time to load into VRAM or generate long responses
             signal: AbortSignal.timeout(180000) 
          });
          
          if (response.ok) {
             console.log(`[LLM Proxy] Success using ${url}`);
             break; 
          } else {
             const errorTxt = await response.text();
             console.warn(`[Network Retry] Ollama error on ${url}: ${response.status} ${errorTxt}`);
          }
        } catch (e: any) {
          const isTimeout = e.name === 'TimeoutError' || e.name === 'AbortError';
          console.warn(`[Network Retry] Failed to connect to Ollama at ${url}:`, isTimeout ? 'TIMEOUT (180s)' : e.message);
          response = null;
        }
      }

      if (!response) {
        throw new Error(`Impossible de contacter Ollama sur les adresses réseaux. Veuillez vérifier que le service est démarré.`);
      }

      if (!response.ok) {
        const errorTxt = await response.text();
        let detail;
        try {
          const jsonErr = JSON.parse(errorTxt);
          detail = jsonErr.error || errorTxt;
        } catch(e) {
          detail = errorTxt;
        }
        throw new Error(`Ollama (HTTP ${response.status}) : ${detail}`);
      }

      const data = await response.json();
      
      // Robust payload parsing for Ollama (/api/generate) vs OpenAI compat (/v1/completions)
      const text = data.response || data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "No response received from model.";
      
      res.json({ text, __debug: { source_url: usedUrl } });
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
