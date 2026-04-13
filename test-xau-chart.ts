import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
  try {
    const symbols = ['XAU=X', 'XAUUSD=X', 'GC=F'];
    for (const sym of symbols) {
      try {
        const chart = await yahooFinance.chart(sym, { period1: '2024-01-01', interval: '1d' });
        console.log(`Chart for ${sym}:`, chart.quotes.length, 'points');
      } catch (e: any) {
        console.log(`Error for ${sym}:`, e.message);
      }
    }
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
