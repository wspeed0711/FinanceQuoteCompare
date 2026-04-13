import axios from 'axios';

async function test() {
  try {
    const sinaUrl = `https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var=/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=XAU`;
    const sinaRes = await axios.get(sinaUrl, {
      headers: {
        'Referer': 'https://finance.sina.com.cn/'
      }
    });
    
    const match = sinaRes.data.match(/var=\((.*)\)/);
    if (match && match[1]) {
      const data = JSON.parse(match[1]);
      console.log("Total records:", data.length);
      console.log("Last 3 records:", data.slice(-3));
    }
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
