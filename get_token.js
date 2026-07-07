const fs = require('fs');
console.log(fs.readFileSync('./server/admin_token.txt', 'utf8').trim());
