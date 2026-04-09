import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/search-symbol?q=000369');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
