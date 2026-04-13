import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/market-data?symbols=0P000019C5&startDate=2024-01-01&endDate=2024-04-01');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
