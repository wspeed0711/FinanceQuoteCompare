import axios from 'axios';

async function test() {
  try {
    const q = 'XAUUSD';
    const emUrl = `http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(q)}`;
    const emRes = await axios.get(emUrl);
    console.log("Eastmoney search:", JSON.stringify(emRes.data, null, 2));
    
    // Also try Sina Finance
    const sinaUrl = `https://hq.sinajs.cn/list=hf_XAU`;
    const sinaRes = await axios.get(sinaUrl);
    console.log("Sina Finance:", sinaRes.data);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
