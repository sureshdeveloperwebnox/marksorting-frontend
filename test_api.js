const axios = require('axios');

const API_URL = 'http://localhost:4000/api/v1'; // Let's check what the API port is. Usually it is 3001.

async function test() {
  try {
    const res1 = await axios.get(`${API_URL}/master-mills`, {
      params: { search: 'A-1 Kaju India', skip: 0, take: 10 }
    });
    console.log('--- GET /master-mills ---');
    console.log(JSON.stringify(res1.data, null, 2));
  } catch (err) {
    console.error('Error fetching /master-mills:', err.message);
  }

  try {
    const res2 = await axios.get(`${API_URL}/master-mills/prefill`, {
      params: { search: 'A-1 Kaju India' }
    });
    console.log('--- GET /master-mills/prefill ---');
    console.log(JSON.stringify(res2.data, null, 2));
  } catch (err) {
    console.error('Error fetching /master-mills/prefill:', err.message);
  }
}

test();
