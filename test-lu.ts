import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
async function test() {
  const isin = 'LU0056508442';
  try {
     const searchRes = await yahooFinance.search(isin);
     console.log('Search:', JSON.stringify(searchRes.quotes, null, 2));
  } catch(e: any) {
     console.log(e.message);
  }
}
test();
