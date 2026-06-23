const axios = require('axios');

const API_URL = 'http://localhost:4000/api/v1';

async function test() {
  try {
    const res = await axios.get(`${API_URL}/master-mills`, {
      params: { type: 'Service', skip: 0, take: 10 }
    });
    console.log('--- GET /master-mills with type: Service ---');
    console.log('Total returned:', res.data.total);
    console.log('Records returned count:', res.data.masterMills.length);
    res.data.masterMills.forEach(m => {
      console.log(`- ID: ${m.id}, Invoice: ${m.invoice_no}, Ref: ${m.ref_no}, Type: ${m.type}`);
    });
  } catch (err) {
    console.error('Error fetching /master-mills:', err.message);
  }
}

test();
