import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
  try {
    const res = await yahooFinance.search('DXY');
    console.log("Search DXY:", res.quotes.map(q => ({ symbol: q.symbol, name: q.shortname })));
    
    const chart = await yahooFinance.chart('DX-Y.NYB', { period1: '2024-01-01' });
    console.log("Chart DX-Y.NYB length:", chart.quotes.length);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
