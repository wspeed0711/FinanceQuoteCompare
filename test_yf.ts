import { YahooFinance } from 'yahoo-finance2';
const yf = new YahooFinance();
async function test() {
  try {
    const res = await yf.search('AAPL');
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
}
test();
