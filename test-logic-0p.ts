import axios from 'axios';

let cachedFunds: any[] = [];

async function getEastmoneyFunds() {
  try {
    const url = 'http://fund.eastmoney.com/js/fundcode_search.js';
    const res = await axios.get(url);
    const match = res.data.match(/var r = (\[.*\]);/);
    if (match && match[1]) {
      const funds = JSON.parse(match[1]);
      cachedFunds = funds.map((f: any) => ({
        code: f[0],
        pinyin: f[1],
        name: f[2],
        type: f[3],
        pinyinFull: f[4]
      }));
      return cachedFunds;
    }
  } catch (error) {
    console.error("Failed to fetch Eastmoney fund list:", error);
  }
  return cachedFunds;
}

async function test() {
  const funds = await getEastmoneyFunds();
  const q = '0P000019C5';
  const lowerQ = q.toLowerCase().trim();
  
  const terms = lowerQ.split(/\s+/);
  
  const matchedFunds = funds.filter(f => {
    const codeMatch = f.code.includes(lowerQ);
    const pinyinMatch = f.pinyin.toLowerCase().includes(lowerQ);
    
    const nameLower = f.name.toLowerCase();
    const nameMatch = terms.every(term => nameLower.includes(term));
    
    let fuzzyNameMatch = false;
    if (lowerQ.length > 6 && !nameMatch) {
      const part1 = lowerQ.substring(0, 4);
      const part2 = lowerQ.substring(lowerQ.length - 3);
      if (nameLower.includes(part1) && nameLower.includes(part2)) {
        fuzzyNameMatch = true;
      }
    }

    return codeMatch || pinyinMatch || nameMatch || fuzzyNameMatch;
  }).slice(0, 10);
  
  console.log(matchedFunds);
}
test();
