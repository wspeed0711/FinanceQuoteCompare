import YahooFinance from 'yahoo-finance2';

async function test() {
  const yf = new YahooFinance();
  const chartGold = await yf.chart('GC=F', { period1: '2024-01-01' });
  console.log("Gold Chart points:", chartGold.quotes.length);

  const chartWTI = await yf.chart('CL=F', { period1: '2024-01-01' });
  console.log("WTI Chart points:", chartWTI.quotes.length);
}

test();
