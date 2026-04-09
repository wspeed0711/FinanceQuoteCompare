import axios from 'axios';

async function test() {
  const url = 'http://fund.eastmoney.com/js/fundcode_search.js';
  const res = await axios.get(url);
  const text = res.data;
  console.log("Length:", text.length);
  console.log("Sample:", text.substring(0, 200));
}
test();
