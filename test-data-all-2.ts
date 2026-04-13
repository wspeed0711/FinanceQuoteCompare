import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/market-data?symbols=^GSPC,000300.SS,0P000019C5&startDate=2024-01-01&endDate=2024-04-01');
    const data = res.data;
    console.log("Data length:", data.length);
    const p5 = data.map((d: any) => d['0P000019C5Percent']);
    console.log("0P000019C5Percent:", p5);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
