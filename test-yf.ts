import YahooFinance from 'yahoo-finance2';

async function test() {
  const yf = new YahooFinance();
  const chart = await yf.chart('AAPL', { period1: '2024-01-01', period2: '2024-01-10' });
  console.log("Yahoo chart sample:", chart.quotes[0]);
}
test();
