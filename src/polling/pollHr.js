//@ts-nocheck

const { parentPort } = require('worker_threads');
const node_fetch = require('node-fetch');

parentPort.on('message', async (data) => {
  while (true) {

    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application'
      }
    };

    // const startTime = Date.now();
    try {
      const data = await (await node_fetch(`${process.env.MOCK_SERVER_IP}/hr/status`, requestOptions)).json();
      parentPort.postMessage(data);
    } catch(error) {
      console.log(error.code);
    }
    // const timeSpent = (Date.now() - startTime);
    await sleep(5000);
  }
});

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}