import axios from 'axios';

async function test() {
  try {
    const sinaUrl = `https://hq.sinajs.cn/list=hf_XAU`;
    const sinaRes = await axios.get(sinaUrl, {
      headers: {
        'Referer': 'https://finance.sina.com.cn/'
      }
    });
    console.log("Sina Finance:", sinaRes.data);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
