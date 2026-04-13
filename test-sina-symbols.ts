import axios from 'axios';

async function test() {
  try {
    const symbols = ['CL'];
    for (const sym of symbols) {
      const sinaUrl = `https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var=/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${sym}`;
      const sinaRes = await axios.get(sinaUrl, {
        headers: {
          'Referer': 'https://finance.sina.com.cn/'
        }
      });
      
      const match = sinaRes.data.match(/var=\((.*)\)/);
      if (match && match[1]) {
        const data = JSON.parse(match[1]);
        console.log(`${sym} records:`, data.length, data[data.length - 1]);
      } else {
        console.log(`${sym} failed to parse`);
      }
    }
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
