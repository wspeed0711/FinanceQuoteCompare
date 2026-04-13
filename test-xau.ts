import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
  try {
    const q = await yahooFinance.quote('XAUUSD=X');
    console.log("XAUUSD=X:", q);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
