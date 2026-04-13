import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/search-symbol?q=wti');
    console.log("Search results:", JSON.stringify(res.data, null, 2));
    
    const res2 = await axios.get('http://localhost:3000/api/market-data?symbols=SINA_CL,SINA_XAG&startDate=2024-01-01&endDate=2024-04-01');
    console.log("Market data length:", res2.data.length);
    if (res2.data.length > 0) {
      console.log("Sample:", res2.data[0]);
    }
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
