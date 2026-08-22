const https = require('https');
https.get('https://splinzo.in', (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => {
        const matches = data.match(/<link[^>]*rel="[^"]*icon[^"]*"[^>]*>/gi);
        console.log('Icons found:', matches);
      });
    });
  } else {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const matches = data.match(/<link[^>]*rel="[^"]*icon[^"]*"[^>]*>/gi);
      console.log('Icons found:', matches);
    });
  }
});
