import axios from 'axios';

async function test() {
  const url = 'http://fund.eastmoney.com/js/fundcode_search.js';
  const res = await axios.get(url);
  const match = res.data.match(/var r = (\[.*\]);/);
  if (match && match[1]) {
    const funds = JSON.parse(match[1]);
    const found = funds.filter((f: any) => f[0] === '000369');
    console.log("000369:", found);
    
    const foundName = funds.filter((f: any) => f[2].includes('广发全球医疗保健'));
    console.log("Name match:", foundName);
  }
}
test();
