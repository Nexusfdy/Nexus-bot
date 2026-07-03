const title = "New Donation!";
const description = "Fulan just donated Rp10.000";
let content = ` ${title} ${description}`;
const saweriaMatch = content.match(/(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i);
console.log(saweriaMatch[1].trim());
