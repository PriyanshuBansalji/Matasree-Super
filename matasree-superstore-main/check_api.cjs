const http = require('http');

http.get('http://localhost:5001/api/products?limit=6&sort=-sold', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json, null, 2).substring(0, 1000));
  });
});
