import axios from 'axios';

async function test() {
  const dataUrl = `http://fund.eastmoney.com/pingzhongdata/005827.js`; // Example fund
  const dataRes = await axios.get(dataUrl);
  const text = dataRes.data;
  
  console.log("Has Data_netWorthTrend:", text.includes("Data_netWorthTrend"));
  console.log("Has Data_ACWorthTrend:", text.includes("Data_ACWorthTrend"));
  
  const match = text.match(/var Data_ACWorthTrend = (\[.*?\]);/);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log("Data_ACWorthTrend sample:", data.slice(-3));
  }
}
test();
