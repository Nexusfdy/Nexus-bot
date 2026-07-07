const http = require('http');

const data = JSON.stringify({
  guildId: '1318806349118963722',
  ownerId: '1035189920488235120',
  serverManagement: { logChannelId: '', welcomeChannelId: '1318806349919944837' }
});

const req = http.request({
  hostname: 'localhost',
  port: 3000, // or 8080? Wait, the container port is 3000, no wait, the log says 8080
  path: '/api/config/server',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
