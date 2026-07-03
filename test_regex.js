const title = "New Donation!";
const description = "**Fulan** just donated **Rp10.000**";
let content = ` ${title} ${description}`.replace(/\*/g, '');
const m = content.match(/(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i);
console.log(m ? m[1].trim() : null);
