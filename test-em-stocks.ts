import axios from 'axios';

async function test() {
  try {
    // Test CSI 300
    const url1 = 'http://push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.000300&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=0&end=20500101&lmt=10';
    const res1 = await axios.get(url1);
    console.log("CSI 300:", res1.data.data.klines);

    // Test S&P 500
    const url2 = 'http://push2his.eastmoney.com/api/qt/stock/kline/get?secid=100.SPX&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=0&end=20500101&lmt=10';
    const res2 = await axios.get(url2);
    console.log("S&P 500:", res2.data.data.klines);
  } catch (e: any) {
    console.error(e.message);
  }
}

test();
