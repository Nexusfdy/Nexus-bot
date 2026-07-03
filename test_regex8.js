let content = ` New Donation! Fulan just donated Rp10.000`;
const match = content.match(/(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i);
console.log(JSON.stringify(match[1]));
