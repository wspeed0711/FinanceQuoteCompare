import axios from 'axios';

async function test() {
  try {
    const url = 'https://searchapi.eastmoney.com/api/suggest/get?input=GSPC&type=14&token=D43BF722C8E33BDC906FB84D85E326E8';
    const res = await axios.get(url);
    console.log("GSPC:", res.data.QuotationCodeTable.Data);

    const url2 = 'https://searchapi.eastmoney.com/api/suggest/get?input=SPX&type=14&token=D43BF722C8E33BDC906FB84D85E326E8';
    const res2 = await axios.get(url2);
    console.log("SPX:", res2.data.QuotationCodeTable.Data);
  } catch (e: any) {
    console.error(e.message);
  }
}

test();
