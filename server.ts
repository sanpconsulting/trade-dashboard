import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'dev-trading-secret-key';
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin123';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Security Headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // 2. Rate Limiting (Prevent brute force)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Trop de tentatives. Réessayez plus tard." }
  });

  app.use(express.json());

  // 3. Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Authentification requise" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Session invalide" });
      req.user = user;
      next();
    });
  };

  // 4. Auth Endpoints
  app.post("/api/login", loginLimiter, (req, res) => {
    const { password } = req.body;
    if (password === APP_PASSWORD) {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token });
    }
    res.status(401).json({ error: "Mot de passe incorrect" });
  });

  app.get("/api/auth/check", authenticateToken, (req, res) => {
    res.json({ status: "ok" });
  });

  // --- OANDA PROXIES ---

  // Account Summary (Balance, P/L, Margin)
  app.get("/api/oanda/account", authenticateToken, async (req, res) => {
    try {
      const clientKey = req.headers['x-broker-api-key'] as string;
      const clientAccount = req.headers['x-broker-account-id'] as string;
      const apiKey = clientKey || process.env.BROKER_API_KEY;
      const accountId = clientAccount || process.env.BROKER_ACCOUNT_ID;
      const environment = process.env.BROKER_ENVIRONMENT || 'practice';

      if (!apiKey || !accountId) return res.status(401).json({ error: "Missing OANDA credentials" });

      const baseUrl = environment === 'live' ? 'https://api-fxtrade.oanda.com' : 'https://api-fxpractice.oanda.com';
      const response = await fetch(`${baseUrl}/v3/accounts/${accountId}/summary`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Open Trades (Positions)
  app.get("/api/oanda/trades", authenticateToken, async (req, res) => {
    try {
      const clientKey = req.headers['x-broker-api-key'] as string;
      const clientAccount = req.headers['x-broker-account-id'] as string;
      const apiKey = clientKey || process.env.BROKER_API_KEY;
      const accountId = clientAccount || process.env.BROKER_ACCOUNT_ID;
      const environment = process.env.BROKER_ENVIRONMENT || 'practice';

      if (!apiKey || !accountId) return res.status(401).json({ error: "Missing OANDA credentials" });

      const baseUrl = environment === 'live' ? 'https://api-fxtrade.oanda.com' : 'https://api-fxpractice.oanda.com';
      const response = await fetch(`${baseUrl}/v3/accounts/${accountId}/openTrades`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pending Orders
  app.get("/api/oanda/orders", authenticateToken, async (req, res) => {
    try {
      const clientKey = req.headers['x-broker-api-key'] as string;
      const clientAccount = req.headers['x-broker-account-id'] as string;
      const apiKey = clientKey || process.env.BROKER_API_KEY;
      const accountId = clientAccount || process.env.BROKER_ACCOUNT_ID;
      const environment = process.env.BROKER_ENVIRONMENT || 'practice';

      if (!apiKey || !accountId) return res.status(401).json({ error: "Missing OANDA credentials" });

      const baseUrl = environment === 'live' ? 'https://api-fxtrade.oanda.com' : 'https://api-fxpractice.oanda.com';
      const response = await fetch(`${baseUrl}/v3/accounts/${accountId}/pendingOrders`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction History (Executed/Closed)
  app.get("/api/oanda/transactions", authenticateToken, async (req, res) => {
    try {
      const clientKey = req.headers['x-broker-api-key'] as string;
      const clientAccount = req.headers['x-broker-account-id'] as string;
      const apiKey = clientKey || process.env.BROKER_API_KEY;
      const accountId = clientAccount || process.env.BROKER_ACCOUNT_ID;
      const environment = process.env.BROKER_ENVIRONMENT || 'practice';

      if (!apiKey || !accountId) return res.status(401).json({ error: "Missing OANDA credentials" });

      const baseUrl = environment === 'live' ? 'https://api-fxtrade.oanda.com' : 'https://api-fxpractice.oanda.com';
      // Fetch last 50 transactions for history
      const response = await fetch(`${baseUrl}/v3/accounts/${accountId}/transactions?pageSize=50`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // In-memory cache to prevent 429s from Yahoo
  const marketCache = new Map<string, { data: any, timestamp: number }>();
  const newsCache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_TTL = 60000; // 60 seconds

  // Market Data Proxy to Yahoo Finance
  app.get("/api/yahoo", authenticateToken, async (req, res) => {
    try {
      const symbol = req.query.symbol as string || 'BTC-USD';
      const interval = req.query.interval || '15m';
      const range = req.query.range || '2d';
      const cacheKey = `${symbol}-${interval}-${range}`;

      // Return cached data if valid
      const cached = marketCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log(`[Yahoo Proxy] Serving from cache: ${symbol}`);
        return res.json(cached.data);
      }
      
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      ];
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

      // Try query1 first as it's often more stable than query2 in restricted environments
      const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
      let lastError = null;

      for (const host of hosts) {
        try {
          const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
          console.log(`[Yahoo Proxy] Fetching ${host}: ${symbol}`);
          
          const response = await fetch(url, {
            headers: {
              "User-Agent": randomUA,
              "Accept": "application/json",
              "Cache-Control": "no-cache"
            },
            signal: AbortSignal.timeout(8000)
          });
          
          if (response.ok) {
            const data = await response.json();
            marketCache.set(cacheKey, { data, timestamp: Date.now() });
            return res.json(data);
          }

          const text = await response.text();
          lastError = { status: response.status, text };
          if (response.status !== 429) break; // If not 429, don't necessarily retry other host
        } catch (e: any) {
          lastError = { status: 500, text: e.message };
        }
      }
      
      // If we got here, all attempts failed
      if (lastError?.status === 429) {
        console.error(`[Yahoo Proxy] Rate limit (429) hit for ${symbol}`);
        // If we have any old cache, return it even if expired to prevent UI break
        if (cached) return res.json(cached.data);
      }
      
      res.status(lastError?.status || 500).json({ 
        error: `Yahoo API Error: ${lastError?.status}`, 
        detail: lastError?.text 
      });
    } catch (error: any) {
      console.error('[Yahoo Proxy Exception]:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // News Data Proxy using Yahoo Finance RSS
  app.get("/api/news", authenticateToken, async (req, res) => {
    try {
      const symbol = req.query.symbol as string || 'BTC-USD';
      const cacheKey = `news-${symbol}`;

      const cached = newsCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < (CACHE_TTL * 5))) { // News lasts longer (5 mins)
        return res.send(cached.data);
      }

      const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/xml"
        },
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        if (cached) return res.send(cached.data); // Return stale news on error
        return res.status(response.status).json({ error: "Yahoo News API error" });
      }

      const data = await response.text();
      newsCache.set(cacheKey, { data, timestamp: Date.now() });
      res.send(data);
    } catch (error: any) {
      if (newsCache.has(`news-${req.query.symbol}`)) {
        return res.send(newsCache.get(`news-${req.query.symbol}`)!.data);
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Local AI (LLaMA) Proxy
  app.get("/api/models", authenticateToken, async (req, res) => {
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
          // Suppress verbose logging for background polling on expected unreachable host
          response = null;
        }
      }

      if (!response || !response.ok) {
        // Return a default response instead of throwing 500 to keep the UI clean
        // especially when the user has chosen the local QuantEngine alternative.
        return res.json({ 
          models: ['QuantEngine_V2_Local'], 
          status: 'offline',
          notice: 'Ollama not detected. Using local quant logic.' 
        });
      }

      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [process.env.LLM_MODEL_NAME || 'llama3'];
      res.json({ models, __debug: { source_url: usedUrl } });
    } catch (error: any) {
      console.error('LLM Proxy Error (Models):', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai", authenticateToken, async (req, res) => {
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

  // Broker API Connection Test (OANDA focus)
  app.post("/api/broker/test", authenticateToken, async (req, res) => {
    try {
      const { apiKey, accountId, environment } = req.body;
      
      if (!apiKey || !accountId) {
        return res.status(400).json({ error: "API Key et Account ID sont requis pour le test." });
      }

      const baseUrl = environment === 'live' 
        ? 'https://api-fxtrade.oanda.com' 
        : 'https://api-fxpractice.oanda.com';

      // Test by fetching account summary
      const response = await fetch(`${baseUrl}/v3/accounts/${accountId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.errorMessage || "Échec de la connexion : Identifiants invalides.");
      }

      res.json({
        status: 'success',
        message: 'Connexion établie avec succès !',
        account: {
          alias: result.account?.alias || accountId,
          balance: result.account?.balance,
          currency: result.account?.currency
        }
      });

    } catch (error: any) {
      console.error('Broker Test Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Available Instruments from OANDA
  app.get("/api/broker/instruments", authenticateToken, async (req, res) => {
    try {
      const clientKey = req.headers['x-broker-api-key'] as string;
      const clientAccount = req.headers['x-broker-account-id'] as string;

      const apiKey = clientKey || process.env.BROKER_API_KEY;
      const accountId = clientAccount || process.env.BROKER_ACCOUNT_ID;
      const environment = process.env.BROKER_ENVIRONMENT || 'practice';

      // Fallback if no credentials - return some default OANDA format symbols
      if (!apiKey || !accountId) {
        return res.json({
          instruments: [
            { name: "EUR_USD", type: "CURRENCY", displayName: "EUR/USD" },
            { name: "GBP_USD", type: "CURRENCY", displayName: "GBP/USD" },
            { name: "USD_JPY", type: "CURRENCY", displayName: "USD/JPY" },
            { name: "USD_CAD", type: "CURRENCY", displayName: "USD/CAD" },
            { name: "XAU_USD", type: "METAL", displayName: "Gold" },
            { name: "XAG_USD", type: "METAL", displayName: "Silver" },
            { name: "NAS100_USD", type: "CFD", displayName: "Nasdaq 100" },
            { name: "US30_USD", type: "CFD", displayName: "Dow Jones 30" },
            { name: "SPX500_USD", type: "CFD", displayName: "S&P 500" },
            { name: "BCO_USD", type: "CFD", displayName: "Crude Oil (Brent)" },
            { name: "BTC_USD", type: "CRYPTO", displayName: "Bitcoin" },
            { name: "ETH_USD", type: "CRYPTO", displayName: "Ethereum" }
          ]
        });
      }

      const baseUrl = environment === 'live' 
        ? 'https://api-fxtrade.oanda.com' 
        : 'https://api-fxpractice.oanda.com';

      const response = await fetch(`${baseUrl}/v3/accounts/${accountId}/instruments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        // If fail, return fallback instead of erroring out UI
        return res.json({
          instruments: [
            { name: "EUR_USD", type: "CURRENCY", displayName: "EUR/USD" },
            { name: "GBP_USD", type: "CURRENCY", displayName: "GBP/USD" },
            { name: "XAU_USD", type: "METAL", displayName: "Gold" },
            { name: "NAS100_USD", type: "CFD", displayName: "Nasdaq 100" }
          ]
        });
      }

      res.json({
        instruments: result.instruments.map((inst: any) => ({
          name: inst.name,
          type: inst.type,
          displayName: inst.displayName
        }))
      });

    } catch (error: any) {
      console.error('Broker Instruments Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // OANDA Market Data Proxy (Candles)
  app.get("/api/oanda/candles", authenticateToken, async (req, res) => {
    try {
      let { symbol, granularity, count } = req.query;
      
      // Get credentials from headers (UI) or fallback to server ENV
      const clientKey = req.headers['x-broker-api-key'] as string;
      const clientAccount = req.headers['x-broker-account-id'] as string;

      const apiKey = clientKey || process.env.BROKER_API_KEY;
      const accountId = clientAccount || process.env.BROKER_ACCOUNT_ID;
      const environment = process.env.BROKER_ENVIRONMENT || 'practice';

      if (!apiKey) {
        return res.status(401).json({ error: "OANDA API Key non configurée." });
      }

      // Sanitize symbol: OANDA expects "EUR_USD", not "EUR-USD" or "EURUSD=X"
      let instrument = (symbol as string) || 'EUR_USD';
      instrument = instrument.replace('-', '_');
      if (!instrument.includes('_') && instrument.length === 6) {
        // Handle common cases like EURUSD -> EUR_USD
        instrument = `${instrument.substring(0, 3)}_${instrument.substring(3)}`;
      }

      const baseUrl = environment === 'live' 
        ? 'https://api-fxtrade.oanda.com' 
        : 'https://api-fxpractice.oanda.com';

      const url = `${baseUrl}/v3/instruments/${instrument}/candles?granularity=${granularity || 'M15'}&count=${count || 100}`;
      console.log(`[OANDA Proxy] Fetching candles for ${instrument}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`[OANDA API Error] ${instrument}:`, result.errorMessage || response.statusText);
        return res.status(response.status).json({ 
          error: result.errorMessage || `Erreur OANDA (${response.status})`,
          instrument: instrument
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error('OANDA Candles Proxy Exception:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Broker Order Execution (OANDA v20 focus)
  app.post("/api/broker/order", authenticateToken, async (req, res) => {
    try {
      const { 
        symbol, side, volume, price, stopLoss, takeProfit, 
        environment: clientEnv,
        apiKey: clientKey,
        accountId: clientAccount
      } = req.body;
      
      // Prioritize client-provided keys (from UI) or fallback to server ENV
      const apiKey = clientKey || process.env.BROKER_API_KEY;
      const accountId = clientAccount || process.env.BROKER_ACCOUNT_ID;
      const environment = clientEnv || process.env.BROKER_ENVIRONMENT || 'practice'; 
      
      const isDemo = !apiKey || !accountId;
      
      if (isDemo) {
        console.log(`[OANDA SIMULATION] Order: ${side} ${volume} ${symbol} at ${price}`);
        return res.json({
          status: 'success',
          id: `OAN-SIM-${Math.floor(Math.random() * 100000)}`,
          message: 'SIMULATION: Ordre envoyé avec succès au simulateur OANDA (Mode Démo)',
          details: req.body
        });
      }

      // OANDA v20 API logic
      const baseUrl = environment === 'live' 
        ? 'https://api-fxtrade.oanda.com' 
        : 'https://api-fxpractice.oanda.com';

      // Map symbol (Yahoo format "BTC-USD" -> OANDA format "BTC_USD")
      const oandaSymbol = symbol.replace('-', '_');

      const orderPayload = {
        order: {
          units: side === 'BUY' ? volume.toString() : `-${volume}`,
          instrument: oandaSymbol,
          timeInForce: "GTC",
          type: price ? "LIMIT" : "MARKET",
          price: price?.toString(),
          stopLossOnFill: stopLoss ? { price: stopLoss.toString() } : undefined,
          takeProfitOnFill: takeProfit ? { price: takeProfit.toString() } : undefined,
        }
      };

      const response = await fetch(`${baseUrl}/v3/accounts/${accountId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.errorMessage || "Erreur lors de l'envoi de l'ordre au broker OANDA");
      }

      res.json({
        status: 'success',
        id: result.orderCreateTransaction?.id || result.lastTransactionID,
        message: 'Ordre réel transmis à OANDA avec succès.',
        details: result
      });

    } catch (error: any) {
      console.error('OANDA API Error:', error);
      res.status(500).json({ error: error.message });
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
