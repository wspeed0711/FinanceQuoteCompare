import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { format, parseISO, subMonths, subYears, startOfYear } from "date-fns";
import { Activity, AlertCircle, Calendar, Plus, X, Search, Loader2 } from "lucide-react";

interface MarketData {
  date: string;
  [key: string]: any;
}

interface SymbolItem {
  symbol: string;
  name: string;
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export default function App() {
  const today = new Date();
  const defaultStart = "2026-01-01";
  const defaultEnd = format(today, "yyyy-MM-dd");

  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [symbols, setSymbols] = useState<SymbolItem[]>([
    { symbol: "^GSPC", name: "S&P 500" },
    { symbol: "000300.SS", name: "CSI 300" }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const quickOptions = [
    { label: "最近1月", getDates: () => [format(subMonths(today, 1), "yyyy-MM-dd"), format(today, "yyyy-MM-dd")] },
    { label: "最近3个月", getDates: () => [format(subMonths(today, 3), "yyyy-MM-dd"), format(today, "yyyy-MM-dd")] },
    { label: "最近6个月", getDates: () => [format(subMonths(today, 6), "yyyy-MM-dd"), format(today, "yyyy-MM-dd")] },
    { label: "最近1年", getDates: () => [format(subYears(today, 1), "yyyy-MM-dd"), format(today, "yyyy-MM-dd")] },
    { label: "最近2年", getDates: () => [format(subYears(today, 2), "yyyy-MM-dd"), format(today, "yyyy-MM-dd")] },
    { label: "最近3年", getDates: () => [format(subYears(today, 3), "yyyy-MM-dd"), format(today, "yyyy-MM-dd")] },
    { label: "最近5年", getDates: () => [format(subYears(today, 5), "yyyy-MM-dd"), format(today, "yyyy-MM-dd")] },
    { label: "今年以来", getDates: () => [format(startOfYear(today), "yyyy-MM-dd"), format(today, "yyyy-MM-dd")] },
  ];

  const currentYear = today.getFullYear();
  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchData = async () => {
      if (symbols.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const symbolParam = symbols.map(s => s.symbol).join(',');
        const response = await fetch(`/api/market-data?symbols=${encodeURIComponent(symbolParam)}&startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
          throw new Error("Failed to fetch market data");
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, symbols]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search-symbol?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddSymbol = (item: any) => {
    if (symbols.length >= 5) return;
    if (symbols.some(s => s.symbol === item.symbol)) return;
    
    setSymbols([...symbols, { symbol: item.symbol, name: item.name }]);
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleRemoveSymbol = (symbolToRemove: string) => {
    if (symbols.length <= 1) return;
    setSymbols(symbols.filter(s => s.symbol !== symbolToRemove));
  };

  const formatXAxis = (tickItem: string) => {
    try {
      return format(parseISO(tickItem), "MMM d");
    } catch {
      return tickItem;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900 mb-2">
            {format(parseISO(label), "MMMM d, yyyy")}
          </p>
          {payload.map((entry: any, index: number) => {
            const rawKey = entry.dataKey.replace("Percent", "");
            const rawValue = entry.payload[rawKey];
            return (
              <div key={index} className="flex items-center gap-2 text-sm mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium" style={{ color: entry.color }}>
                  {entry.name}:
                </span>
                <span className="text-slate-700">
                  {entry.value?.toFixed(2)}%
                </span>
                <span className="text-slate-400 text-xs ml-2">
                  ({rawValue?.toFixed?.(2) ?? 'N/A'})
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Global Markets Comparison
            </h1>
          </div>
          <p className="text-slate-500 text-lg">
            Compare up to 5 market indices or stocks
          </p>
        </header>

        <main className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          
          {/* Symbol Management */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              {symbols.map((s, i) => (
                <div key={s.symbol} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="font-medium text-slate-700">{s.name}</span>
                  <span className="text-slate-400 text-xs">({s.symbol})</span>
                  <button 
                    onClick={() => handleRemoveSymbol(s.symbol)}
                    disabled={symbols.length <= 1}
                    className="ml-1 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  disabled={symbols.length >= 5}
                  className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  添加标的 ({symbols.length}/5)
                </button>

                {showSearch && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="输入名称、代码或拼音首字母 (如 AAPL, 茅台, 易方达)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full focus:outline-none text-sm"
                      />
                      {isSearching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.map((res, i) => (
                          <button
                            key={i}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddSymbol(res);
                            }}
                            disabled={symbols.some(s => s.symbol === res.symbol)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col disabled:opacity-50"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-slate-800">{res.name}</span>
                              <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{res.type}</span>
                            </div>
                            <span className="text-xs text-slate-400">{res.symbol} &middot; {res.exchange}</span>
                          </button>
                        ))
                      ) : searchQuery.length >= 2 && !isSearching ? (
                        <div className="p-4 text-center text-sm text-slate-500">未找到相关标的</div>
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-400">输入至少2个字符进行搜索</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8 items-start justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex flex-wrap gap-2 items-start">
              {quickOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    const [start, end] = opt.getDates();
                    setStartDate(start);
                    setEndDate(end);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg transition-all shadow-sm"
                >
                  {opt.label}
                </button>
              ))}
              <select
                onChange={(e) => {
                  const year = parseInt(e.target.value);
                  if (!isNaN(year)) {
                    const start = `${year}-01-01`;
                    const end = year === currentYear ? format(today, "yyyy-MM-dd") : `${year}-12-31`;
                    setStartDate(start);
                    setEndDate(end);
                  }
                }}
                className="px-3 py-2 text-sm font-medium bg-white border border-slate-200 hover:border-blue-300 text-slate-600 rounded-lg transition-all shadow-sm focus:outline-none cursor-pointer"
                value=""
              >
                <option value="" disabled>按年份选择</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 h-[38px] bg-white rounded-lg border border-slate-200 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm text-slate-700 focus:outline-none bg-transparent cursor-pointer bg-white"
              />
              <span className="text-slate-300">至</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={format(today, "yyyy-MM-dd")}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm text-slate-700 focus:outline-none bg-transparent cursor-pointer bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p>Fetching market data...</p>
            </div>
          ) : error ? (
            <div className="h-[500px] flex flex-col items-center justify-center text-red-500 space-y-4">
              <AlertCircle className="w-12 h-12 opacity-50" />
              <p className="text-lg font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 space-y-4">
              <AlertCircle className="w-12 h-12 opacity-50" />
              <p className="text-lg font-medium">No data available for the selected date range.</p>
            </div>
          ) : (
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxis}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickMargin={12}
                    minTickGap={30}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  
                  {symbols.map((s, i) => {
                    const safeKey = s.symbol.replace(/[^a-zA-Z0-9]/g, '_');
                    return (
                      <Line
                        key={s.symbol}
                        type="monotone"
                        dataKey={`${safeKey}Percent`}
                        name={s.name}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        connectNulls={true}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </main>
        
        <footer className="text-center text-sm text-slate-400">
          Data provided by Yahoo Finance. Normalized to percentage change from the start of the selected period.
        </footer>
      </div>
    </div>
  );
}
