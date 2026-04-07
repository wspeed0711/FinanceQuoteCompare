import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import YahooFinance from 'yahoo-finance2';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dns from 'node:dns';
import axios from 'axios';

// Force Node.js to use IPv4 first for DNS resolution.
// This fixes "fetch failed" errors on cloud platforms like Railway that have IPv6 routing issues.
dns.setDefaultResultOrder('ipv4first');

// Configure proxy if environment variables are present
const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;
let fetchOptions = {};

if (proxyUrl) {
  try {
    console.log(`Using proxy: ${proxyUrl}`);
    const agent = new HttpsProxyAgent(proxyUrl);
    fetchOptions = { agent };
  } catch (e) {
    console.error("Failed to setup proxy:", e);
  }
}

const yahooFinance = new YahooFinance();

// Apply proxy to yahoo-finance2 if configured
if (proxyUrl) {
  yahooFinance._opts.fetchOptions = fetchOptions;
}

async function startServer() {
  const app = express();
  // Railway provides PORT as a string, Express listen accepts string or number
  const PORT = process.env.PORT || 3000;

  // Health check endpoint for Railway
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  app.get("/api/search-symbol", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') return res.json([]);
      
      let formattedResults: any[] = [];
      
      try {
        const results = await yahooFinance.search(q, {
          quotesCount: 10,
          newsCount: 0
        });
        
        formattedResults = (results.quotes || [])
          .filter((q: any) => ['EQUITY', 'INDEX', 'ETF', 'MUTUALFUND', 'CURRENCY', 'CRYPTOCURRENCY'].includes(q.quoteType))
          .map((q: any) => ({
            symbol: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            type: q.quoteType,
            exchange: q.exchange
          }));
      } catch (error: any) {
        console.error("Yahoo search error:", error.message);
      }

      // Search Eastmoney for Chinese mutual funds
      try {
        const emUrl = `http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(q)}`;
        const emRes = await axios.get(emUrl);
        if (emRes.data && emRes.data.Datas) {
          const emResults = emRes.data.Datas
            .filter((item: any) => item.CATEGORYDESC === '基金' || item.CATEGORY === 700)
            .slice(0, 5)
            .map((item: any) => ({
              symbol: `F_${item.CODE}`,
              name: item.NAME,
              type: 'CN_FUND',
              exchange: 'Eastmoney'
            }));
          formattedResults = [...formattedResults, ...emResults];
        }
      } catch (error: any) {
        console.error("Eastmoney search error:", error.message);
      }
        
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
        if (ticker.startsWith('F_')) {
          const code = ticker.replace('F_', '');
          try {
            const dataUrl = `http://fund.eastmoney.com/pingzhongdata/${code}.js`;
            const dataRes = await axios.get(dataUrl);
            const match = dataRes.data.match(/var Data_netWorthTrend = (\[.*?\]);/);
            if (match && match[1]) {
              const data = JSON.parse(match[1]);
              return data
                .filter((item: any) => {
                  const itemTime = Math.floor(item.x / 1000);
                  return itemTime >= startTimestamp && itemTime <= endTimestamp;
                })
                .map((item: any) => {
                  // Eastmoney timestamps are UTC+8 00:00:00. Add 8 hours to get the correct UTC date string.
                  const dateObj = new Date(item.x + 8 * 3600 * 1000);
                  return {
                    date: dateObj.toISOString().split('T')[0],
                    price: item.y
                  };
                });
            }
            return [];
          } catch (error: any) {
             console.error(`Eastmoney API Error for ${ticker}:`, error.message);
             throw error;
          }
        }

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
          console.error(`Yahoo API Error for ${ticker}:`, error.message, error.cause || '');
          throw error;
        }
      };

      const results = await Promise.all(symbolList.map(sym => fetchYahooData(sym).catch((e) => {
        console.error(`Error fetching ${sym}:`, e.message, e.cause || '');
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

  const isProd = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT;

  if (!isProd) {
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
    console.log(`Server running on port ${PORT} (0.0.0.0) in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer();
