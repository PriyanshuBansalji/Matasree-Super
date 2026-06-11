const axios = require('axios');

async function test() {
  try {
    const email = `test${Date.now()}@test.com`;
    console.log('Registering user...', email);
    
    // Register
    await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test User',
      email,
      password: 'password123'
    });

    // Login
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email,
      password: 'password123'
    });
    const token = loginRes.data.data.accessToken;
    
    // Get products
    const productsRes = await axios.get('http://localhost:5001/api/products');
    const product = productsRes.data.data.products[0];
    
    if (!product) {
      console.log('No products found');
      return;
    }

    // Call sync
    console.log('Syncing cart...');
    try {
      const syncRes = await axios.post('http://localhost:5001/api/cart/sync', {
        items: [
          {
            productId: product._id,
            quantity: 1,
            clientPrice: product.price
          }
        ]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Success:', syncRes.data);
    } catch (syncErr) {
      console.error('SYNC ERROR:', syncErr.response?.data || syncErr.message);
    }
  } catch (err) {
    console.error('Error in test:', err.message);
  }
}
test();
