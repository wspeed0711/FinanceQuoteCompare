import { setGlobalDispatcher, Agent } from 'undici';
import YahooFinance from 'yahoo-finance2';

const agent = new Agent({
  connect: { family: 4 }
});
setGlobalDispatcher(agent);

async function test() {
  try {
    const yahooFinance = new YahooFinance();
    const res = await yahooFinance.search('AAPL');
    console.log("Success:", res.quotes.length);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

test();
