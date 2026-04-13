import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/market-data?symbols=^GSPC,000300.SS,0P000019C5&startDate=2024-01-01&endDate=2024-04-01');
    console.log("Data length:", res.data.length);
    console.log("Sample:", res.data[0]);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
