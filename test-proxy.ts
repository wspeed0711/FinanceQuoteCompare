import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';

async function test() {
  try {
    const envAgent = new EnvHttpProxyAgent();
    setGlobalDispatcher(envAgent);
    console.log("Successfully set global dispatcher!");
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

test();
