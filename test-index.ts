import axios from 'axios';

async function testTencent() {
  try {
    const url = 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh000300,day,,,10000,qfq';
    const res = await axios.get(url);
    const data = res.data.data.sh000300;
    const klines = data.day || data.qfqday;
    console.log("Tencent Data Length:", klines.length);
    console.log("First:", klines[0]);
    console.log("Last:", klines[klines.length - 1]);
  } catch(e: any) {
    console.error("Tencent:", e.message);
  }
}

async function testSina() {
  try {
    const url = 'http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh000300&scale=240&ma=no&datalen=10000';
    const res = await axios.get(url);
    console.log("Sina Data Length:", res.data.length);
    if(res.data.length > 0) {
      console.log("First:", res.data[0]);
      console.log("Last:", res.data[res.data.length - 1]);
    }
  } catch(e: any) {
    console.error("Sina:", e.message);
  }
}

async function main() {
  await testTencent();
  await testSina();
}
main();
