import YahooFinance from 'yahoo-finance2';
async function test() {
   const yahooFinance = new YahooFinance();
   try {
     const data = await yahooFinance.chart('0P00000GDW.L', { period1: '2024-01-01', interval: '1d' });
     console.log('0P00000GDW.L data length:', data.quotes.length);
   } catch (e:any) {
     console.log(e.message);
   }
}
test();
