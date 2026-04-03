import YahooFinance from 'yahoo-finance2';
const yf = new YahooFinance();
async function test() {
  try {
    const res = await yf.chart('AAPL', { period1: '2023-01-01', period2: '2023-01-10', interval: '1d' });
    console.log(JSON.stringify(res.quotes.slice(0, 2), null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
