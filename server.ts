import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import YahooFinance from 'yahoo-finance2';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Configure proxy if environment variables are present
const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;
let fetchOptions = {};

if (proxyUrl) {
  console.log(`Using proxy: ${proxyUrl}`);
  const agent = new HttpsProxyAgent(proxyUrl);
  fetchOptions = { agent };
}

const yahooFinance = new YahooFinance();

// Apply proxy to yahoo-finance2 if configured
if (proxyUrl) {
  yahooFinance._opts.fetchOptions = fetchOptions;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.get("/api/search-symbol", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') return res.json([]);
      
      const results = await yahooFinance.search(q, {
        quotesCount: 10,
        newsCount: 0
      });
      
      const formattedResults = (results.quotes || [])
        .filter((q: any) => ['EQUITY', 'INDEX', 'ETF', 'MUTUALFUND', 'CURRENCY', 'CRYPTOCURRENCY'].includes(q.quoteType))
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          type: q.quoteType,
          exchange: q.exchange
        }));
        
      res.json(formattedResults);
    } catch (error: any) {
      console.error("Search error:", error.message);
      res.status(500).json({ error: "Failed to search symbols" });
    }
  });

  app.get("/api/market-data", async (req, res) => {
    try {
      const { startDate, endDate, symbols } = req.query;

      if (!symbols || typeof symbols !== 'string') {
        return res.status(400).json({ error: "No symbols provided" });
      }

      const symbolList = symbols.split(',');

      let startStr = typeof startDate === 'string' && startDate.trim() !== '' ? startDate : "2026-01-01";
      let endStr = typeof endDate === 'string' && endDate.trim() !== '' ? endDate : new Date().toISOString().split('T')[0];

      let startTimestamp = Math.floor(new Date(`${startStr}T00:00:00Z`).getTime() / 1000);
      let endTimestamp = Math.floor(new Date(`${endStr}T23:59:59Z`).getTime() / 1000);

      if (isNaN(startTimestamp)) {
        startStr = "2026-01-01";
        startTimestamp = Math.floor(new Date(`${startStr}T00:00:00Z`).getTime() / 1000);
      }
      if (isNaN(endTimestamp)) {
        endStr = new Date().toISOString().split('T')[0];
        endTimestamp = Math.floor(new Date(`${endStr}T23:59:59Z`).getTime() / 1000);
      }

      if (startTimestamp > endTimestamp) {
        const temp = startTimestamp;
        startTimestamp = endTimestamp;
        endTimestamp = temp;
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (startTimestamp > currentTimestamp) {
        startTimestamp = currentTimestamp - 86400 * 30; // Fallback to 30 days ago
      }
      if (endTimestamp > currentTimestamp) {
        endTimestamp = currentTimestamp;
      }

      if (endTimestamp - startTimestamp < 86400) {
        endTimestamp = startTimestamp + 86400;
      }

      const fetchYahooData = async (ticker: string) => {
        try {
          const queryOptions = {
            period1: new Date(startTimestamp * 1000),
            period2: new Date(endTimestamp * 1000),
            interval: '1d' as const
          };
          
          const result = await yahooFinance.chart(ticker, queryOptions);
          
          if (!result || !result.quotes || result.quotes.length === 0) return [];

          return result.quotes.map((item: any) => ({
            date: item.date.toISOString().split('T')[0],
            price: item.close
          })).filter((d: any) => d.price !== null && d.price !== undefined);
        } catch (error: any) {
          console.error(`Yahoo API Error for ${ticker}:`, error.message);
          throw error;
        }
      };

      const results = await Promise.all(symbolList.map(sym => fetchYahooData(sym).catch((e) => {
        console.error(`Error fetching ${sym}:`, e.message);
        return [];
      })));

      // Merge data by date
      const mergedData: Record<string, any> = {};

      results.forEach((symbolData, index) => {
        const sym = symbolList[index];
        const safeKey = sym.replace(/[^a-zA-Z0-9]/g, '_');
        symbolData.forEach((d: any) => {
          if (!mergedData[d.date]) {
            mergedData[d.date] = { date: d.date };
          }
          mergedData[d.date][safeKey] = d.price;
        });
      });

      const sortedData = Object.values(mergedData).sort((a: any, b: any) => a.date.localeCompare(b.date));

      // Forward fill missing data (e.g. when one market is closed but the other is open)
      const lastValues: Record<string, number | null> = {};
      symbolList.forEach(sym => lastValues[sym.replace(/[^a-zA-Z0-9]/g, '_')] = null);

      const filledData = sortedData.map((d: any) => {
        symbolList.forEach(sym => {
          const safeKey = sym.replace(/[^a-zA-Z0-9]/g, '_');
          if (d[safeKey] !== undefined) lastValues[safeKey] = d[safeKey];
          else if (lastValues[safeKey] !== null) d[safeKey] = lastValues[safeKey];
        });
        return d;
      });

      // Normalize to percentage change from the first valid data point
      const firstValues: Record<string, number | null> = {};
      symbolList.forEach(sym => firstValues[sym.replace(/[^a-zA-Z0-9]/g, '_')] = null);

      const normalizedData = filledData.map((d: any) => {
        const newD = { ...d };
        symbolList.forEach(sym => {
          const safeKey = sym.replace(/[^a-zA-Z0-9]/g, '_');
          if (d[safeKey] !== undefined && firstValues[safeKey] === null) firstValues[safeKey] = d[safeKey];
          
          if (d[safeKey] !== undefined && d[safeKey] !== null && firstValues[safeKey]) {
            newD[`${safeKey}Percent`] = ((d[safeKey] - firstValues[safeKey]!) / firstValues[safeKey]!) * 100;
          } else {
            newD[`${safeKey}Percent`] = null;
          }
        });
        return newD;
      });

      res.json(normalizedData);
    } catch (error: any) {
      console.error("Error fetching market data:", error.message);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
  });
}

startServer();
