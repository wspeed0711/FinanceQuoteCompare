import axios from 'axios';

async function test() {
  const q = '000369';
  const emUrl = `http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(q)}`;
  const emRes = await axios.get(emUrl);
  console.log(JSON.stringify(emRes.data, null, 2));
}
test();
