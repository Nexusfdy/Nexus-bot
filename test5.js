let contentToParse = "";
contentToParse += `\nNew Donation!\nFulan just donated Rp10.000`;
const saweriaMatch = contentToParse.match(/(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i);
console.log(saweriaMatch[1].trim());
