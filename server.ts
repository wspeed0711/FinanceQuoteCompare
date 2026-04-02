import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/search-symbol", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') return res.json([]);
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      const quotes = response.data.quotes || [];
      const results = quotes
        .filter((q: any) => ['EQUITY', 'INDEX', 'ETF', 'MUTUALFUND', 'CURRENCY', 'CRYPTOCURRENCY'].includes(q.quoteType))
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          type: q.quoteType,
          exchange: q.exchange
        }));
      res.json(results);
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
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;
        const response = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          }
        });
        
        const result = response.data?.chart?.result?.[0];
        if (!result) return [];

        const timestamps = result.timestamp || [];
        const closePrices = result?.indicators?.quote?.[0]?.close || [];

        return timestamps.map((t: number, i: number) => ({
          date: new Date(t * 1000).toISOString().split('T')[0],
          price: closePrices[i]
        })).filter((d: any) => d.price !== null && d.price !== undefined);
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
