import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/market-data?symbols=0P000019C5&startDate=2026-03-01&endDate=2026-04-10');
    console.log("Data length:", res.data.length);
    if (res.data.length > 0) {
      console.log("Last item:", res.data[res.data.length - 1]);
    } else {
      console.log("No data returned!");
    }
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
